import { NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireSession } from "../../../../../src/lib/auth-guard";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();

  // Nunca confiar en el userId del cliente — el dueño del lote se valida
  // contra la sesión, nunca contra un parámetro de la URL.
  const batch = await prisma.importBatch.findUnique({ where: { id: params.id } });
  if (!batch || batch.userId !== session.userId) {
    return NextResponse.json({ error: "Importación no encontrada." }, { status: 404 });
  }

  const deleted = await prisma.$transaction(async (tx) => {
    // Solo lo de ESTE lote — nunca lo manual, nunca otro lote. Insulina
    // primero (por su FK opcional hacia Meal).
    const insulinResult = await tx.insulinEvent.deleteMany({
      where: { importBatchId: batch.id, userId: session.userId },
    });
    const mealsResult = await tx.meal.deleteMany({
      where: { importBatchId: batch.id, userId: session.userId },
    });
    const glucoseResult = await tx.glucoseReading.deleteMany({
      where: { importBatchId: batch.id, userId: session.userId },
    });
    await tx.importBatch.delete({ where: { id: batch.id } });
    return {
      readings: glucoseResult.count,
      meals: mealsResult.count,
      insulinEvents: insulinResult.count,
    };
  });

  return NextResponse.json({ ok: true, deleted });
}
