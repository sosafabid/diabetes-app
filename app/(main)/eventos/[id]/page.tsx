import Link from "next/link";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/auth-guard";
import EventoDetalle from "./EventoDetalle";

export default async function EventoDetallePage({ params }: { params: { id: string } }) {
  const session = await requireSession();

  const [event, insulinRegimens] = await Promise.all([
    prisma.glucoseEvent.findUnique({
      where: { id: params.id },
      include: {
        initialGlucoseReading: true,
        interventions: { orderBy: { timestamp: "asc" }, include: { insulinEvent: true } },
        measurements: { orderBy: { createdAt: "asc" }, include: { glucoseReading: true } },
      },
    }),
    prisma.insulinRegimen.findMany({
      where: { userId: session.userId, isActive: true },
      select: { id: true, insulinName: true },
    }),
  ]);

  if (!event || event.userId !== session.userId) {
    return (
      <div className="page">
        <p>Evento no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <p className="page-subtitle">
        <Link href="/eventos">← Volver a Eventos</Link>
      </p>
      <EventoDetalle
        initialEvent={{
          ...event,
          startedAt: event.startedAt.toISOString(),
          resolvedAt: event.resolvedAt?.toISOString() ?? null,
          endedAt: event.endedAt?.toISOString() ?? null,
          initialGlucoseReading: {
            ...event.initialGlucoseReading,
            timestamp: event.initialGlucoseReading.timestamp.toISOString(),
          },
          interventions: event.interventions.map((i) => ({
            ...i,
            timestamp: i.timestamp.toISOString(),
          })),
          measurements: event.measurements.map((m) => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
            glucoseReading: { ...m.glucoseReading, timestamp: m.glucoseReading.timestamp.toISOString() },
          })),
        }}
        insulinRegimens={insulinRegimens}
      />
    </div>
  );
}
