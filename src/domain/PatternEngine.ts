// ============================================================================
// PatternEngine — encuentra comparaciones descriptivas en los datos del
// paciente (sueño, actividad, ciclo, comidas, insulina) para ayudarlo a
// notar patrones por sí mismo.
//
// REGLA NO NEGOCIABLE: esto NUNCA afirma causalidad ("tu sueño afecta tu
// glucosa") ni da recomendaciones de tratamiento. Solo describe: "los días
// con X tuvieron un promedio de Y". La interpretación queda para el
// paciente y su equipo médico.
//
// REGLA NO NEGOCIABLE: sangre y CGM nunca se promedian juntas el mismo día.
// Si un día tiene ambas fuentes, se prefiere CGM (más lecturas, más señal)
// y se descarta sangre ESE día para el promedio diario — nunca se mezclan.
// ============================================================================

export type GlucoseSource = "BLOOD" | "CGM";

export interface PatternGlucoseInput {
  timestamp: Date;
  value: number;
  unit: "MGDL" | "MMOLL";
  source: GlucoseSource;
}

export interface PatternExerciseInput {
  timestamp: Date;
}

export interface PatternMealInput {
  timestamp: Date;
  carbsG: number | null;
}

export interface PatternInsulinInput {
  timestamp: Date;
  dose: number;
}

export interface PatternContextInput {
  timestamp: Date;
  sleepHours: number | null;
  isMenstruating: boolean | null;
}

export interface PatternGroup {
  labelEs: string;
  n: number;
  avgGlucoseMgdl: number;
}

export interface PatternDataRow {
  labelEs: string;
  detailEs: string;
  glucoseMgdl: number | null;
}

export interface PatternResult {
  id: "sleep" | "activity" | "cycle" | "meals" | "insulin" | "timeOfDay";
  titleEs: string;
  emoji: string;
  available: boolean;
  insufficientMessageEs?: string;
  summaryEs?: string;
  groups?: PatternGroup[];
  dataRows?: PatternDataRow[];
}

const MIN_GROUP_SIZE = 2;
const MIN_MEALS_PER_GROUP = 3;

function toMgdl(value: number, unit: "MGDL" | "MMOLL"): number {
  return unit === "MMOLL" ? value * 18.0182 : value;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Convierte una dayKey interna ("2026-8-1", mes 0-indexado) a "01/09/2026"
 * para mostrar — dayKey() usa getMonth() (0-11), así que hay que sumar 1 y
 * rellenar con ceros; NO es un simple split/reverse. */
function formatDayKeyEs(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m + 1).padStart(2, "0")}/${y}`;
}

/** Promedio diario de glucosa. Si un día tiene lecturas de sangre Y de CGM,
 * se usa SOLO CGM ese día (nunca se promedian ambas fuentes juntas). */
function dailyAverages(readings: PatternGlucoseInput[]): Map<string, number> {
  const byDay = new Map<string, { blood: number[]; cgm: number[] }>();
  for (const r of readings) {
    const key = dayKey(r.timestamp);
    const mgdl = toMgdl(r.value, r.unit);
    const entry = byDay.get(key) ?? { blood: [], cgm: [] };
    if (r.source === "CGM") entry.cgm.push(mgdl);
    else entry.blood.push(mgdl);
    byDay.set(key, entry);
  }
  const result = new Map<string, number>();
  for (const [key, { blood, cgm }] of byDay) {
    const chosen = cgm.length > 0 ? cgm : blood;
    if (chosen.length > 0) {
      result.set(key, chosen.reduce((a, b) => a + b, 0) / chosen.length);
    }
  }
  return result;
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function computeSleepPattern(
  glucoseByDay: Map<string, number>,
  context: PatternContextInput[],
): PatternResult {
  const base = { id: "sleep" as const, titleEs: "Sueño", emoji: "💤" };
  const byDaySleep = new Map<string, number>();
  for (const c of context) {
    if (c.sleepHours != null) byDaySleep.set(dayKey(c.timestamp), c.sleepHours);
  }

  const lessThan6: { key: string; hours: number; glucose: number }[] = [];
  const sixOrMore: { key: string; hours: number; glucose: number }[] = [];
  for (const [key, hours] of byDaySleep) {
    const glucose = glucoseByDay.get(key);
    if (glucose == null) continue;
    (hours < 6 ? lessThan6 : sixOrMore).push({ key, hours, glucose });
  }

  if (lessThan6.length < MIN_GROUP_SIZE || sixOrMore.length < MIN_GROUP_SIZE) {
    return {
      ...base,
      available: false,
      insufficientMessageEs:
        "Todavía no hay suficientes días con horas de sueño registradas (y glucosa ese mismo día) para comparar. Regístralo en 'Estado de ánimo'.",
    };
  }

  const avgLess = round1(avg(lessThan6.map((d) => d.glucose)));
  const avgMore = round1(avg(sixOrMore.map((d) => d.glucose)));

  return {
    ...base,
    available: true,
    summaryEs: `Los días con menos de 6 horas de sueño registradas tuvieron un promedio de glucosa de ${avgLess} mg/dL (${lessThan6.length} días), frente a ${avgMore} mg/dL en los días con 6 horas o más (${sixOrMore.length} días).`,
    groups: [
      { labelEs: "Menos de 6 horas", n: lessThan6.length, avgGlucoseMgdl: avgLess },
      { labelEs: "6 horas o más", n: sixOrMore.length, avgGlucoseMgdl: avgMore },
    ],
    dataRows: [...lessThan6, ...sixOrMore]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((d) => ({
        labelEs: formatDayKeyEs(d.key),
        detailEs: `${d.hours}h de sueño`,
        glucoseMgdl: round1(d.glucose),
      })),
  };
}

function computeActivityPattern(
  glucoseByDay: Map<string, number>,
  exercise: PatternExerciseInput[],
): PatternResult {
  const base = { id: "activity" as const, titleEs: "Actividad", emoji: "🏃" };
  const activeDays = new Set(exercise.map((e) => dayKey(e.timestamp)));

  const withActivity: { key: string; glucose: number }[] = [];
  const withoutActivity: { key: string; glucose: number }[] = [];
  for (const [key, glucose] of glucoseByDay) {
    (activeDays.has(key) ? withActivity : withoutActivity).push({ key, glucose });
  }

  if (withActivity.length < MIN_GROUP_SIZE || withoutActivity.length < MIN_GROUP_SIZE) {
    return {
      ...base,
      available: false,
      insufficientMessageEs:
        "Todavía no hay suficientes días con y sin actividad registrada (con glucosa ese mismo día) para comparar.",
    };
  }

  const avgWith = round1(avg(withActivity.map((d) => d.glucose)));
  const avgWithout = round1(avg(withoutActivity.map((d) => d.glucose)));

  return {
    ...base,
    available: true,
    summaryEs: `En los días con actividad física registrada, el promedio de glucosa fue de ${avgWith} mg/dL (${withActivity.length} días), frente a ${avgWithout} mg/dL en los días sin actividad registrada (${withoutActivity.length} días).`,
    groups: [
      { labelEs: "Con actividad", n: withActivity.length, avgGlucoseMgdl: avgWith },
      { labelEs: "Sin actividad", n: withoutActivity.length, avgGlucoseMgdl: avgWithout },
    ],
    dataRows: [...withActivity, ...withoutActivity]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((d) => ({
        labelEs: formatDayKeyEs(d.key),
        detailEs: activeDays.has(d.key) ? "Con actividad" : "Sin actividad",
        glucoseMgdl: round1(d.glucose),
      })),
  };
}

function computeCyclePattern(
  glucoseByDay: Map<string, number>,
  context: PatternContextInput[],
): PatternResult {
  const base = { id: "cycle" as const, titleEs: "Ciclo", emoji: "🌸" };
  const menstruatingDays = new Set(
    context.filter((c) => c.isMenstruating === true).map((c) => dayKey(c.timestamp)),
  );

  if (menstruatingDays.size === 0) {
    return {
      ...base,
      available: false,
      insufficientMessageEs:
        "Todavía no has registrado días de período menstrual. Puedes marcarlo en 'Estado de ánimo'.",
    };
  }

  const duringCycle: { key: string; glucose: number }[] = [];
  const outsideCycle: { key: string; glucose: number }[] = [];
  for (const [key, glucose] of glucoseByDay) {
    (menstruatingDays.has(key) ? duringCycle : outsideCycle).push({ key, glucose });
  }

  if (duringCycle.length < MIN_GROUP_SIZE || outsideCycle.length < MIN_GROUP_SIZE) {
    return {
      ...base,
      available: false,
      insufficientMessageEs:
        "Todavía no hay suficientes días registrados (dentro y fuera del período, con glucosa ese mismo día) para comparar.",
    };
  }

  const avgDuring = round1(avg(duringCycle.map((d) => d.glucose)));
  const avgOutside = round1(avg(outsideCycle.map((d) => d.glucose)));

  return {
    ...base,
    available: true,
    summaryEs: `Durante los días registrados como período menstrual, el promedio de glucosa fue de ${avgDuring} mg/dL (${duringCycle.length} días), frente a ${avgOutside} mg/dL el resto de los días (${outsideCycle.length} días).`,
    groups: [
      { labelEs: "Durante el período", n: duringCycle.length, avgGlucoseMgdl: avgDuring },
      { labelEs: "Fuera del período", n: outsideCycle.length, avgGlucoseMgdl: avgOutside },
    ],
    dataRows: [...duringCycle, ...outsideCycle]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((d) => ({
        labelEs: formatDayKeyEs(d.key),
        detailEs: menstruatingDays.has(d.key) ? "Período" : "Fuera del período",
        glucoseMgdl: round1(d.glucose),
      })),
  };
}

function computeMealsPattern(
  meals: PatternMealInput[],
  readings: PatternGlucoseInput[],
): PatternResult {
  const base = { id: "meals" as const, titleEs: "Comidas", emoji: "🍽️" };
  const withCarbs = meals.filter((m) => m.carbsG != null) as (PatternMealInput & {
    carbsG: number;
  })[];

  // Para cada comida, la lectura más cercana entre 30 y 150 minutos después.
  const mealReadings = withCarbs
    .map((m) => {
      const windowStart = m.timestamp.getTime() + 30 * 60 * 1000;
      const windowEnd = m.timestamp.getTime() + 150 * 60 * 1000;
      const candidates = readings.filter(
        (r) => r.timestamp.getTime() >= windowStart && r.timestamp.getTime() <= windowEnd,
      );
      if (candidates.length === 0) return null;
      const nearest = candidates.reduce((closest, r) =>
        Math.abs(r.timestamp.getTime() - m.timestamp.getTime()) <
        Math.abs(closest.timestamp.getTime() - m.timestamp.getTime())
          ? r
          : closest,
      );
      return { meal: m, glucose: toMgdl(nearest.value, nearest.unit) };
    })
    .filter((x): x is { meal: PatternMealInput & { carbsG: number }; glucose: number } => x !== null);

  if (mealReadings.length < MIN_MEALS_PER_GROUP * 2) {
    return {
      ...base,
      available: false,
      insufficientMessageEs:
        "Todavía no hay suficientes comidas con carbohidratos registrados y una lectura de glucosa entre 30 y 150 minutos después.",
    };
  }

  const sortedByCarbs = [...mealReadings].sort((a, b) => a.meal.carbsG - b.meal.carbsG);
  const mid = Math.floor(sortedByCarbs.length / 2);
  const lowerCarb = sortedByCarbs.slice(0, mid);
  const higherCarb = sortedByCarbs.slice(mid);

  const avgLower = round1(avg(lowerCarb.map((m) => m.glucose)));
  const avgHigher = round1(avg(higherCarb.map((m) => m.glucose)));
  const carbSplit = round1(sortedByCarbs[mid].meal.carbsG);

  return {
    ...base,
    available: true,
    summaryEs: `Las comidas con más carbohidratos registrados (${higherCarb.length} comidas, ${carbSplit}g o más) tuvieron un promedio de glucosa posterior de ${avgHigher} mg/dL, frente a ${avgLower} mg/dL en las comidas con menos carbohidratos (${lowerCarb.length} comidas). La lectura usada es la más cercana entre 30 y 150 minutos después de cada comida.`,
    groups: [
      { labelEs: "Menos carbohidratos", n: lowerCarb.length, avgGlucoseMgdl: avgLower },
      { labelEs: "Más carbohidratos", n: higherCarb.length, avgGlucoseMgdl: avgHigher },
    ],
    dataRows: mealReadings
      .sort((a, b) => a.meal.timestamp.getTime() - b.meal.timestamp.getTime())
      .map((m) => ({
        labelEs: formatDayKeyEs(dayKey(m.meal.timestamp)),
        detailEs: `${m.meal.carbsG}g de carbohidratos`,
        glucoseMgdl: round1(m.glucose),
      })),
  };
}

function computeInsulinPattern(
  insulin: PatternInsulinInput[],
  glucoseByDay: Map<string, number>,
): PatternResult {
  const base = { id: "insulin" as const, titleEs: "Insulina", emoji: "💉" };
  const dailyTotals = new Map<string, number>();
  for (const e of insulin) {
    const key = dayKey(e.timestamp);
    dailyTotals.set(key, (dailyTotals.get(key) ?? 0) + e.dose);
  }

  const days = [...dailyTotals.entries()]
    .filter(([key]) => glucoseByDay.has(key))
    .map(([key, totalDose]) => ({ key, totalDose, glucose: glucoseByDay.get(key)! }));

  if (days.length < MIN_GROUP_SIZE * 2) {
    return {
      ...base,
      available: false,
      insufficientMessageEs:
        "Todavía no hay suficientes días con dosis de insulina y glucosa registradas para comparar.",
    };
  }

  const sorted = [...days].sort((a, b) => a.totalDose - b.totalDose);
  const mid = Math.floor(sorted.length / 2);
  const lowerDose = sorted.slice(0, mid);
  const higherDose = sorted.slice(mid);

  const avgLower = round1(avg(lowerDose.map((d) => d.glucose)));
  const avgHigher = round1(avg(higherDose.map((d) => d.glucose)));
  const doseSplit = round1(sorted[mid].totalDose);

  return {
    ...base,
    available: true,
    summaryEs: `Los días con más unidades totales de insulina registradas (${higherDose.length} días, ${doseSplit}U o más) tuvieron un promedio de glucosa de ${avgHigher} mg/dL, frente a ${avgLower} mg/dL en los días con menos unidades (${lowerDose.length} días).`,
    groups: [
      { labelEs: "Menos unidades totales", n: lowerDose.length, avgGlucoseMgdl: avgLower },
      { labelEs: "Más unidades totales", n: higherDose.length, avgGlucoseMgdl: avgHigher },
    ],
    dataRows: sorted
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((d) => ({
        labelEs: formatDayKeyEs(d.key),
        detailEs: `${round1(d.totalDose)}U total`,
        glucoseMgdl: round1(d.glucose),
      })),
  };
}

function hourInTZ(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone, hour12: false, hour: "2-digit" });
  const hourStr = dtf.formatToParts(date).find((p) => p.type === "hour")?.value ?? "00";
  const h = Number(hourStr);
  return h === 24 ? 0 : h;
}

function timeOfDayLabel(hour: number): string {
  if (hour >= 4 && hour < 10) return "Mañana (4am-10am)";
  if (hour >= 10 && hour < 16) return "Mediodía (10am-4pm)";
  if (hour >= 16 && hour < 22) return "Tarde (4pm-10pm)";
  return "Noche (10pm-4am)";
}

const TIME_OF_DAY_ORDER = [
  "Mañana (4am-10am)",
  "Mediodía (10am-4pm)",
  "Tarde (4pm-10pm)",
  "Noche (10pm-4am)",
];

function computeTimeOfDayPattern(
  readings: PatternGlucoseInput[],
  timeZone: string,
): PatternResult {
  const base = { id: "timeOfDay" as const, titleEs: "Franja horaria", emoji: "🕓" };

  const byLabel = new Map<string, { blood: number[]; cgm: number[] }>();
  for (const label of TIME_OF_DAY_ORDER) byLabel.set(label, { blood: [], cgm: [] });

  for (const r of readings) {
    const label = timeOfDayLabel(hourInTZ(r.timestamp, timeZone));
    const mgdl = toMgdl(r.value, r.unit);
    const entry = byLabel.get(label)!;
    if (r.source === "CGM") entry.cgm.push(mgdl);
    else entry.blood.push(mgdl);
  }

  const groups: PatternGroup[] = [];
  const dataRows: PatternDataRow[] = [];
  for (const label of TIME_OF_DAY_ORDER) {
    const { blood, cgm } = byLabel.get(label)!;
    const chosen = cgm.length > 0 ? cgm : blood;
    if (chosen.length === 0) continue;
    const average = round1(avg(chosen));
    groups.push({ labelEs: label, n: chosen.length, avgGlucoseMgdl: average });
    dataRows.push({ labelEs: label, detailEs: `${chosen.length} lecturas`, glucoseMgdl: average });
  }

  if (groups.length < 2) {
    return {
      ...base,
      available: false,
      insufficientMessageEs:
        "Todavía no hay suficientes lecturas repartidas en distintas franjas del día para comparar.",
    };
  }

  const summaryParts = groups.map((g) => `${g.labelEs.split(" (")[0]}: ${g.avgGlucoseMgdl} mg/dL`);
  return {
    ...base,
    available: true,
    summaryEs: `Promedio de glucosa por franja horaria — ${summaryParts.join(" · ")}.`,
    groups,
    dataRows,
  };
}

export class PatternEngine {
  compute(input: {
    glucoseReadings: PatternGlucoseInput[];
    exerciseEvents: PatternExerciseInput[];
    meals: PatternMealInput[];
    insulinEvents: PatternInsulinInput[];
    contextEvents: PatternContextInput[];
    /** Para agrupar por franja horaria en la zona correcta. Por defecto UTC
     * (relevante solo para el nuevo patrón "Franja horaria"). */
    timeZone?: string;
  }): PatternResult[] {
    const glucoseByDay = dailyAverages(input.glucoseReadings);
    return [
      computeSleepPattern(glucoseByDay, input.contextEvents),
      computeActivityPattern(glucoseByDay, input.exerciseEvents),
      computeCyclePattern(glucoseByDay, input.contextEvents),
      computeMealsPattern(input.meals, input.glucoseReadings),
      computeInsulinPattern(input.insulinEvents, glucoseByDay),
      computeTimeOfDayPattern(input.glucoseReadings, input.timeZone ?? "UTC"),
    ];
  }
}
