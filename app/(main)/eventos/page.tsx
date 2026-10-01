import Link from "next/link";
import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import { getUserTimeZone } from "../../../src/lib/timezone";
import NuevoEventoForm from "./NuevoEventoForm";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "🟡 En curso",
  RESOLVED: "🟢 Resuelto",
  CLOSED: "⚪ Cerrado",
  NEEDS_REVIEW: "🔵 Requiere revisión",
};

export default async function EventosPage() {
  const session = await requireSession();
  const timeZone = await getUserTimeZone();

  const events = await prisma.glucoseEvent.findMany({
    where: { userId: session.userId },
    include: {
      initialGlucoseReading: true,
      interventions: true,
      measurements: true,
    },
    orderBy: { startedAt: "desc" },
    take: 30,
  });

  return (
    <div className="page">
      <h1>Eventos de glucosa</h1>
      <p className="page-subtitle">
        Para seguir una glucosa baja o alta con varias mediciones y tratamientos, en vez de
        registros sueltos.
      </p>

      <NuevoEventoForm />

      <h2 style={{ marginTop: "1.5rem" }}>Historial</h2>
      {events.length === 0 ? (
        <div className="empty-state">
          <p>Todavía no has registrado ningún evento.</p>
        </div>
      ) : (
        <ul className="event-list">
          {events.map((ev) => (
            <li key={ev.id} className="card">
              <Link href={`/eventos/${ev.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {ev.type === "LOW" ? "🔻 Glucosa baja" : "🔺 Glucosa alta"} — {STATUS_LABELS[ev.status]}
                </p>
                <p className="form-hint" style={{ margin: "0.2rem 0" }}>
                  Inicial: {ev.initialGlucoseReading.glucoseValue}{" "}
                  {ev.initialGlucoseReading.unit === "MGDL" ? "mg/dL" : "mmol/L"} —{" "}
                  {new Date(ev.startedAt).toLocaleString("es-CR", { timeZone })}
                </p>
                <p className="form-hint" style={{ margin: 0 }}>
                  {ev.interventions.length} intervención{ev.interventions.length === 1 ? "" : "es"} ·{" "}
                  {ev.measurements.length} medición{ev.measurements.length === 1 ? "" : "es"} de seguimiento
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
