import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import { SummaryEngine } from "../../../src/domain/SummaryEngine";
import { resolvePeriod, parseDateOnlyLocal } from "../../../src/domain/resolvePeriod";
import type { PeriodType } from "../../../src/domain/summaryTypes";
import PeriodSelector from "./PeriodSelector";

const VALID_PERIOD_TYPES: PeriodType[] = ["7d", "14d", "30d", "month", "custom"];

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const session = await requireSession();

  const periodType: PeriodType = VALID_PERIOD_TYPES.includes(
    searchParams.period as PeriodType,
  )
    ? (searchParams.period as PeriodType)
    : "7d";

  const period = resolvePeriod(
    periodType,
    new Date(),
    searchParams.from ? parseDateOnlyLocal(searchParams.from) : undefined,
    searchParams.to ? parseDateOnlyLocal(searchParams.to) : undefined,
  );

  const [glucoseReadings, insulinEvents, meals, exerciseEvents, hypoglycemiaEvents, plan] =
    await Promise.all([
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

  return (
    <div className="page">
      <h1>Resumen</h1>
      <p className="page-subtitle">
        {period.start.toLocaleDateString("es-CR")} – {period.end.toLocaleDateString("es-CR")}
      </p>

      <PeriodSelector currentPeriod={periodType} />

      {summary.missingDataNotes.length > 0 && (
        <div className="alert-banner" style={{ background: "#fff7ed", color: "#92400e" }}>
          {summary.missingDataNotes.map((n, i) => (
            <p key={i}>ℹ️ {n.messageEs}</p>
          ))}
        </div>
      )}

      <div className="card-list">
        <div className="card">
          <h3>🩸 Glucosa</h3>
          <ul className="card-details">
            <li>
              Sangre: {summary.glucose.bySource.BLOOD.count} mediciones
              {summary.glucose.bySource.BLOOD.average != null &&
                ` · promedio ${summary.glucose.bySource.BLOOD.average} mg/dL`}
            </li>
            <li>
              CGM: {summary.glucose.bySource.CGM.count} mediciones
              {summary.glucose.bySource.CGM.average != null &&
                ` · promedio ${summary.glucose.bySource.CGM.average} mg/dL`}
            </li>
            <li>Episodios bajos: {summary.glucose.combined.lowCount}</li>
            <li>Episodios altos: {summary.glucose.combined.highCount}</li>
          </ul>
        </div>

        <div className="card">
          <h3>💉 Insulina</h3>
          <ul className="card-details">
            <li>Total: {summary.insulin.totalUnits} U</li>
            {Object.entries(summary.insulin.byInsulinName).map(([name, units]) => (
              <li key={name}>
                {name}: {units} U
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3>🍽️ Comidas</h3>
          <ul className="card-details">
            <li>{summary.meals.count} comidas registradas</li>
            <li>Carbohidratos totales: {summary.meals.totalCarbsG} g</li>
            {summary.meals.averageCarbsG != null && (
              <li>Promedio por comida: {summary.meals.averageCarbsG} g</li>
            )}
          </ul>
        </div>

        <div className="card">
          <h3>🏃 Actividad</h3>
          <ul className="card-details">
            <li>{summary.activity.sessionCount} sesiones</li>
            <li>{summary.activity.totalMinutes} minutos totales</li>
          </ul>
        </div>

        <div className="card">
          <h3>🚨 Hipoglucemias</h3>
          <ul className="card-details">
            <li>{summary.hypoglycemia.episodeCount} episodios</li>
            <li>Tratadas: {summary.hypoglycemia.treatedCount}</li>
            <li>Severas: {summary.hypoglycemia.severeCount}</li>
            {summary.hypoglycemia.averageCarbsConsumedG != null && (
              <li>
                Promedio de carbohidratos usados: {summary.hypoglycemia.averageCarbsConsumedG} g
              </li>
            )}
          </ul>
        </div>
      </div>

      <p className="form-hint">
        Esta es la Parte 1 de /resumen: los números son reales, calculados a
        partir de tus datos. El diseño visual, gráficos, análisis con IA y
        exportación PDF/CSV/JSON llegan en las siguientes fases.
      </p>
    </div>
  );
}