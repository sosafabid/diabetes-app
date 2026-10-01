import { NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireSession } from "../../../../../src/lib/auth-guard";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();

  const event = await prisma.glucoseEvent.findUnique({ where: { id: params.id } });
  if (!event || event.userId !== session.userId) {
    return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
  }
  if (event.status === "CLOSED") {
    return NextResponse.json({ error: "Este evento ya está cerrado." }, { status: 400 });
  }

  let body: { needsReview?: boolean };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const updated = await prisma.glucoseEvent.update({
    where: { id: event.id },
    data: {
      status: body.needsReview ? "NEEDS_REVIEW" : "CLOSED",
      endedAt: new Date(),
    },
  });

  return NextResponse.json({ event: updated });
}
