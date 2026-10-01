import { NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireSession } from "../../../../../src/lib/auth-guard";

// Marca "el paciente dice que esto ya se resolvió" — NUNCA automático por
// tiempo transcurrido ni por agregar una entrada. El evento sigue
// existiendo y se puede seguir consultando/agregando entradas hasta que
// se cierre explícitamente.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();

  const event = await prisma.glucoseEvent.findUnique({ where: { id: params.id } });
  if (!event || event.userId !== session.userId) {
    return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
  }
  if (event.status === "CLOSED") {
    return NextResponse.json({ error: "Este evento ya está cerrado." }, { status: 400 });
  }

  const updated = await prisma.glucoseEvent.update({
    where: { id: event.id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });

  return NextResponse.json({ event: updated });
}
