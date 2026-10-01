import { NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireSession } from "../../../../../src/lib/auth-guard";

// Un evento puede recibir VARIAS intervenciones — nunca se asume que una
// sola "cierra" el evento. El cierre siempre lo decide el paciente
// explícitamente (ver /cerrar).
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();

  const event = await prisma.glucoseEvent.findUnique({ where: { id: params.id } });
  if (!event || event.userId !== session.userId) {
    return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
  }
  if (event.status === "CLOSED") {
    return NextResponse.json(
      { error: "Este evento ya está cerrado — no se pueden agregar más intervenciones." },
      { status: 400 },
    );
  }

  let body: {
    type?: "CARBOHYDRATE" | "INSULIN";
    food?: string;
    carbohydrateGrams?: number;
    insulinRegimenId?: string;
    dose?: number;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body.type || !["CARBOHYDRATE", "INSULIN"].includes(body.type)) {
    return NextResponse.json({ error: "Tipo de intervención no válido." }, { status: 400 });
  }

  if (body.type === "CARBOHYDRATE") {
    if (typeof body.carbohydrateGrams !== "number" || body.carbohydrateGrams < 0) {
      return NextResponse.json({ error: "La cantidad de carbohidratos es obligatoria." }, { status: 400 });
    }
    const intervention = await prisma.eventIntervention.create({
      data: {
        glucoseEventId: event.id,
        type: "CARBOHYDRATE",
        food: body.food || undefined,
        carbohydrateGrams: body.carbohydrateGrams,
        timestamp: new Date(),
        notes: body.notes || undefined,
      },
    });
    return NextResponse.json({ intervention });
  }

  // INSULIN — nunca se duplica la entidad: se crea el InsulinEvent REAL
  // (el mismo que aparece en /insulina) y solo se enlaza al evento.
  if (!body.insulinRegimenId || typeof body.dose !== "number" || body.dose < 0) {
    return NextResponse.json(
      { error: "La insulina y la dosis administrada son obligatorias." },
      { status: 400 },
    );
  }
  const regimen = await prisma.insulinRegimen.findUnique({ where: { id: body.insulinRegimenId } });
  if (!regimen || regimen.userId !== session.userId) {
    return NextResponse.json({ error: "Insulina no válida." }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const insulinEvent = await tx.insulinEvent.create({
      data: {
        userId: session.userId,
        insulinRegimenId: regimen.id,
        timestamp: new Date(),
        dose: body.dose as number,
        purpose: "CORRECTION",
        notes: body.notes || undefined,
      },
    });
    const intervention = await tx.eventIntervention.create({
      data: {
        glucoseEventId: event.id,
        type: "INSULIN",
        insulinEventId: insulinEvent.id,
        timestamp: insulinEvent.timestamp,
        notes: body.notes || undefined,
      },
      include: { insulinEvent: true },
    });
    return intervention;
  });

  return NextResponse.json({ intervention: result });
}
