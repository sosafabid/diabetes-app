-- CreateEnum
CREATE TYPE "GlucoseUnit" AS ENUM ('MGDL', 'MMOLL');

-- CreateEnum
CREATE TYPE "DiabetesType" AS ENUM ('TYPE_1', 'TYPE_2', 'GESTATIONAL', 'OTHER', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "InsulinType" AS ENUM ('RAPID', 'ULTRA_RAPID', 'SHORT', 'INTERMEDIATE', 'LONG', 'OTHER');

-- CreateEnum
CREATE TYPE "InsulinUsage" AS ENUM ('MEALS', 'CORRECTION', 'BASAL', 'OTHER');

-- CreateEnum
CREATE TYPE "MeasurementSource" AS ENUM ('BLOOD', 'CGM');

-- CreateEnum
CREATE TYPE "CgmTrend" AS ENUM ('STABLE', 'RISING', 'RISING_FAST', 'FALLING', 'FALLING_FAST');

-- CreateEnum
CREATE TYPE "GlucoseContext" AS ENUM ('BEFORE_MEAL', 'AFTER_MEAL', 'BEFORE_EXERCISE', 'AFTER_EXERCISE', 'BEFORE_SLEEP', 'SUSPECTED_HYPO', 'OTHER');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER');

-- CreateEnum
CREATE TYPE "InsulinPurpose" AS ENUM ('MEAL', 'CORRECTION', 'BASAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('WALKING', 'RUNNING', 'CYCLING', 'WEIGHTS', 'HIIT', 'SWIMMING', 'SPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "Intensity" AS ENUM ('LIGHT', 'MODERATE', 'INTENSE');

-- CreateEnum
CREATE TYPE "StressLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "SleepQuality" AS ENUM ('POOR', 'REGULAR', 'GOOD');

-- CreateEnum
CREATE TYPE "UnusualSituation" AS ENUM ('WORK', 'EMOTIONAL_STRESS', 'TRAVEL', 'OTHER');

-- CreateEnum
CREATE TYPE "SafetyStatus" AS ENUM ('OK', 'WARNING', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_GLUCOSE', 'HIGH_GLUCOSE', 'CALCULATION_BLOCKED', 'MISSING_DATA', 'CGM_ISSUE', 'RECENT_INTENSE_EXERCISE', 'ILLNESS_REPORTED', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'CSV', 'JSON');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "glucoseUnit" "GlucoseUnit" NOT NULL DEFAULT 'MGDL',
    "diabetesType" "DiabetesType",
    "timezone" TEXT NOT NULL DEFAULT 'America/Costa_Rica',
    "notificationPrefs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsulinRegimen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insulinName" TEXT NOT NULL,
    "insulinType" "InsulinType" NOT NULL,
    "usage" "InsulinUsage" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsulinRegimen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegimenVersion" (
    "id" TEXT NOT NULL,
    "insulinRegimenId" TEXT NOT NULL,
    "prescribedDose" DOUBLE PRECISION,
    "doseUnit" TEXT NOT NULL DEFAULT 'U',
    "schedule" TEXT,
    "frequency" TEXT,
    "carbRatio" DOUBLE PRECISION,
    "correctionFactor" DOUBLE PRECISION,
    "targetGlucoseLow" DOUBLE PRECISION,
    "targetGlucoseHigh" DOUBLE PRECISION,
    "notes" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "changedByUserId" TEXT,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegimenVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlucoseReading" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "glucoseValue" DOUBLE PRECISION NOT NULL,
    "unit" "GlucoseUnit" NOT NULL,
    "measurementSource" "MeasurementSource" NOT NULL,
    "cgmTrend" "CgmTrend",
    "context" "GlucoseContext",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlucoseReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "portionSize" DOUBLE PRECISION NOT NULL,
    "portionUnit" TEXT NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION,
    "fatG" DOUBLE PRECISION,
    "calories" DOUBLE PRECISION,
    "source" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "mealType" "MealType" NOT NULL,
    "carbsGDirect" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "aiEstimatedCarbsG" DOUBLE PRECISION,
    "aiEstimationConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealItem" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "foodItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MealItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitualMeal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "usualTime" TEXT,
    "carbsGEstimate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitualMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitualMealItem" (
    "id" TEXT NOT NULL,
    "habitualMealId" TEXT NOT NULL,
    "foodItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "HabitualMealItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsulinEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insulinRegimenId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "dose" DOUBLE PRECISION NOT NULL,
    "doseUnit" TEXT NOT NULL DEFAULT 'U',
    "purpose" "InsulinPurpose" NOT NULL,
    "mealId" TEXT,
    "doseCalculationId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsulinEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "intensity" "Intensity" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "reportedStress" "StressLevel",
    "sleepHours" DOUBLE PRECISION,
    "sleepQuality" "SleepQuality",
    "illnessReported" BOOLEAN NOT NULL DEFAULT false,
    "unusualSituation" "UnusualSituation",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContextEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoseCalculation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "algorithmVersion" TEXT NOT NULL,
    "inputValues" JSONB NOT NULL,
    "inputSources" JSONB NOT NULL,
    "parametersUsed" JSONB NOT NULL,
    "rulesTriggered" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "warnings" JSONB,
    "safetyStatus" "SafetyStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoseCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "summaryJson" JSONB NOT NULL,
    "filePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RegimenVersion_insulinRegimenId_effectiveFrom_idx" ON "RegimenVersion"("insulinRegimenId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "GlucoseReading_userId_timestamp_idx" ON "GlucoseReading"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "FoodItem_name_idx" ON "FoodItem"("name");

-- CreateIndex
CREATE INDEX "FoodItem_region_idx" ON "FoodItem"("region");

-- CreateIndex
CREATE INDEX "Meal_userId_timestamp_idx" ON "Meal"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "InsulinEvent_userId_timestamp_idx" ON "InsulinEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "ExerciseEvent_userId_timestamp_idx" ON "ExerciseEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "ContextEvent_userId_timestamp_idx" ON "ContextEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "DoseCalculation_userId_timestamp_idx" ON "DoseCalculation"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "Alert_userId_createdAt_idx" ON "Alert"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "InsulinRegimen" ADD CONSTRAINT "InsulinRegimen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegimenVersion" ADD CONSTRAINT "RegimenVersion_insulinRegimenId_fkey" FOREIGN KEY ("insulinRegimenId") REFERENCES "InsulinRegimen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlucoseReading" ADD CONSTRAINT "GlucoseReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealItem" ADD CONSTRAINT "MealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealItem" ADD CONSTRAINT "MealItem_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitualMeal" ADD CONSTRAINT "HabitualMeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitualMealItem" ADD CONSTRAINT "HabitualMealItem_habitualMealId_fkey" FOREIGN KEY ("habitualMealId") REFERENCES "HabitualMeal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsulinEvent" ADD CONSTRAINT "InsulinEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsulinEvent" ADD CONSTRAINT "InsulinEvent_insulinRegimenId_fkey" FOREIGN KEY ("insulinRegimenId") REFERENCES "InsulinRegimen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsulinEvent" ADD CONSTRAINT "InsulinEvent_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsulinEvent" ADD CONSTRAINT "InsulinEvent_doseCalculationId_fkey" FOREIGN KEY ("doseCalculationId") REFERENCES "DoseCalculation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseEvent" ADD CONSTRAINT "ExerciseEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextEvent" ADD CONSTRAINT "ContextEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseCalculation" ADD CONSTRAINT "DoseCalculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
