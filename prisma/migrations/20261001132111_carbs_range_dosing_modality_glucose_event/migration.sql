-- CreateEnum
CREATE TYPE "DosingModality" AS ENUM ('CARB_RATIO', 'TIERED', 'FIXED_DOSE', 'MANUAL_ONLY');

-- CreateEnum
CREATE TYPE "RegimenVersionSource" AS ENUM ('DECLARED', 'CONFIRMED_BY_PROFESSIONAL', 'PENDING_REVIEW', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CarbsRange" AS ENUM ('ZERO', 'R1_15', 'R16_30', 'R31_45', 'R46_60', 'R61_90', 'OVER_90');

-- CreateEnum
CREATE TYPE "MealCarbsSource" AS ENUM ('MANUAL_EXACT', 'RANGE', 'FOOD_ITEMS', 'AI');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GlucoseEventStatus" ADD VALUE 'RESOLVED';
ALTER TYPE "GlucoseEventStatus" ADD VALUE 'NEEDS_REVIEW';

-- AlterEnum
ALTER TYPE "InsulinType" ADD VALUE 'PREMIXED';

-- AlterEnum
ALTER TYPE "InsulinUsage" ADD VALUE 'PREMIXED';

-- AlterTable
ALTER TABLE "GlucoseEvent" ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "symptoms" TEXT;

-- AlterTable
ALTER TABLE "InsulinRegimen" ADD COLUMN     "brandOrActiveIngredient" TEXT,
ADD COLUMN     "concentration" TEXT;

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "carbsRange" "CarbsRange",
ADD COLUMN     "carbsSource" "MealCarbsSource" NOT NULL DEFAULT 'MANUAL_EXACT';

-- AlterTable
ALTER TABLE "RegimenVersion" ADD COLUMN     "modality" "DosingModality",
ADD COLUMN     "professionalName" TEXT,
ADD COLUMN     "professionalNotes" TEXT,
ADD COLUMN     "source" "RegimenVersionSource" NOT NULL DEFAULT 'DECLARED';

-- CreateTable
CREATE TABLE "DosingTier" (
    "id" TEXT NOT NULL,
    "regimenVersionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "carbsFromG" DOUBLE PRECISION NOT NULL,
    "carbsToG" DOUBLE PRECISION,
    "units" DOUBLE PRECISION NOT NULL,
    "isCumulative" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DosingTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DosingTier_regimenVersionId_order_idx" ON "DosingTier"("regimenVersionId", "order");

-- AddForeignKey
ALTER TABLE "DosingTier" ADD CONSTRAINT "DosingTier_regimenVersionId_fkey" FOREIGN KEY ("regimenVersionId") REFERENCES "RegimenVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
