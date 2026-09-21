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
    // Solo las lecturas de ESTE lote — nunca lo manual, nunca otro lote.
    const { count } = await tx.glucoseReading.deleteMany({
      where: { importBatchId: batch.id, userId: session.userId },
    });
    await tx.importBatch.delete({ where: { id: batch.id } });
    return count;
  });

  return NextResponse.json({ ok: true, deletedReadings: deleted });
}
