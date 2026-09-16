import { NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireSession } from "../../../../../src/lib/auth-guard";

// Escenario severo (paciente inconsciente / no puede tragar, reportado por
// un cuidador, o el propio paciente si aún puede usar el teléfono). Esta
// ruta NUNCA calcula carbohidratos ni insulina — solo registra el evento y
// depende de instrucciones ya configuradas (p.ej. glucagón) para orientar.
export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await requireSession();

  const event = await prisma.hypoglycemiaEvent.findFirst({
    where: { glucoseReadingId: params.id, userId: session.userId },
  });
  if (!event) {
    return NextResponse.json(
      { error: "No se encontró un evento de hipoglucemia para esta lectura." },
      { status: 404 },
    );
  }

  const updated = await prisma.hypoglycemiaEvent.update({
    where: { id: event.id },
    data: { status: "SEVERE", severeMarkedAt: new Date() },
  });

  await prisma.alert.create({
    data: {
      userId: session.userId,
      type: "LOW_GLUCOSE",
      severity: "CRITICAL",
      message:
        "Se marcó una hipoglucemia severa. Busca asistencia de emergencia si no la has buscado ya.",
      relatedEntityType: "HypoglycemiaEvent",
      relatedEntityId: event.id,
    },
  });

  return NextResponse.json({ event: updated });
}