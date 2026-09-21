// ============================================================================
// SummaryEngine
// ============================================================================
// Calcula estadísticas objetivas de un período (sección 11-15 del spec de
// /resumen). Es 100% determinista, sin IA — el análisis con IA (Fase 5) va
// a recibir el resultado de ESTE motor como input estructurado, nunca datos
// crudos sin procesar.
//
// REGLA DURA: sangre y CGM nunca se mezclan silenciosamente. `combined`
// existe para una vista rápida, pero `bySource` siempre está disponible y
// debe preferirse en la UI cuando la distinción importe.
// ============================================================================

import type {
  ActivitySummary,
  GlucoseSourceStats,
  GlucoseSummary,
  HypoglycemiaSummary,
  InsulinSummary,
  MealSummary,
  MissingDataNote,
  SummaryEngineInput,
  SummaryResult,
} from "./summaryTypes";

const DEFAULT_LOW_THRESHOLD_MGDL = 70; // TODO: clínicamente validar / debería venir siempre del plan del paciente
const DEFAULT_HIGH_THRESHOLD_MGDL = 180; // TODO — Clinical validation required
const MIN_MEALS_FOR_CARB_PATTERN = 5;
const MIN_READINGS_FOR_SUMMARY = 3;

export class SummaryEngine {
  compute(input: SummaryEngineInput): SummaryResult {
    const lowThreshold = input.lowThresholdMgdl ?? DEFAULT_LOW_THRESHOLD_MGDL;
    const highThreshold = input.highThresholdMgdl ?? DEFAULT_HIGH_THRESHOLD_MGDL;

    const toMgdl = (value: number, unit: "MGDL" | "MMOLL") =>
      unit === "MMOLL" ? value * 18.0182 : value;

    const bloodReadings = input.glucoseReadings.filter((r) => r.source === "BLOOD");
    const cgmReadings = input.glucoseReadings.filter((r) => r.source === "CGM");

    const statsFor = (readings: typeof input.glucoseReadings): GlucoseSourceStats => {
      if (readings.length === 0) {
        return {
          count: 0,
          average: null,
          min: null,
          max: null,
          lowCount: 0,
          highCount: 0,
          variabilityPercentCV: null,
        };
      }
      const valuesMgdl = readings.map((r) => toMgdl(r.value, r.unit));
      const sum = valuesMgdl.reduce((a, b) => a + b, 0);
      const mean = sum / readings.length;
      const variance =
        valuesMgdl.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / valuesMgdl.length;
      const stdDev = Math.sqrt(variance);
      return {
        count: readings.length,
        average: Math.round(mean * 10) / 10,
        min: Math.min(...valuesMgdl),
        max: Math.max(...valuesMgdl),
        lowCount: valuesMgdl.filter((v) => v < lowThreshold).length,
        highCount: valuesMgdl.filter((v) => v > highThreshold).length,
        variabilityPercentCV:
          readings.length > 1 && mean > 0 ? Math.round((stdDev / mean) * 1000) / 10 : null,
      };
    };

    const combinedStats = statsFor(input.glucoseReadings);
    const glucose: GlucoseSummary = {
      combined: combinedStats,
      bySource: {
        BLOOD: statsFor(bloodReadings),
        CGM: statsFor(cgmReadings),
      },
      // GMI (Glucose Management Indicator) — fórmula de Bergenstal et al.
      // 2018, requiere el promedio en mg/dL. Es un ESTIMADO de A1C, no un
      // resultado de laboratorio; más preciso con 14+ días de datos.
      gmiPercent:
        combinedStats.average != null
          ? Math.round((3.31 + 0.02392 * combinedStats.average) * 10) / 10
          : null,
    };

    const insulin: InsulinSummary = {
      totalUnits:
        Math.round(
          input.insulinEvents.reduce((sum, e) => sum + e.dose, 0) * 100,
        ) / 100,
      byInsulinName: groupSum(
        input.insulinEvents,
        (e) => e.insulinName,
        (e) => e.dose,
      ),
      byPurpose: groupSum(
        input.insulinEvents,
        (e) => e.purpose,
        (e) => e.dose,
      ),
    };

    const carbsRecorded = input.meals.filter((m) => m.carbsG != null);
    const totalCarbs = carbsRecorded.reduce((sum, m) => sum + (m.carbsG ?? 0), 0);
    const meals: MealSummary = {
      count: input.meals.length,
      totalCarbsG: Math.round(totalCarbs * 10) / 10,
      averageCarbsG:
        carbsRecorded.length > 0
          ? Math.round((totalCarbs / carbsRecorded.length) * 10) / 10
          : null,
      byMealType: groupCount(input.meals, (m) => m.mealType),
      mealsWithoutCarbsRecorded: input.meals.length - carbsRecorded.length,
    };

    const activity: ActivitySummary = {
      sessionCount: input.exerciseEvents.length,
      totalMinutes: input.exerciseEvents.reduce((sum, e) => sum + e.duration, 0),
      byType: groupCount(input.exerciseEvents, (e) => e.type),
    };

    const treatedEvents = input.hypoglycemiaEvents.filter(
      (e) => e.status === "TREATED" && e.carbsConsumedG != null,
    );
    const eventsWithDuration = input.hypoglycemiaEvents
      .map((e) => {
        const endAt = e.treatedAt ?? e.severeMarkedAt;
        if (!endAt) return null;
        const minutes = (endAt.getTime() - e.createdAt.getTime()) / 60000;
        return minutes >= 0 ? minutes : null;
      })
      .filter((m): m is number => m != null);
    const hypoglycemia: HypoglycemiaSummary = {
      episodeCount: input.hypoglycemiaEvents.length,
      treatedCount: input.hypoglycemiaEvents.filter((e) => e.status === "TREATED").length,
      severeCount: input.hypoglycemiaEvents.filter((e) => e.status === "SEVERE").length,
      averageCarbsConsumedG:
        treatedEvents.length > 0
          ? Math.round(
              (treatedEvents.reduce((sum, e) => sum + (e.carbsConsumedG ?? 0), 0) /
                treatedEvents.length) *
                10,
            ) / 10
          : null,
      averageDurationMinutes:
        eventsWithDuration.length > 0
          ? Math.round(
              eventsWithDuration.reduce((sum, m) => sum + m, 0) / eventsWithDuration.length,
            )
          : null,
    };

    const missingDataNotes = this.buildMissingDataNotes(input, glucose, meals);

    return { period: input.period, glucose, insulin, meals, activity, hypoglycemia, missingDataNotes };
  }

  private buildMissingDataNotes(
    input: SummaryEngineInput,
    glucose: GlucoseSummary,
    meals: MealSummary,
  ): MissingDataNote[] {
    const notes: MissingDataNote[] = [];

    if (glucose.combined.count < MIN_READINGS_FOR_SUMMARY) {
      notes.push({
        messageEs:
          "Hay muy pocas mediciones de glucosa en este período para que el resumen sea representativo.",
      });
    }

    if (
      meals.count >= MIN_MEALS_FOR_CARB_PATTERN &&
      meals.mealsWithoutCarbsRecorded / meals.count > 0.5
    ) {
      notes.push({
        messageEs:
          "Se registraron varias comidas, pero muchas no tienen gramos de carbohidratos anotados — esto limita el análisis de alimentación.",
      });
    }

    if (input.hypoglycemiaEvents.length === 0 && glucose.combined.lowCount > 0) {
      notes.push({
        messageEs:
          "Se detectaron lecturas bajas pero no hay eventos de hipoglucemia asociados — puede deberse a lecturas registradas antes de configurar tu plan personal.",
      });
    }

    return notes;
  }
}

function groupSum<T>(
  items: T[],
  keyFn: (item: T) => string,
  valueFn: (item: T) => number,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item);
    result[key] = Math.round(((result[key] ?? 0) + valueFn(item)) * 100) / 100;
  }
  return result;
}

function groupCount<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}
