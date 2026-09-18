import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import { getUserTimeZone } from "../../../src/lib/timezone";
import RegistrarBienestarForm from "./RegistrarBienestarForm";

const LABELS: Record<string, { emoji: string; label: string }> = {
  LOW: { emoji: "😌", label: "Tranquilo/a" },
  MODERATE: { emoji: "😐", label: "Normal" },
  HIGH: { emoji: "😣", label: "Estresado/a" },
};

export default async function BienestarPage() {
  const session = await requireSession();
  const timeZone = await getUserTimeZone();
  const events = await prisma.contextEvent.findMany({
    where: { userId: session.userId },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  return (
    <div className="page">
      <h1>Estado de ánimo</h1>
      <p className="page-subtitle">
        Un registro rápido y opcional de cómo te sientes — nada clínico, solo
        para tener el dato a mano si te sirve más adelante.
      </p>

      <RegistrarBienestarForm />

      <h2>Últimos registros</h2>
      {events.length === 0 ? (
        <div className="empty-state">
          <p>Todavía no has registrado cómo te sientes.</p>
        </div>
      ) : (
        <ul className="event-list">
          {events.map((ev) => (
            <li key={ev.id} className="event-item">
              <span>
                {ev.reportedStress
                  ? `${LABELS[ev.reportedStress]?.emoji ?? ""} ${LABELS[ev.reportedStress]?.label ?? ev.reportedStress}`
                  : "—"}
              </span>
              {ev.notes && <span>{ev.notes}</span>}
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