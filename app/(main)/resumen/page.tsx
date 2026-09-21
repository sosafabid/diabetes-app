import Link from "next/link";
import { requireSession } from "../../../src/lib/auth-guard";
import { getUserTimeZone } from "../../../src/lib/timezone";
import {
  getResumenData,
  getWeeklyGridData,
  MEAL_TYPE_LABELS,
  EXERCISE_TYPE_LABELS,
} from "./getResumenData";
import PeriodSelector from "./PeriodSelector";
import PatternCard from "./PatternCard";
import StatBar from "./StatBar";
import GlucoseRangeBar from "./GlucoseRangeBar";
import GlucoseDayChart from "../charts/GlucoseDayChart";
import GlucoseTrendLineChart from "../charts/GlucoseTrendLineChart";
import HourlyPatternChart from "../charts/HourlyPatternChart";
import WeeklyGrid from "./WeeklyGrid";

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: { period?: string; day?: string; from?: string; to?: string };
}) {
  const session = await requireSession();
  const timeZone = await getUserTimeZone();
  const [data, weeklyGridDays] = await Promise.all([
    getResumenData(session.userId, timeZone, searchParams),
    getWeeklyGridData(session.userId, timeZone),
  ]);
  const {
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
  } = data;

  // El link de exportar lleva el mismo período que se está viendo ahora.
  const exportParams = new URLSearchParams();
  exportParams.set("period", periodType);
  if (searchParams.day) exportParams.set("day", searchParams.day);
  if (searchParams.from) exportParams.set("from", searchParams.from);
  if (searchParams.to) exportParams.set("to", searchParams.to);

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Resumen</h1>
          <p className="page-subtitle">
            {start.toLocaleDateString("es-CR", { timeZone })} – {end.toLocaleDateString("es-CR", { timeZone })}
          </p>
        </div>
        <Link
          href={`/resumen/exportar?${exportParams.toString()}`}
          target="_blank"
          className="secondary-button"
          style={{ textDecoration: "none", whiteSpace: "nowrap" }}
        >
          📄 Exportar a PDF
        </Link>
      </div>

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
          <span className="hero-stat-value">{summary.glucose.gmiPercent ?? "—"}%</span>
          <span className="hero-stat-label">GMI (A1C estimado)</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">
            {summary.glucose.combined.variabilityPercentCV ?? "—"}%
          </span>
          <span className="hero-stat-label">variabilidad (CV)</span>
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
      <p className="form-hint" style={{ marginTop: "-1rem", marginBottom: "1.5rem" }}>
        El GMI es un <strong>estimado</strong> de A1C a partir de tu promedio de glucosa
        (fórmula de Bergenstal et al., 2018) — no reemplaza un A1C de laboratorio, y es más
        preciso con 14 o más días de datos. La variabilidad (%CV) es qué tanto se dispersan
        tus lecturas respecto al promedio.
      </p>

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

      {/* Patrón por hora del día — "¿cómo se ve un día típico?", combina
          todos los días del período. Solo tiene sentido con más de un día. */}
      {periodType !== "day" && (
        <section className="summary-section">
          <h2>🕐 Patrón por hora del día</h2>
          <p className="form-hint" style={{ marginBottom: "1rem" }}>
            Promedio de todos los días del período combinados en una sola línea de 24 horas.
          </p>
          {hourlyPattern.available ? (
            <HourlyPatternChart buckets={hourlyPattern.buckets} lowThreshold={plan?.lowThreshold} />
          ) : (
            <p className="form-hint">{hourlyPattern.insufficientMessageEs}</p>
          )}
        </section>
      )}

      {/* Resumen semanal — siempre los últimos 7 días, sin importar el
          período elegido arriba (igual que el reporte semanal de LibreView) */}
      <section className="summary-section">
        <h2>📆 Resumen semanal</h2>
        <p className="form-hint" style={{ marginBottom: "1rem" }}>
          Los últimos 7 días, sin importar el período que tengas seleccionado arriba.
        </p>
        <WeeklyGrid days={weeklyGridDays} timeZone={timeZone} />
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
            {summary.hypoglycemia.averageDurationMinutes != null && (
              <li>
                Duración promedio hasta quedar tratada/resuelta:{" "}
                {summary.hypoglycemia.averageDurationMinutes} min
              </li>
            )}
          </ul>
        )}
      </section>

      <p className="form-hint">
        Estos números son objetivos, calculados directamente de tus registros
        — no interpretan causas ni recomiendan cambios de tratamiento. El
        análisis con IA (para preparar preguntas para tu equipo médico)
        llega en una próxima fase.
      </p>
    </div>
  );
}
