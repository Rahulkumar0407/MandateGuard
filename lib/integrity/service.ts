import { getMandateService, type MandateService } from "@/lib/mandate/service";
import {
  getMerchantOfferService,
  type MerchantOfferService,
} from "@/lib/merchant/service";
import type { OfferDetailDTO } from "@/lib/merchant/types";
import { evaluateIntegrity } from "./engine";
import { runSemanticEvaluation, getSemanticProvider } from "./semantic-provider";
import type { SemanticComparisonInput } from "./semantic";
import type {
  IntegrityBaseline,
  IntegrityCurrent,
  IntegrityReport,
  CombinedIntegrityReport,
} from "./types";

// Thrown for controlled integrity failures (e.g. unknown mandate).
export class IntegrityError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

// STEP 13 / 14 / 15 — service boundary.
//
// Loads the immutable snapshot (the source-of-truth baseline), selects the
// currently active version of the SAME product lineage, then runs the
// deterministic engine. It never reconstructs the baseline from the live Offer,
// never invents a current offer, and never crosses product boundaries.
export class IntegrityService {
  constructor(
    private readonly mandate: MandateService,
    private readonly merchant: MerchantOfferService,
  ) {}

  async evaluateMandate(mandateId: string): Promise<CombinedIntegrityReport> {
    const m = await this.mandate.getMandate(mandateId);
    if (!m) {
      throw new IntegrityError("Mandate not found.", 404);
    }
    const snapshot = m.snapshot;

    const baseline: IntegrityBaseline = {
      productId: snapshot.productId,
      offerVersion: snapshot.offerVersion,
      price: snapshot.price,
      currency: snapshot.currency,
      billingInterval: snapshot.billingInterval,
      duration: snapshot.duration,
      entitlementKeys: snapshot.entitlementKeys,
      refundWindowDays: snapshot.refundWindowDays,
    };

    // STEP 14 — identify the currently active version within the lineage.
    const offers = await this.merchant.listOffers();
    const lineageOffers = offers.filter(
      (o) => o.product.id === snapshot.productId,
    );

    // M4 deterministic report + semantic input. When no current offer exists
    // the deterministic engine short-circuits and semantics cannot run.
    let deterministicReport: IntegrityReport;
    let semanticInput: SemanticComparisonInput | null = null;

    if (lineageOffers.length === 0) {
      // STEP 14 — no active current offer: controlled CURRENT_OFFER_UNAVAILABLE.
      deterministicReport = evaluateIntegrity({
        mandateId,
        baseline,
        current: null,
      });
    } else {
      const currentOffer: OfferDetailDTO = lineageOffers.reduce((best, o) =>
        o.version > best.version ? o : best,
      );

      const current: IntegrityCurrent = {
        productId: currentOffer.product.id,
        offerVersion: currentOffer.version,
        price: currentOffer.price,
        currency: currentOffer.currency,
        billingInterval: currentOffer.billingInterval,
        duration: currentOffer.duration,
        entitlementKeys: currentOffer.entitlementKeys,
        refundWindowDays: currentOffer.refundPolicy.windowDays,
      };

      deterministicReport = evaluateIntegrity({ mandateId, baseline, current });

      // STEP 2/3 — only the semantic text fields are fed to the evaluator;
      // price/currency/duration/entitlements/refund stay the M4 domain.
      semanticInput = {
        baseline: {
          offerName: snapshot.offerName,
          description: snapshot.description,
          supportTerms: snapshot.supportTerms,
          semanticTerms: snapshot.semanticTerms,
        },
        current: {
          offerName: currentOffer.name,
          description: currentOffer.description,
          supportTerms: currentOffer.supportTerms,
          semanticTerms: currentOffer.semanticTerms,
        },
      };
    }

    // STEP 14/16 — run M5. The deterministic report is preserved intact; the
    // semantic result is appended. On any failure the status is UNAVAILABLE and
    // no semantic finding is fabricated.
    const { status, evaluation } = await runSemanticEvaluation(
      getSemanticProvider(),
      semanticInput,
    );

    return {
      ...deterministicReport,
      semanticStatus: status,
      semanticFindings: evaluation?.findings ?? [],
    };
  }
}

// --- Factory / test seam (no DI framework) --------------------------------

export function getIntegrityService(): IntegrityService {
  // Constructed fresh per call so it always honours the active repository
  // override (in-memory for tests). Underlying services are themselves cached.
  return new IntegrityService(getMandateService(), getMerchantOfferService());
}

export { evaluateIntegrity } from "./engine";
