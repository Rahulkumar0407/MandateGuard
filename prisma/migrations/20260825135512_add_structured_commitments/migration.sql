-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "isConfirmedByMerchant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "structuredCommitments" JSONB,
ADD COLUMN     "versionHash" TEXT;

-- CreateIndex
CREATE INDEX "Offer_versionHash_idx" ON "Offer"("versionHash");
