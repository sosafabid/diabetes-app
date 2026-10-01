import { NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireSession } from "../../../../../src/lib/auth-guard";
import { readingConflict } from "../../../../../src/domain/GlucoseEventIntegrity";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();

  const event = await prisma.glucoseEvent.findUnique({ where: { id: params.id } });
  if (!event || event.userId !== session.userId) {
    return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
  }
  if (event.status === "CLOSED") {
    return NextResponse.json(
      { error: "Este evento ya está cerrado — no se pueden agregar más mediciones." },
      { status: 400 },
    );
  }

  let body: { glucoseValue?: number; unit?: "MGDL" | "MMOLL"; measurementSource?: "BLOOD" | "CGM" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  if (
    typeof body.glucoseValue !== "number" ||
    Number.isNaN(body.glucoseValue) ||
    !body.measurementSource ||
    !["BLOOD", "CGM"].includes(body.measurementSource)
  ) {
    return NextResponse.json({ error: "La glucosa y su fuente son obligatorias." }, { status: 400 });
  }

  const measurement = await prisma.$transaction(async (tx) => {
    const reading = await tx.glucoseReading.create({
      data: {
        userId: session.userId,
        timestamp: new Date(),
        glucoseValue: body.glucoseValue as number,
        unit: (body.unit ?? "MGDL") as never,
        measurementSource: body.measurementSource as never,
      },
    });

    const [existingInitial, existingMeasurement] = await Promise.all([
      tx.glucoseEvent.findUnique({ where: { initialGlucoseReadingId: reading.id } }),
      tx.eventMeasurement.findUnique({ where: { glucoseReadingId: reading.id } }),
    ]);
    const conflict = readingConflict(
      reading.id,
      new Set(existingInitial ? [reading.id] : []),
      new Set(existingMeasurement ? [reading.id] : []),
    );
    if (conflict) {
      throw new Error("CONFLICT");
    }

    return tx.eventMeasurement.create({
      data: { glucoseEventId: event.id, glucoseReadingId: reading.id },
      include: { glucoseReading: true },
    });
  });

  return NextResponse.json({ measurement });
}
