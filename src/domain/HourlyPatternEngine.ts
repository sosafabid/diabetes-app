// ============================================================================
// HourlyPatternEngine — "¿cómo se ve un día típico?" Combina TODOS los días
// del período en una sola línea de 24 horas, agrupando en bloques de 2h.
// Inspirado en el reporte "Daily Patterns" de LibreView, pero 100%
// descriptivo — no interpreta causas ni sugiere tratamiento.
//
// REGLA NO NEGOCIABLE: dentro de cada bloque de 2h, si hay lecturas de CGM
// Y de sangre juntas, se usa SOLO CGM para ese bloque — nunca se promedian
// ambas fuentes juntas.
// ============================================================================

export interface HourlyGlucoseInput {
  timestamp: Date;
  value: number;
  unit: "MGDL" | "MMOLL";
  source: "BLOOD" | "CGM";
}

export interface HourlyMealInput {
  timestamp: Date;
  carbsG: number | null;
}

export interface HourlyInsulinInput {
  timestamp: Date;
  dose: number;
}

export interface HourlyBucket {
  /** Hora de inicio del bloque, 0-22 en pasos de 2. */
  startHour: number;
  avgGlucoseMgdl: number | null;
  glucoseReadingCount: number;
  /** Promedio de carbohidratos POR DÍA en este bloque (no por evento). */
  avgCarbsGPerDay: number | null;
  /** Promedio de unidades de insulina POR DÍA en este bloque. */
  avgInsulinUnitsPerDay: number | null;
}

export interface HourlyPatternResult {
  available: boolean;
  insufficientMessageEs?: string;
  buckets: HourlyBucket[];
}

const MIN_READINGS = 6;
const MIN_DISTINCT_HOURS = 3;

function toMgdl(value: number, unit: "MGDL" | "MMOLL"): number {
  return unit === "MMOLL" ? value * 18.0182 : value;
}

/** Hora local (0-23) de una fecha, en la zona horaria dada. */
function hourInTZ(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone, hour12: false, hour: "2-digit" });
  const hourStr = dtf.formatToParts(date).find((p) => p.type === "hour")?.value ?? "00";
  const h = Number(hourStr);
  return h === 24 ? 0 : h;
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export class HourlyPatternEngine {
  compute(input: {
    glucoseReadings: HourlyGlucoseInput[];
    meals: HourlyMealInput[];
    insulinEvents: HourlyInsulinInput[];
    periodStart: Date;
    periodEnd: Date;
    timeZone: string;
  }): HourlyPatternResult {
    const { glucoseReadings, meals, insulinEvents, periodStart, periodEnd, timeZone } = input;

    if (glucoseReadings.length < MIN_READINGS) {
      return {
        available: false,
        insufficientMessageEs:
          "Todavía no hay suficientes lecturas de glucosa en el período para armar un patrón por hora del día.",
        buckets: [],
      };
    }

    const distinctHours = new Set(glucoseReadings.map((r) => hourInTZ(r.timestamp, timeZone)));
    if (distinctHours.size < MIN_DISTINCT_HOURS) {
      return {
        available: false,
        insufficientMessageEs:
          "Tus lecturas están concentradas casi siempre a la misma hora — hace falta variedad de horarios para ver un patrón por hora del día.",
        buckets: [],
      };
    }

    const dayCount = Math.max(
      1,
      Math.round((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)),
    );

    const buckets: HourlyBucket[] = [];
    for (let startHour = 0; startHour < 24; startHour += 2) {
      const bucketReadings = glucoseReadings.filter((r) => {
        const h = hourInTZ(r.timestamp, timeZone);
        return h >= startHour && h < startHour + 2;
      });
      const bloodVals = bucketReadings
        .filter((r) => r.source === "BLOOD")
        .map((r) => toMgdl(r.value, r.unit));
      const cgmVals = bucketReadings
        .filter((r) => r.source === "CGM")
        .map((r) => toMgdl(r.value, r.unit));
      const chosen = cgmVals.length > 0 ? cgmVals : bloodVals;

      const bucketMeals = meals.filter((m) => {
        const h = hourInTZ(m.timestamp, timeZone);
        return h >= startHour && h < startHour + 2 && m.carbsG != null;
      });
      const totalCarbs = bucketMeals.reduce((sum, m) => sum + (m.carbsG ?? 0), 0);

      const bucketInsulin = insulinEvents.filter((e) => {
        const h = hourInTZ(e.timestamp, timeZone);
        return h >= startHour && h < startHour + 2;
      });
      const totalInsulin = bucketInsulin.reduce((sum, e) => sum + e.dose, 0);

      buckets.push({
        startHour,
        avgGlucoseMgdl: chosen.length > 0 ? Math.round(avg(chosen) * 10) / 10 : null,
        glucoseReadingCount: chosen.length,
        avgCarbsGPerDay: totalCarbs > 0 ? Math.round((totalCarbs / dayCount) * 10) / 10 : null,
        avgInsulinUnitsPerDay:
          totalInsulin > 0 ? Math.round((totalInsulin / dayCount) * 10) / 10 : null,
      });
    }

    return { available: true, buckets };
  }
}
