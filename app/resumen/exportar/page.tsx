import { requireSession } from "../../../src/lib/auth-guard";
import { getUserTimeZone } from "../../../src/lib/timezone";
import { prisma } from "../../../src/lib/prisma";
import {
  getResumenData,
  getWeeklyGridData,
  MEAL_TYPE_LABELS,
  EXERCISE_TYPE_LABELS,
} from "../../(main)/resumen/getResumenData";
import GlucoseDayChart from "../../(main)/charts/GlucoseDayChart";
import GlucoseTrendLineChart from "../../(main)/charts/GlucoseTrendLineChart";
import HourlyPatternChart from "../../(main)/charts/HourlyPatternChart";
import WeeklyGrid from "../../(main)/resumen/WeeklyGrid";
import ExportPrintButton from "./ExportPrintButton";

export const metadata = {
  title: "Resumen — Stay Alive ILU",
};

export default async function ExportarResumenPage({
  searchParams,
}: {
  searchParams: { period?: string; day?: string; from?: string; to?: string };
}) {
  const session = await requireSession();
  const timeZone = await getUserTimeZone();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  const [data, weeklyGridDays] = await Promise.all([
    getResumenData(session.userId, timeZone, searchParams),
    getWeeklyGridData(session.userId, timeZone),
  ]);
  const {
    periodType,
    start,
    end,
    plan,
    summary,
    patterns,
    hourlyPattern,
    minutesByActivityType,
    glucosePoints,
    insulinEvents,
    meals,
    exerciseEvents,
    contextEvents,
  } = data;

  return (
    <div className="print-page">
      <div className="print-toolbar no-print">
        <ExportPrintButton />
        <p className="form-hint" style={{ margin: 0 }}>
          Se abrirá el diálogo de impresión de tu navegador — elige
          "Guardar como PDF" como destino.
        </p>
      </div>

      <header className="print-header">
        <img src="/logo.png" alt="Stay Alive ILU" />
        <div>
          <h1>Stay Alive ILU — Resumen</h1>
          <p>
            {user?.name} — {start.toLocaleDateString("es-CR", { timeZone })} al{" "}
            {end.toLocaleDateString("es-CR", { timeZone })}
          </p>
        </div>
      </header>

          <section>
            <h2>Resumen general</h2>
            <div className="hero-stats">
              <div className="hero-stat hero-stat-glucose">
                <span className="hero-stat-value">{summary.glucose.combined.average ?? "—"}</span>
                <span className="hero-stat-label">mg/dL promedio</span>
              </div>
              <div className="hero-stat hero-stat-glucose">
                <span className="hero-stat-value">{summary.glucose.gmiPercent ?? "—"}%</span>
                <span className="hero-stat-label">GMI (A1C estimado)</span>
              </div>
              <div className="hero-stat hero-stat-glucose">
                <span className="hero-stat-value">
                  {summary.glucose.combined.variabilityPercentCV ?? "—"}%
                </span>
                <span className="hero-stat-label">variabilidad (CV)</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">{summary.insulin.totalUnits}</span>
                <span className="hero-stat-label">U de insulina</span>
              </div>
              <div className="hero-stat hero-stat-carbs">
                <span className="hero-stat-value">{summary.meals.totalCarbsG}</span>
                <span className="hero-stat-label">g de carbohidratos</span>
              </div>
              <div className="hero-stat hero-stat-warning">
                <span className="hero-stat-value">{summary.hypoglycemia.episodeCount}</span>
                <span className="hero-stat-label">episodios de hipoglucemia</span>
              </div>
            </div>
            <p className="form-hint">
              El GMI es un estimado de A1C a partir del promedio de glucosa (Bergenstal et
              al., 2018) — no reemplaza un A1C de laboratorio.
            </p>
          </section>

          <section>
            <h2>Tendencia de glucosa</h2>
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

          {periodType !== "day" && hourlyPattern.available && (
            <section>
              <h2>Patrón por hora del día</h2>
              <p className="form-hint">
                Promedio de todos los días del período combinados en una sola línea de 24 horas.
              </p>
              <HourlyPatternChart buckets={hourlyPattern.buckets} lowThreshold={plan?.lowThreshold} />
            </section>
          )}

          <section>
            <h2>Resumen semanal</h2>
            <p className="form-hint">Los últimos 7 días, sin importar el período de arriba.</p>
            <WeeklyGrid days={weeklyGridDays} timeZone={timeZone} />
          </section>

          <section>
            <h2>Distribución de glucosa</h2>
            <p>
              Sangre: {summary.glucose.bySource.BLOOD.count} lecturas — bajo{" "}
              {summary.glucose.bySource.BLOOD.lowCount}, alto {summary.glucose.bySource.BLOOD.highCount}
            </p>
            <p>
              CGM: {summary.glucose.bySource.CGM.count} lecturas — bajo{" "}
              {summary.glucose.bySource.CGM.lowCount}, alto {summary.glucose.bySource.CGM.highCount}
            </p>
          </section>

          {Object.keys(summary.insulin.byInsulinName).length > 0 && (
            <section>
              <h2>Insulina por tipo</h2>
              <ul>
                {Object.entries(summary.insulin.byInsulinName).map(([name, units]) => (
                  <li key={name}>
                    {name}: {units} U
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summary.meals.count > 0 && (
            <section>
              <h2>Comidas por tipo</h2>
              <ul>
                {Object.entries(summary.meals.byMealType).map(([type, count]) => (
                  <li key={type}>
                    {MEAL_TYPE_LABELS[type] ?? type}: {count}
                  </li>
                ))}
              </ul>
              {summary.meals.averageCarbsG != null && (
                <p>Promedio de {summary.meals.averageCarbsG} g de carbohidratos por comida.</p>
              )}
            </section>
          )}

          {summary.activity.sessionCount > 0 && (
            <section>
              <h2>Actividad por tipo</h2>
              <ul>
                {Object.entries(minutesByActivityType).map(([type, minutes]) => (
                  <li key={type}>
                    {EXERCISE_TYPE_LABELS[type] ?? type}: {minutes} min
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2>Hipoglucemias</h2>
            {summary.hypoglycemia.episodeCount === 0 ? (
              <p>Sin episodios registrados en este período.</p>
            ) : (
              <ul>
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

          <section>
            <h2>Patrones</h2>
            <p className="form-hint">
              Comparaciones directas entre los registros del período — no
              interpretan causas ni son consejo médico.
            </p>
            {patterns.map((p) => (
              <div key={p.id} style={{ marginBottom: "0.85rem" }}>
                <h3>
                  {p.emoji} {p.titleEs}
                </h3>
                {p.available ? <p>{p.summaryEs}</p> : <p className="form-hint">{p.insufficientMessageEs}</p>}
              </div>
            ))}
          </section>

          <p className="form-hint">
            Estos números son objetivos, calculados directamente de los
            registros del período — no interpretan causas ni recomiendan
            cambios de tratamiento. No sustituyen el criterio de un equipo
            médico.
          </p>
    </div>
  );
}
