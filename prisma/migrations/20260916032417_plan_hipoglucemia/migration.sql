-- CreateEnum
CREATE TYPE "HypoglycemiaEventStatus" AS ENUM ('PENDING', 'TREATED', 'SEVERE', 'RESOLVED');

-- CreateTable
CREATE TABLE "HypoglycemiaPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lowThreshold" DOUBLE PRECISION NOT NULL,
    "fastCarbsG" DOUBLE PRECISION NOT NULL,
    "reassessMinutes" INTEGER NOT NULL,
    "productName" TEXT,
    "carbsPerProductUnit" DOUBLE PRECISION,
    "glucagonAvailable" BOOLEAN NOT NULL DEFAULT false,
    "glucagonInstructions" TEXT,
    "emergencyInstructions" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "changedByUserId" TEXT,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HypoglycemiaPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HypoglycemiaEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "glucoseReadingId" TEXT NOT NULL,
    "hypoglycemiaPlanId" TEXT,
    "status" "HypoglycemiaEventStatus" NOT NULL DEFAULT 'PENDING',
    "treatedAt" TIMESTAMP(3),
    "carbsConsumedG" DOUBLE PRECISION,
    "productUsed" TEXT,
    "severeMarkedAt" TIMESTAMP(3),
    "followUpId" TEXT,
    "resolvedGlucoseReadingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HypoglycemiaEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HypoglycemiaPlan_userId_effectiveFrom_idx" ON "HypoglycemiaPlan"("userId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "HypoglycemiaEvent_glucoseReadingId_key" ON "HypoglycemiaEvent"("glucoseReadingId");

-- CreateIndex
CREATE UNIQUE INDEX "HypoglycemiaEvent_followUpId_key" ON "HypoglycemiaEvent"("followUpId");

-- CreateIndex
CREATE UNIQUE INDEX "HypoglycemiaEvent_resolvedGlucoseReadingId_key" ON "HypoglycemiaEvent"("resolvedGlucoseReadingId");

-- CreateIndex
CREATE INDEX "HypoglycemiaEvent_userId_createdAt_idx" ON "HypoglycemiaEvent"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "HypoglycemiaPlan" ADD CONSTRAINT "HypoglycemiaPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HypoglycemiaEvent" ADD CONSTRAINT "HypoglycemiaEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HypoglycemiaEvent" ADD CONSTRAINT "HypoglycemiaEvent_glucoseReadingId_fkey" FOREIGN KEY ("glucoseReadingId") REFERENCES "GlucoseReading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HypoglycemiaEvent" ADD CONSTRAINT "HypoglycemiaEvent_hypoglycemiaPlanId_fkey" FOREIGN KEY ("hypoglycemiaPlanId") REFERENCES "HypoglycemiaPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HypoglycemiaEvent" ADD CONSTRAINT "HypoglycemiaEvent_followUpId_fkey" FOREIGN KEY ("followUpId") REFERENCES "FollowUp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HypoglycemiaEvent" ADD CONSTRAINT "HypoglycemiaEvent_resolvedGlucoseReadingId_fkey" FOREIGN KEY ("resolvedGlucoseReadingId") REFERENCES "GlucoseReading"("id") ON DELETE SET NULL ON UPDATE CASCADE;
