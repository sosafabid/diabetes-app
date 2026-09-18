import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import { getUserTimeZone } from "../../../src/lib/timezone";
import RegistrarInsulinaForm from "./RegistrarInsulinaForm";

const PROP_LABELS: Record<string, string> = {
  MEAL: "Comida",
  CORRECTION: "Corrección",
  BASAL: "Basal",
  OTHER: "Otro",
};

export default async function InsulinaPage() {
  const session = await requireSession();
  const timeZone = await getUserTimeZone();
  const [regimens, events] = await Promise.all([
    prisma.insulinRegimen.findMany({
      where: { userId: session.userId, isActive: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.insulinEvent.findMany({
      where: { userId: session.userId },
      include: { insulinRegimen: true },
      orderBy: { timestamp: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="page">
      <h1>Insulina</h1>
      <RegistrarInsulinaForm
        regimens={regimens.map((r) => ({
          id: r.id,
          insulinName: r.insulinName,
          usage: r.usage,
        }))}
      />

      <h2>Últimas dosis</h2>
      {events.length === 0 ? (
        <div className="empty-state">
          <p>Todavía no has registrado ninguna dosis de insulina.</p>
        </div>
      ) : (
        <ul className="event-list">
          {events.map((ev) => (
            <li key={ev.id} className="event-item">
              <span>{ev.insulinRegimen.insulinName}</span>
              <span className="event-value">{ev.dose} U</span>
              <span>{PROP_LABELS[ev.purpose] ?? ev.purpose}</span>
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