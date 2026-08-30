import { NextResponse } from "next/server";
import { getMerchantOfferService } from "@/lib/merchant/service";
import { serializeCatalogToContracts } from "@/lib/contract/serializer";
import { PROTOCOL_CLAIMS, CLAIM_SAFETY_GUIDELINES } from "@/lib/contract/protocol-claims";

/**
 * GET /api/v1/contracts
 *
 * Public Machine-Readable Commerce Contract Discovery Endpoint.
 * Serves agent-readable contracts for all active, confirmed merchant offers.
 */
export async function GET() {
  try {
    const service = getMerchantOfferService();
    const products = await service.listProducts();

    const activeOffers = [];
    for (const product of products) {
      for (const summary of product.offers) {
        const full = await service.getOffer(summary.id);
        if (full && full.availability === "ACTIVE" && full.isConfirmedByMerchant) {
          activeOffers.push(full);
        }
      }
    }

    const contracts = serializeCatalogToContracts(activeOffers);

    return NextResponse.json(
      {
        protocol: "agentic-commerce-contract/v1",
        publishedAt: new Date().toISOString(),
        contractsCount: contracts.length,
        contracts,
        protocolClaims: PROTOCOL_CLAIMS,
        claimGuidelines: CLAIM_SAFETY_GUIDELINES,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate machine-readable contracts", details: String(error) },
      { status: 500 },
    );
  }
}
