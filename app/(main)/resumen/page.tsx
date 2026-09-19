import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import { SummaryEngine } from "../../../src/domain/SummaryEngine";
import { PatternEngine } from "../../../src/domain/PatternEngine";
import type { PeriodType } from "../../../src/domain/summaryTypes";
import PeriodSelector from "./PeriodSelector";
import PatternCard from "./PatternCard";
import StatBar from "./StatBar";
import GlucoseRangeBar from "./GlucoseRangeBar";
import GlucoseDayChart from "../charts/GlucoseDayChart";
import GlucoseTrendLineChart from "../charts/GlucoseTrendLineChart";
import {
  getUserTimeZone,
  zonedStartOfDay,
  zonedEndOfDay,
  zonedAddDays,
  zonedMonthRange,
  parseYMDInTZ,
  formatYMDInTZ,
} from "../../../src/lib/timezone";

// Un solo período controla TODO en esta página: las tarjetas de resumen,
// la distribución de glucosa, insulina/comidas/actividad, y el gráfico de
// tendencia — ya no hay un selector separado para el gráfico.
const VALID_PERIODS = ["day", "7d", "14d", "30d", "month", "3m", "6m", "custom"];

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Merienda",
  OTHER: "Otra",
};

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  WALKING: "Caminata",
  RUNNING: "Carrera",
  CYCLING: "Ciclismo",
  WEIGHTS: "Pesas",
  HIIT: "HIIT",
  SWIMMING: "Natación",
  SPORT: "Deporte",
  OTHER: "Otra",
};

function computeRange(
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

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: { period?: string; day?: string; from?: string; to?: string };
}) {
  const session = await requireSession();
  const timeZone = await getUserTimeZone();

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
        where: { userId: session.userId, timestamp: { gte: start, lte: end } },
      }),
      prisma.insulinEvent.findMany({
        where: { userId: session.userId, timestamp: { gte: start, lte: end } },
        include: { insulinRegimen: true },
      }),
      prisma.meal.findMany({
        where: { userId: session.userId, timestamp: { gte: start, lte: end } },
      }),
      prisma.exerciseEvent.findMany({
        where: { userId: session.userId, timestamp: { gte: start, lte: end } },
      }),
      prisma.hypoglycemiaEvent.findMany({
        where: { userId: session.userId, createdAt: { gte: start, lte: end } },
      }),
      prisma.hypoglycemiaPlan.findFirst({
        where: { userId: session.userId, effectiveTo: null },
        orderBy: { effectiveFrom: "desc" },
      }),
      prisma.contextEvent.findMany({
        where: { userId: session.userId, timestamp: { gte: start, lte: end }, reportedStress: { not: null } },
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

  return (
    <div className="page">
      <h1>Resumen</h1>
      <p className="page-subtitle">
        {start.toLocaleDateString("es-CR", { timeZone })} – {end.toLocaleDateString("es-CR", { timeZone })}
      </p>

      <PeriodSelector
        currentPeriod={periodType}
        currentDay={selectedDayStr}
        initialFrom={searchParams.from}
        initialTo={searchParams.to}
      />
      {periodError && <p className="form-error">{periodError}</p>}

      {summary.missingDataNotes.length > 0 && (
        <div className="info-banner">
          {summary.missingDataNotes.map((n, i) => (
            <p key={i}>ℹ️ {n.messageEs}</p>
          ))}
        </div>
      )}

      {/* Tarjetas destacadas */}
      <div className="hero-stats">
        <div className="hero-stat">
          <span className="hero-stat-value">
            {summary.glucose.combined.average ?? "—"}
          </span>
          <span className="hero-stat-label">mg/dL promedio</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">{summary.insulin.totalUnits}</span>
          <span className="hero-stat-label">U de insulina</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">{summary.meals.totalCarbsG}</span>
          <span className="hero-stat-label">g de carbohidratos</span>
        </div>
        <div className="hero-stat hero-stat-warning">
          <span className="hero-stat-value">{summary.hypoglycemia.episodeCount}</span>
          <span className="hero-stat-label">episodios de hipoglucemia</span>
        </div>
      </div>

      {/* Tendencia de glucosa — usa exactamente el mismo período de arriba */}
      <section className="summary-section" id="tendencia">
        <h2>📈 Tendencia de glucosa</h2>
        {periodType === "day" ? (
          <GlucoseDayChart
            glucoseReadings={glucosePoints}
            insulinEvents={insulinEvents.map((e) => ({ timestamp: e.timestamp }))}
            mealEvents={meals.map((m) => ({ timestamp: m.timestamp }))}
            activityEvents={exerciseEvents.map((e) => ({ timestamp: e.timestamp }))}
            stressEvents={contextEvents.map((c) => ({ timestamp: c.timestamp }))}
            lowThreshold={plan?.lowThreshold}
            timeZone={timeZone}
          />
        ) : (
          <GlucoseTrendLineChart
            glucoseReadings={glucosePoints}
            rangeStart={start}
            rangeEnd={end}
            lowThreshold={plan?.lowThreshold}
          />
        )}
      </section>

      {/* Patrones — comparaciones descriptivas de tus propios datos, sin
          interpretar causas ni dar recomendaciones de tratamiento */}
      <section className="summary-section">
        <h2>🔍 Patrones</h2>
        <p className="form-hint" style={{ marginBottom: "1rem" }}>
          Comparaciones directas entre tus registros — no interpretan causas
          ni son consejo médico. Úsalas para conversar con tu equipo de
          salud si te parecen útiles.
        </p>
        {patterns.map((p) => (
          <PatternCard key={p.id} pattern={p} />
        ))}
      </section>

      {/* Distribución de glucosa — nunca mezcla sangre y CGM */}
      <section className="summary-section">
        <h2>🩸 Distribución de glucosa</h2>
        <GlucoseRangeBar
          sourceLabel="Sangre"
          count={summary.glucose.bySource.BLOOD.count}
          lowCount={summary.glucose.bySource.BLOOD.lowCount}
          highCount={summary.glucose.bySource.BLOOD.highCount}
        />
        <GlucoseRangeBar
          sourceLabel="CGM"
          count={summary.glucose.bySource.CGM.count}
          lowCount={summary.glucose.bySource.CGM.lowCount}
          highCount={summary.glucose.bySource.CGM.highCount}
        />
        <p className="form-hint">
          "Bajo" y "alto" se calculan con tu umbral personal de hipoglucemia
          (o 70 mg/dL por defecto) y un umbral de referencia de 180 mg/dL — este
          último todavía no es configurable ni está clínicamente validado.
        </p>
      </section>

      {/* Insulina */}
      {Object.keys(summary.insulin.byInsulinName).length > 0 && (
        <section className="summary-section">
          <h2>💉 Insulina por tipo</h2>
          {Object.entries(summary.insulin.byInsulinName).map(([name, units]) => (
            <StatBar
              key={name}
              label={name}
              value={units}
              maxValue={maxInsulin}
              displayValue={`${units} U`}
            />
          ))}
        </section>
      )}

      {/* Comidas */}
      {summary.meals.count > 0 && (
        <section className="summary-section">
          <h2>🍽️ Comidas por tipo</h2>
          {Object.entries(summary.meals.byMealType).map(([type, count]) => (
            <StatBar
              key={type}
              label={MEAL_TYPE_LABELS[type] ?? type}
              value={count}
              maxValue={maxMealType}
              displayValue={`${count}`}
              color="var(--color-warning)"
            />
          ))}
          {summary.meals.averageCarbsG != null && (
            <p className="form-hint">
              Promedio de {summary.meals.averageCarbsG} g de carbohidratos por comida
              {summary.meals.mealsWithoutCarbsRecorded > 0 &&
                ` (${summary.meals.mealsWithoutCarbsRecorded} comidas sin carbohidratos registrados)`}
              .
            </p>
          )}
        </section>
      )}

      {/* Actividad */}
      {summary.activity.sessionCount > 0 && (
        <section className="summary-section">
          <h2>🏃 Actividad por tipo (minutos)</h2>
          {Object.entries(minutesByActivityType).map(([type, minutes]) => (
            <StatBar
              key={type}
              label={EXERCISE_TYPE_LABELS[type] ?? type}
              value={minutes}
              maxValue={maxActivityMinutes}
              displayValue={`${minutes} min`}
              color="var(--color-primary-dark)"
            />
          ))}
        </section>
      )}

      {/* Hipoglucemias */}
      <section className="summary-section">
        <h2>🚨 Hipoglucemias</h2>
        {summary.hypoglycemia.episodeCount === 0 ? (
          <p className="form-hint">Sin episodios registrados en este período.</p>
        ) : (
          <ul className="card-details">
            <li>{summary.hypoglycemia.episodeCount} episodios en total</li>
            <li>Tratadas con carbohidratos: {summary.hypoglycemia.treatedCount}</li>
            <li>Marcadas como severas: {summary.hypoglycemia.severeCount}</li>
            {summary.hypoglycemia.averageCarbsConsumedG != null && (
              <li>
                Promedio de carbohidratos usados para tratarlas:{" "}
                {summary.hypoglycemia.averageCarbsConsumedG} g
              </li>
            )}
          </ul>
        )}
      </section>

      <p className="form-hint">
        Estos números son objetivos, calculados directamente de tus registros
        — no interpretan causas ni recomiendan cambios de tratamiento. El
        análisis con IA (para preparar preguntas para tu equipo médico) y la
        exportación a PDF/CSV/JSON llegan en las siguientes fases.
      </p>
    </div>
  );
}