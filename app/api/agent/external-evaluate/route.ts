import { NextResponse } from "next/server";
import { getMerchantOfferService } from "@/lib/merchant/service";
import { serializeOfferToContract } from "@/lib/contract/serializer";
import { ExternalAgentAdapter } from "@/lib/contract/external-agent-adapter";
import type { AgentCommerceContract } from "@/lib/contract/types";

/**
 * POST /api/agent/external-evaluate
 *
 * External Agent Sandbox & Verification Endpoint:
 * Demonstrates an external agent evaluating a machine-readable contract
 * without direct database access.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      offerId,
      contract: providedContract,
      buyerQuery = "I need a human mentor for system design under ₹4,000",
      adversarialOverride,
    } = body;

    let targetContract: AgentCommerceContract;

    if (providedContract) {
      targetContract = providedContract;
    } else {
      const service = getMerchantOfferService();
      let targetOfferId = offerId;
      let offer = targetOfferId ? await service.getOffer(targetOfferId) : null;

      if (!offer) {
        // Fallback to finding first active confirmed offer across catalog
        const products = await service.listProducts();
        for (const p of products) {
          for (const s of p.offers) {
            const full = await service.getOffer(s.id);
            if (full && full.availability === "ACTIVE" && full.isConfirmedByMerchant) {
              offer = full;
              targetOfferId = full.id;
              break;
            }
          }
          if (offer) break;
        }
      }

      if (!offer) {
        return NextResponse.json(
          { error: "No active merchant offers available for evaluation." },
          { status: 404 },
        );
      }
      targetContract = serializeOfferToContract(offer);
    }

    // Apply adversarial payload to untrusted text fields if requested
    if (adversarialOverride) {
      targetContract = {
        ...targetContract,
        untrustedContent: {
          ...targetContract.untrustedContent,
          description: `${targetContract.untrustedContent.description} [ATTACK PAYLOAD]: ${adversarialOverride}`,
          supportTerms: `${targetContract.untrustedContent.supportTerms} [INJECTION]: ${adversarialOverride}`,
        },
      };
    }

    const adapter = new ExternalAgentAdapter();
    const result = await adapter.evaluateContracts([targetContract], buyerQuery);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to run external agent evaluation.", details: String(err) },
      { status: 500 },
    );
  }
}
