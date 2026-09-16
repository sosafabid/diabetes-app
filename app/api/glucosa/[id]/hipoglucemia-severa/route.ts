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

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.hypoglycemiaEvent.update({
      where: { id: event.id },
      data: { status: "SEVERE", severeMarkedAt: new Date() },
    });

    // Resolver la alerta original de glucosa baja — ya se actuó (se marcó
    // como severa), no debe seguir apareciendo como pendiente en "Hoy".
    await tx.alert.updateMany({
      where: {
        userId: session.userId,
        relatedEntityType: "GlucoseReading",
        relatedEntityId: params.id,
        resolvedAt: null,
      },
      data: { resolvedAt: new Date() },
    });

    // Esta alerta queda ya resuelta al crearse: el paciente/cuidador ya hizo
    // clic en "ya busqué ayuda", que es la acción que representaba. Queda
    // igualmente registrada en el historial (Alert.resolvedAt con valor,
    // no eliminada) para trazabilidad — solo deja de mostrarse como pendiente.
    await tx.alert.create({
      data: {
        userId: session.userId,
        type: "LOW_GLUCOSE",
        severity: "CRITICAL",
        message:
          "Se marcó una hipoglucemia severa. Se buscó asistencia de emergencia.",
        relatedEntityType: "HypoglycemiaEvent",
        relatedEntityId: event.id,
        resolvedAt: new Date(),
      },
    });

    return result;
  });

  return NextResponse.json({ event: updated });
}