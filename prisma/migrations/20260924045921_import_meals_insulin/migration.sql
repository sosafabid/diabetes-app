-- AlterTable
ALTER TABLE "ImportBatch" ADD COLUMN     "importedInsulinEvents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "importedMeals" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "InsulinEvent" ADD COLUMN     "importBatchId" TEXT,
ADD COLUMN     "origin" "ReadingOrigin" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "importBatchId" TEXT,
ADD COLUMN     "origin" "ReadingOrigin" NOT NULL DEFAULT 'MANUAL';

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsulinEvent" ADD CONSTRAINT "InsulinEvent_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
