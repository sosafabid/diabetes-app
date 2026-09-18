import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import { SummaryEngine } from "../../../src/domain/SummaryEngine";
import { resolvePeriod, parseDateOnlyLocal } from "../../../src/domain/resolvePeriod";
import type { PeriodType } from "../../../src/domain/summaryTypes";
import PeriodSelector from "./PeriodSelector";
import StatBar from "./StatBar";
import GlucoseRangeBar from "./GlucoseRangeBar";
import ChartRangeSelector from "../charts/ChartRangeSelector";
import GlucoseDayChart from "../charts/GlucoseDayChart";
import GlucoseTrendLineChart from "../charts/GlucoseTrendLineChart";
import DayPicker from "../charts/DayPicker";

const VALID_PERIOD_TYPES: PeriodType[] = ["day", "7d", "14d", "30d", "month", "custom"];
const VALID_CHART_RANGES = ["day", "week", "month", "3m", "6m"];

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

function chartRangeDates(range: string, selectedDay?: Date): { start: Date; end: Date } {
  if (range === "day") {
    const base = selectedDay ?? new Date();
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    const end = new Date(base);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  switch (range) {
    case "week":
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case "3m":
      start.setDate(start.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      break;
    case "6m":
      start.setDate(start.getDate() - 179);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: {
    period?: string;
    from?: string;
    to?: string;
    chartRange?: string;
    day?: string;
  };
}) {
  const session = await requireSession();

  const periodType: PeriodType = VALID_PERIOD_TYPES.includes(
    searchParams.period as PeriodType,
  )
    ? (searchParams.period as PeriodType)
    : "7d";

  let period;
  let periodError: string | null = null;
  try {
    period = resolvePeriod(
      periodType,
      new Date(),
      searchParams.from ? parseDateOnlyLocal(searchParams.from) : undefined,
      searchParams.to ? parseDateOnlyLocal(searchParams.to) : undefined,
    );
  } catch {
    periodError = "Selecciona una fecha de inicio y fin para el período personalizado.";
    period = resolvePeriod("7d");
  }

  const chartRange = VALID_CHART_RANGES.includes(searchParams.chartRange ?? "")
    ? (searchParams.chartRange as string)
    : "day";
  const selectedDay = searchParams.day ? parseDateOnlyLocal(searchParams.day) : new Date();
  const chartDates = chartRangeDates(chartRange, selectedDay);
  const selectedDayStr = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`;

  const [
    glucoseReadings,
    insulinEvents,
    meals,
    exerciseEvents,
    hypoglycemiaEvents,
    plan,
    chartGlucose,
    chartInsulin,
    chartMeals,
    chartExercise,
    chartContext,
  ] = await Promise.all([
    prisma.glucoseReading.findMany({
      where: { userId: session.userId, timestamp: { gte: period.start, lte: period.end } },
    }),
    prisma.insulinEvent.findMany({
      where: { userId: session.userId, timestamp: { gte: period.start, lte: period.end } },
      include: { insulinRegimen: true },
    }),
    prisma.meal.findMany({
      where: { userId: session.userId, timestamp: { gte: period.start, lte: period.end } },
    }),
    prisma.exerciseEvent.findMany({
      where: { userId: session.userId, timestamp: { gte: period.start, lte: period.end } },
    }),
    prisma.hypoglycemiaEvent.findMany({
      where: { userId: session.userId, createdAt: { gte: period.start, lte: period.end } },
    }),
    prisma.hypoglycemiaPlan.findFirst({
      where: { userId: session.userId, effectiveTo: null },
      orderBy: { effectiveFrom: "desc" },
    }),
    prisma.glucoseReading.findMany({
      where: { userId: session.userId, timestamp: { gte: chartDates.start, lte: chartDates.end } },
    }),
    prisma.insulinEvent.findMany({
      where: { userId: session.userId, timestamp: { gte: chartDates.start, lte: chartDates.end } },
    }),
    prisma.meal.findMany({
      where: { userId: session.userId, timestamp: { gte: chartDates.start, lte: chartDates.end } },
    }),
    prisma.exerciseEvent.findMany({
      where: { userId: session.userId, timestamp: { gte: chartDates.start, lte: chartDates.end } },
    }),
    prisma.contextEvent.findMany({
      where: {
        userId: session.userId,
        timestamp: { gte: chartDates.start, lte: chartDates.end },
        reportedStress: { not: null },
      },
    }),
  ]);

  const engine = new SummaryEngine();
  const summary = engine.compute({
    period,
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

  const maxInsulin = Math.max(0, ...Object.values(summary.insulin.byInsulinName));
  const maxMealType = Math.max(0, ...Object.values(summary.meals.byMealType));
  const minutesByActivityType = exerciseEvents.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + e.duration;
    return acc;
  }, {});
  const maxActivityMinutes = Math.max(1, ...Object.values(minutesByActivityType));

  const chartGlucosePoints = chartGlucose.map((r) => ({
    timestamp: r.timestamp,
    value: r.glucoseValue,
    unit: r.unit,
    source: r.measurementSource,
  }));

  return (
    <div className="page">
      <h1>Resumen</h1>
      <p className="page-subtitle">
        {period.start.toLocaleDateString("es-CR")} – {period.end.toLocaleDateString("es-CR")}
      </p>

      <PeriodSelector currentPeriod={periodType} />
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

      {/* Tendencia de glucosa — día con eventos, o promedio diario para rangos largos */}
      <section className="summary-section" id="tendencia">
        <h2>📈 Tendencia de glucosa</h2>
        <ChartRangeSelector current={chartRange} />
        {chartRange === "day" && <DayPicker currentDay={selectedDayStr} />}
        {chartRange === "day" ? (
          <GlucoseDayChart
            glucoseReadings={chartGlucosePoints}
            insulinEvents={chartInsulin.map((e) => ({ timestamp: e.timestamp }))}
            mealEvents={chartMeals.map((m) => ({ timestamp: m.timestamp }))}
            activityEvents={chartExercise.map((e) => ({ timestamp: e.timestamp }))}
            stressEvents={chartContext.map((c) => ({ timestamp: c.timestamp }))}
            lowThreshold={plan?.lowThreshold}
          />
        ) : (
          <GlucoseTrendLineChart
            glucoseReadings={chartGlucosePoints}
            rangeStart={chartDates.start}
            rangeEnd={chartDates.end}
            insulinEvents={chartInsulin.map((e) => ({ timestamp: e.timestamp }))}
            mealEvents={chartMeals.map((m) => ({ timestamp: m.timestamp }))}
            activityEvents={chartExercise.map((e) => ({ timestamp: e.timestamp }))}
            stressEvents={chartContext.map((c) => ({ timestamp: c.timestamp }))}
            lowThreshold={plan?.lowThreshold}
          />
        )}
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