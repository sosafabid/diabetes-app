-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'REVERTED');

-- CreateEnum
CREATE TYPE "ReadingOrigin" AS ENUM ('MANUAL', 'IMPORT');

-- AlterTable
ALTER TABLE "GlucoseReading" ADD COLUMN     "deviceManufacturer" TEXT,
ADD COLUMN     "deviceModel" TEXT,
ADD COLUMN     "importBatchId" TEXT,
ADD COLUMN     "origin" "ReadingOrigin" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sourceType" "MeasurementSource" NOT NULL,
    "deviceManufacturer" TEXT,
    "deviceModel" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateRangeStart" TIMESTAMP(3),
    "dateRangeEnd" TIMESTAMP(3),
    "totalRows" INTEGER NOT NULL,
    "importedRows" INTEGER NOT NULL,
    "duplicateRows" INTEGER NOT NULL,
    "errorRows" INTEGER NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'PENDING',
    "errorDetails" JSONB,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportBatch_userId_importedAt_idx" ON "ImportBatch"("userId", "importedAt");

-- CreateIndex
CREATE INDEX "GlucoseReading_importBatchId_idx" ON "GlucoseReading"("importBatchId");

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlucoseReading" ADD CONSTRAINT "GlucoseReading_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
