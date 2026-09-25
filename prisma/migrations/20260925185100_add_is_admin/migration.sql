-- CreateEnum
CREATE TYPE "GlucoseEventType" AS ENUM ('LOW', 'HIGH');

-- CreateEnum
CREATE TYPE "GlucoseEventStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "EventInterventionType" AS ENUM ('CARBOHYDRATE', 'INSULIN');

-- AlterTable
ALTER TABLE "FollowUp" ADD COLUMN     "glucoseEventId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "GlucoseEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GlucoseEventType" NOT NULL,
    "status" "GlucoseEventStatus" NOT NULL DEFAULT 'OPEN',
    "initialGlucoseReadingId" TEXT NOT NULL,
    "hypoglycemiaPlanId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "migratedFromHypoglycemiaEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlucoseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventMeasurement" (
    "id" TEXT NOT NULL,
    "glucoseEventId" TEXT NOT NULL,
    "glucoseReadingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventIntervention" (
    "id" TEXT NOT NULL,
    "glucoseEventId" TEXT NOT NULL,
    "type" "EventInterventionType" NOT NULL,
    "food" TEXT,
    "carbohydrateGrams" DOUBLE PRECISION,
    "insulinEventId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlucoseEvent_initialGlucoseReadingId_key" ON "GlucoseEvent"("initialGlucoseReadingId");

-- CreateIndex
CREATE UNIQUE INDEX "GlucoseEvent_migratedFromHypoglycemiaEventId_key" ON "GlucoseEvent"("migratedFromHypoglycemiaEventId");

-- CreateIndex
CREATE INDEX "GlucoseEvent_userId_startedAt_idx" ON "GlucoseEvent"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventMeasurement_glucoseReadingId_key" ON "EventMeasurement"("glucoseReadingId");

-- CreateIndex
CREATE INDEX "EventMeasurement_glucoseEventId_idx" ON "EventMeasurement"("glucoseEventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventIntervention_insulinEventId_key" ON "EventIntervention"("insulinEventId");

-- CreateIndex
CREATE INDEX "EventIntervention_glucoseEventId_idx" ON "EventIntervention"("glucoseEventId");

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_glucoseEventId_fkey" FOREIGN KEY ("glucoseEventId") REFERENCES "GlucoseEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlucoseEvent" ADD CONSTRAINT "GlucoseEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlucoseEvent" ADD CONSTRAINT "GlucoseEvent_initialGlucoseReadingId_fkey" FOREIGN KEY ("initialGlucoseReadingId") REFERENCES "GlucoseReading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlucoseEvent" ADD CONSTRAINT "GlucoseEvent_hypoglycemiaPlanId_fkey" FOREIGN KEY ("hypoglycemiaPlanId") REFERENCES "HypoglycemiaPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMeasurement" ADD CONSTRAINT "EventMeasurement_glucoseEventId_fkey" FOREIGN KEY ("glucoseEventId") REFERENCES "GlucoseEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMeasurement" ADD CONSTRAINT "EventMeasurement_glucoseReadingId_fkey" FOREIGN KEY ("glucoseReadingId") REFERENCES "GlucoseReading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventIntervention" ADD CONSTRAINT "EventIntervention_glucoseEventId_fkey" FOREIGN KEY ("glucoseEventId") REFERENCES "GlucoseEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventIntervention" ADD CONSTRAINT "EventIntervention_insulinEventId_fkey" FOREIGN KEY ("insulinEventId") REFERENCES "InsulinEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
