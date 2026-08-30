import type { MerchantOfferService } from "@/lib/merchant/service";
import type { OfferDetailDTO } from "@/lib/merchant/types";

/**
 * Catalog adapter for Buyer Retrieval.
 * Retrieves only active, merchant-confirmed, authoritative OfferVersions.
 */
export class BuyerCatalogAdapter {
  constructor(private readonly merchantService: MerchantOfferService) {}

  /**
   * Retrieves active, confirmed offers across the merchant catalog.
   * Optionally filters by product category.
   */
  async retrieveActiveConfirmedOffers(
    categoryFilter?: string,
  ): Promise<OfferDetailDTO[]> {
    const products = await this.merchantService.listProducts();
    const candidateOffers: OfferDetailDTO[] = [];

    const normalizedCategory = categoryFilter?.trim().toLowerCase().replace(/[\s-]+/g, "_");

    for (const product of products) {
      const productCategory = product.category?.trim().toLowerCase().replace(/[\s-]+/g, "_");

      // Category matching: accept if category is undefined, "unspecified", "interview_prep", or matches product category
      if (
        normalizedCategory &&
        normalizedCategory !== "unspecified" &&
        normalizedCategory !== "interview_prep"
      ) {
        // Allow semantic overlaps (e.g. system_design vs system_design_course)
        if (
          productCategory &&
          !productCategory.includes(normalizedCategory) &&
          !normalizedCategory.includes(productCategory)
        ) {
          continue;
        }
      }

      for (const summary of product.offers) {
        const fullOffer = await this.merchantService.getOffer(summary.id);
        if (!fullOffer) continue;

        // Invariant: Only ACTIVE and merchant-confirmed offers are discoverable for purchase
        if (
          fullOffer.availability === "ACTIVE" &&
          fullOffer.isConfirmedByMerchant === true &&
          fullOffer.versionHash
        ) {
          candidateOffers.push(fullOffer);
        }
      }
    }

    return candidateOffers;
  }
}
