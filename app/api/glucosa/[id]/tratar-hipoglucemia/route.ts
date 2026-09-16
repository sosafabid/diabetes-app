import { NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireSession } from "../../../../../src/lib/auth-guard";

// Flujo: Glucosa baja → SafetyEngine ya bloqueó cualquier cálculo de dosis
// (no hay ninguno conectado a esta pantalla todavía) → paciente sigue su
// plan personal → registra los carbohidratos que consumió → se crea un
// FollowUp para recordarle volver a medir en los minutos configurados.
//
// IMPORTANTE: esta ruta NUNCA calcula gramos de carbohidratos a partir de la
// diferencia de glucosa. Solo registra lo que el paciente dice haber
// consumido, según su plan ya configurado.
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await requireSession();

  const event = await prisma.hypoglycemiaEvent.findFirst({
    where: { glucoseReadingId: params.id, userId: session.userId },
    include: { hypoglycemiaPlan: true },
  });
  if (!event) {
    return NextResponse.json(
      { error: "No se encontró un evento de hipoglucemia para esta lectura." },
      { status: 404 },
    );
  }
  if (event.status !== "PENDING") {
    return NextResponse.json(
      { error: "Este evento ya fue atendido." },
      { status: 409 },
    );
  }

  let body: { carbsConsumedG?: number; productUsed?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const carbsConsumedG =
    typeof body.carbsConsumedG === "number" && body.carbsConsumedG > 0
      ? body.carbsConsumedG
      : (event.hypoglycemiaPlan?.fastCarbsG ?? undefined);

  if (carbsConsumedG === undefined) {
    return NextResponse.json(
      { error: "Indica cuántos gramos de carbohidratos consumiste." },
      { status: 400 },
    );
  }

  const reassessMinutes = event.hypoglycemiaPlan?.reassessMinutes ?? 15;
  const dueAt = new Date(Date.now() + reassessMinutes * 60000);

  const result = await prisma.$transaction(async (tx) => {
    const followUp = await tx.followUp.create({
      data: {
        userId: session.userId,
        dueAt,
        description: `Volver a medir tu glucosa (hipoglucemia tratada con ${carbsConsumedG} g de carbohidratos).`,
      },
    });

    const updatedEvent = await tx.hypoglycemiaEvent.update({
      where: { id: event.id },
      data: {
        status: "TREATED",
        treatedAt: new Date(),
        carbsConsumedG,
        productUsed: body.productUsed || undefined,
        followUpId: followUp.id,
      },
      include: { followUp: true },
    });

    // Ya se actuó sobre la hipoglucemia — resolver la alerta que la
    // acompañaba para que no se acumule indefinidamente en "Hoy".
    await tx.alert.updateMany({
      where: {
        userId: session.userId,
        relatedEntityType: "GlucoseReading",
        relatedEntityId: params.id,
        resolvedAt: null,
      },
      data: { resolvedAt: new Date() },
    });

    return updatedEvent;
  });

  return NextResponse.json({ event: result });
}