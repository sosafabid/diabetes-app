import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import { getUserTimeZone } from "../../../src/lib/timezone";
import RegistrarActividadForm from "./RegistrarActividadForm";

const TIPO_LABELS: Record<string, string> = {
  WALKING: "Caminar",
  RUNNING: "Correr",
  CYCLING: "Ciclismo",
  WEIGHTS: "Pesas",
  HIIT: "HIIT",
  SWIMMING: "Natación",
  SPORT: "Deporte",
  OTHER: "Otro",
};

export default async function ActividadPage() {
  const session = await requireSession();
  const timeZone = await getUserTimeZone();
  const events = await prisma.exerciseEvent.findMany({
    where: { userId: session.userId },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  return (
    <div className="page">
      <h1>Actividad física</h1>
      <RegistrarActividadForm />

      <h2>Últimas actividades</h2>
      {events.length === 0 ? (
        <div className="empty-state">
          <p>Todavía no has registrado ninguna actividad.</p>
        </div>
      ) : (
        <ul className="event-list">
          {events.map((ev) => (
            <li key={ev.id} className="event-item">
              <span>{TIPO_LABELS[ev.type] ?? ev.type}</span>
              <span className="event-value">{ev.duration} min</span>
              <span className="event-time">
                {new Date(ev.timestamp).toLocaleString("es-CR", { timeZone })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}