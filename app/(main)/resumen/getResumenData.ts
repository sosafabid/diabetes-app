import { prisma } from "../../../src/lib/prisma";
import { SummaryEngine } from "../../../src/domain/SummaryEngine";
import { PatternEngine } from "../../../src/domain/PatternEngine";
import { HourlyPatternEngine } from "../../../src/domain/HourlyPatternEngine";
import type { PeriodType } from "../../../src/domain/summaryTypes";
import {
  zonedStartOfDay,
  zonedEndOfDay,
  zonedAddDays,
  zonedMonthRange,
  parseYMDInTZ,
  formatYMDInTZ,
} from "../../../src/lib/timezone";

// Un solo período controla TODO en /resumen (y en su vista de impresión):
// las tarjetas de resumen, la distribución de glucosa, insulina/comidas/
// actividad, y el gráfico de tendencia.
export const VALID_PERIODS = ["day", "7d", "14d", "30d", "month", "3m", "6m", "custom"];

export const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Merienda",
  OTHER: "Otra",
};

export const EXERCISE_TYPE_LABELS: Record<string, string> = {
  WALKING: "Caminata",
  RUNNING: "Carrera",
  CYCLING: "Ciclismo",
  WEIGHTS: "Pesas",
  HIIT: "HIIT",
  SWIMMING: "Natación",
  SPORT: "Deporte",
  OTHER: "Otra",
};

export function computeRange(
  periodType: string,
  timeZone: string,
  opts: { day?: string; from?: string; to?: string },
): { start: Date; end: Date; error: string | null } {
  const now = new Date();

  if (periodType === "day") {
    const base = opts.day ? parseYMDInTZ(opts.day, timeZone) : now;
    return { start: zonedStartOfDay(base, timeZone), end: zonedEndOfDay(base, timeZone), error: null };
  }
  if (periodType === "month") {
    const range = zonedMonthRange(now, timeZone);
    return { ...range, error: null };
  }
  if (periodType === "custom") {
    if (!opts.from || !opts.to) {
      return {
        start: zonedStartOfDay(zonedAddDays(now, -6, timeZone), timeZone),
        end: zonedEndOfDay(now, timeZone),
        error: "Selecciona una fecha de inicio y fin para el período personalizado.",
      };
    }
    return {
      start: zonedStartOfDay(parseYMDInTZ(opts.from, timeZone), timeZone),
      end: zonedEndOfDay(parseYMDInTZ(opts.to, timeZone), timeZone),
      error: null,
    };
  }
  const daysBack: Record<string, number> = { "7d": 6, "14d": 13, "30d": 29, "3m": 89, "6m": 179 };
  const back = daysBack[periodType] ?? 6;
  return {
    start: zonedStartOfDay(zonedAddDays(now, -back, timeZone), timeZone),
    end: zonedEndOfDay(now, timeZone),
    error: null,
  };
}

export async function getResumenData(
  userId: string,
  timeZone: string,
  searchParams: { period?: string; day?: string; from?: string; to?: string },
) {
  const periodType = VALID_PERIODS.includes(searchParams.period ?? "")
    ? (searchParams.period as string)
    : "7d";

  const { start, end, error: periodError } = computeRange(periodType, timeZone, {
    day: searchParams.day,
    from: searchParams.from,
    to: searchParams.to,
  });

  const selectedDayStr = searchParams.day ?? formatYMDInTZ(new Date(), timeZone);

  const [glucoseReadings, insulinEvents, meals, exerciseEvents, hypoglycemiaEvents, plan, contextEvents] =
    await Promise.all([
      prisma.glucoseReading.findMany({
        where: { userId, timestamp: { gte: start, lte: end } },
      }),
      prisma.insulinEvent.findMany({
        where: { userId, timestamp: { gte: start, lte: end } },
        include: { insulinRegimen: true },
      }),
      prisma.meal.findMany({
        where: { userId, timestamp: { gte: start, lte: end } },
      }),
      prisma.exerciseEvent.findMany({
        where: { userId, timestamp: { gte: start, lte: end } },
      }),
      prisma.hypoglycemiaEvent.findMany({
        where: { userId, createdAt: { gte: start, lte: end } },
      }),
      prisma.hypoglycemiaPlan.findFirst({
        where: { userId, effectiveTo: null },
        orderBy: { effectiveFrom: "desc" },
      }),
      prisma.contextEvent.findMany({
        where: { userId, timestamp: { gte: start, lte: end }, reportedStress: { not: null } },
      }),
    ]);

  const engine = new SummaryEngine();
  const summary = engine.compute({
    // El motor solo usa start/end para los cálculos; "type" es informativo.
    period: { type: periodType as unknown as PeriodType, start, end },
    lowThresholdMgdl: plan?.lowThreshold,
    glucoseReadings: glucoseReadings.map((r) => ({
      timestamp: r.timestamp,
      value: r.glucoseValue,
      unit: r.unit,
      source: r.measurementSource,
    })),
    insulinEvents: insulinEvents.map((e) => ({
      timestamp: e.timestamp,
      dose: e.dose,
      insulinName: e.insulinRegimen.insulinName,
      purpose: e.purpose,
    })),
    meals: meals.map((m) => ({
      timestamp: m.timestamp,
      mealType: m.mealType,
      carbsG: m.carbsGDirect,
    })),
    exerciseEvents: exerciseEvents.map((e) => ({
      timestamp: e.timestamp,
      type: e.type,
      duration: e.duration,
    })),
    hypoglycemiaEvents: hypoglycemiaEvents.map((e) => ({
      createdAt: e.createdAt,
      status: e.status,
      carbsConsumedG: e.carbsConsumedG,
      treatedAt: e.treatedAt,
      severeMarkedAt: e.severeMarkedAt,
    })),
  });

  const patternEngine = new PatternEngine();
  const patterns = patternEngine.compute({
    glucoseReadings: glucoseReadings.map((r) => ({
      timestamp: r.timestamp,
      value: r.glucoseValue,
      unit: r.unit,
      source: r.measurementSource,
    })),
    exerciseEvents: exerciseEvents.map((e) => ({ timestamp: e.timestamp })),
    meals: meals.map((m) => ({ timestamp: m.timestamp, carbsG: m.carbsGDirect })),
    insulinEvents: insulinEvents.map((e) => ({ timestamp: e.timestamp, dose: e.dose })),
    contextEvents: contextEvents.map((c) => ({
      timestamp: c.timestamp,
      sleepHours: c.sleepHours,
      isMenstruating: c.isMenstruating,
    })),
    timeZone,
  });

  const hourlyPatternEngine = new HourlyPatternEngine();
  const hourlyPattern = hourlyPatternEngine.compute({
    glucoseReadings: glucoseReadings.map((r) => ({
      timestamp: r.timestamp,
      value: r.glucoseValue,
      unit: r.unit,
      source: r.measurementSource,
    })),
    meals: meals.map((m) => ({ timestamp: m.timestamp, carbsG: m.carbsGDirect })),
    insulinEvents: insulinEvents.map((e) => ({ timestamp: e.timestamp, dose: e.dose })),
    periodStart: start,
    periodEnd: end,
    timeZone,
  });

  const maxInsulin = Math.max(0, ...Object.values(summary.insulin.byInsulinName));
  const maxMealType = Math.max(0, ...Object.values(summary.meals.byMealType));
  const minutesByActivityType = exerciseEvents.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + e.duration;
    return acc;
  }, {});
  const maxActivityMinutes = Math.max(1, ...Object.values(minutesByActivityType));

  const glucosePoints = glucoseReadings.map((r) => ({
    timestamp: r.timestamp,
    value: r.glucoseValue,
    unit: r.unit,
    source: r.measurementSource,
  }));

  return {
    periodType,
    start,
    end,
    periodError,
    selectedDayStr,
    plan,
    summary,
    patterns,
    hourlyPattern,
    maxInsulin,
    maxMealType,
    minutesByActivityType,
    maxActivityMinutes,
    glucosePoints,
    insulinEvents,
    meals,
    exerciseEvents,
    contextEvents,
  };
}

export interface WeeklyGridDay {
  dateLabel: string; // "Lun 15/9"
  glucosePoints: { timestamp: Date; value: number; unit: "MGDL" | "MMOLL"; source: "BLOOD" | "CGM" }[];
  totalCarbsG: number;
  totalInsulinUnits: number;
  lowEventCount: number;
}

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/**
 * Datos para la cuadrícula semanal — SIEMPRE los últimos 7 días terminando
 * hoy, sin importar qué período esté seleccionado en el resto de /resumen
 * (como el "Weekly Summary" de LibreView, que es su propio reporte fijo).
 */
export async function getWeeklyGridData(userId: string, timeZone: string): Promise<WeeklyGridDay[]> {
  const today = new Date();
  const rangeStart = zonedStartOfDay(zonedAddDays(today, -6, timeZone), timeZone);
  const rangeEnd = zonedEndOfDay(today, timeZone);

  const [glucoseReadings, meals, insulinEvents, hypoglycemiaEvents] = await Promise.all([
    prisma.glucoseReading.findMany({
      where: { userId, timestamp: { gte: rangeStart, lte: rangeEnd } },
    }),
    prisma.meal.findMany({
      where: { userId, timestamp: { gte: rangeStart, lte: rangeEnd } },
    }),
    prisma.insulinEvent.findMany({
      where: { userId, timestamp: { gte: rangeStart, lte: rangeEnd } },
    }),
    prisma.hypoglycemiaEvent.findMany({
      where: { userId, createdAt: { gte: rangeStart, lte: rangeEnd } },
    }),
  ]);

  const days: WeeklyGridDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayDate = zonedAddDays(today, -i, timeZone);
    const dayStart = zonedStartOfDay(dayDate, timeZone);
    const dayEnd = zonedEndOfDay(dayDate, timeZone);
    const ymd = formatYMDInTZ(dayDate, timeZone);
    const [, month, dayNum] = ymd.split("-");
    const weekdayIdx = new Date(dayStart).getUTCDay(); // suficiente para la etiqueta

    const dayGlucose = glucoseReadings
      .filter((r) => r.timestamp >= dayStart && r.timestamp <= dayEnd)
      .map((r) => ({
        timestamp: r.timestamp,
        value: r.glucoseValue,
        unit: r.unit,
        source: r.measurementSource,
      }));
    const dayMeals = meals.filter((m) => m.timestamp >= dayStart && m.timestamp <= dayEnd);
    const dayInsulin = insulinEvents.filter((e) => e.timestamp >= dayStart && e.timestamp <= dayEnd);
    const dayHypo = hypoglycemiaEvents.filter((e) => e.createdAt >= dayStart && e.createdAt <= dayEnd);

    days.push({
      dateLabel: `${WEEKDAY_LABELS[weekdayIdx]} ${Number(dayNum)}/${Number(month)}`,
      glucosePoints: dayGlucose,
      totalCarbsG: Math.round(dayMeals.reduce((sum, m) => sum + (m.carbsGDirect ?? 0), 0) * 10) / 10,
      totalInsulinUnits: Math.round(dayInsulin.reduce((sum, e) => sum + e.dose, 0) * 10) / 10,
      lowEventCount: dayHypo.length,
    });
  }

  return days;
}
