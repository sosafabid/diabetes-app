import { NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import { readingConflict } from "../../../src/domain/GlucoseEventIntegrity";

export async function GET(request: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // OPEN | RESOLVED | CLOSED | NEEDS_REVIEW

  const events = await prisma.glucoseEvent.findMany({
    where: {
      userId: session.userId,
      ...(status ? { status: status as never } : {}),
    },
    include: {
      initialGlucoseReading: true,
      interventions: { orderBy: { timestamp: "asc" }, include: { insulinEvent: true } },
      measurements: { orderBy: { createdAt: "asc" }, include: { glucoseReading: true } },
    },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const session = await requireSession();

  let body: {
    type?: "LOW" | "HIGH";
    glucoseValue?: number;
    unit?: "MGDL" | "MMOLL";
    measurementSource?: "BLOOD" | "CGM";
    symptoms?: string;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body.type || !["LOW", "HIGH"].includes(body.type)) {
    return NextResponse.json({ error: "Indica si es un evento de glucosa baja o alta." }, { status: 400 });
  }
  if (
    typeof body.glucoseValue !== "number" ||
    Number.isNaN(body.glucoseValue) ||
    !body.measurementSource ||
    !["BLOOD", "CGM"].includes(body.measurementSource)
  ) {
    return NextResponse.json(
      { error: "La glucosa inicial y su fuente (sangre/CGM) son obligatorias." },
      { status: 400 },
    );
  }

  // Para eventos LOW, se asocia el plan vigente (igual que hacía el flujo
  // anterior de HypoglycemiaEvent) — solo informativo, nunca se usa para
  // calcular nada aquí.
  const hypoglycemiaPlan =
    body.type === "LOW"
      ? await prisma.hypoglycemiaPlan.findFirst({
          where: { userId: session.userId, effectiveTo: null },
          orderBy: { effectiveFrom: "desc" },
        })
      : null;

  const result = await prisma.$transaction(async (tx) => {
    const reading = await tx.glucoseReading.create({
      data: {
        userId: session.userId,
        timestamp: new Date(),
        glucoseValue: body.glucoseValue as number,
        unit: (body.unit ?? "MGDL") as never,
        measurementSource: body.measurementSource as never,
      },
    });

    // Chequeo de integridad: esta lectura es recién creada, así que nunca
    // puede estar ya en conflicto — pero se valida igual por consistencia
    // con el resto del sistema (y por si en el futuro se permite elegir
    // una lectura YA existente en vez de crear una nueva).
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

    const event = await tx.glucoseEvent.create({
      data: {
        userId: session.userId,
        type: body.type as never,
        status: "OPEN",
        initialGlucoseReadingId: reading.id,
        hypoglycemiaPlanId: hypoglycemiaPlan?.id,
        symptoms: body.symptoms || undefined,
        notes: body.notes || undefined,
      },
      include: { initialGlucoseReading: true },
    });

    return event;
  });

  return NextResponse.json({ event: result });
}
