-- CreateTable
CREATE TABLE "AuthorizationEnvelope" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "mandateId" TEXT,
    "authorizedOfferVersionId" TEXT NOT NULL,
    "authorizedOfferHash" TEXT NOT NULL,
    "baselineCommitments" JSONB NOT NULL,
    "financialConstraints" JSONB NOT NULL,
    "agentPermissions" JSONB NOT NULL,
    "tolerancePolicy" JSONB NOT NULL,
    "authorizationPolicyHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "AuthorizationEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthorizationEnvelope_mandateId_key" ON "AuthorizationEnvelope"("mandateId");

-- CreateIndex
CREATE INDEX "AuthorizationEnvelope_userId_idx" ON "AuthorizationEnvelope"("userId");

-- CreateIndex
CREATE INDEX "AuthorizationEnvelope_merchantId_idx" ON "AuthorizationEnvelope"("merchantId");

-- CreateIndex
CREATE INDEX "AuthorizationEnvelope_authorizedOfferVersionId_idx" ON "AuthorizationEnvelope"("authorizedOfferVersionId");

-- CreateIndex
CREATE INDEX "AuthorizationEnvelope_status_idx" ON "AuthorizationEnvelope"("status");

-- CreateIndex
CREATE INDEX "AuthorizationEnvelope_authorizedOfferHash_idx" ON "AuthorizationEnvelope"("authorizedOfferHash");

-- AddForeignKey
ALTER TABLE "AuthorizationEnvelope" ADD CONSTRAINT "AuthorizationEnvelope_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationEnvelope" ADD CONSTRAINT "AuthorizationEnvelope_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationEnvelope" ADD CONSTRAINT "AuthorizationEnvelope_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationEnvelope" ADD CONSTRAINT "AuthorizationEnvelope_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "Mandate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationEnvelope" ADD CONSTRAINT "AuthorizationEnvelope_authorizedOfferVersionId_fkey" FOREIGN KEY ("authorizedOfferVersionId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
