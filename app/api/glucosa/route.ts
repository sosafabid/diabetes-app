import { NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";

const VALID_SOURCES = ["BLOOD", "CGM"];
const VALID_TRENDS = [
  "STABLE",
  "RISING",
  "RISING_FAST",
  "FALLING",
  "FALLING_FAST",
];
const VALID_CONTEXTS = [
  "BEFORE_MEAL",
  "AFTER_MEAL",
  "BEFORE_EXERCISE",
  "AFTER_EXERCISE",
  "BEFORE_SLEEP",
  "SUSPECTED_HYPO",
  "OTHER",
];

export async function GET() {
  const session = await requireSession();
  const readings = await prisma.glucoseReading.findMany({
    where: { userId: session.userId },
    orderBy: { timestamp: "desc" },
    take: 50,
  });
  return NextResponse.json({ readings });
}

export async function POST(request: Request) {
  const session = await requireSession();

  let body: {
    glucoseValue?: number;
    unit?: string;
    measurementSource?: string;
    cgmTrend?: string;
    context?: string;
    timestamp?: string;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { glucoseValue, unit, measurementSource } = body;

  if (typeof glucoseValue !== "number" || Number.isNaN(glucoseValue)) {
    return NextResponse.json(
      { error: "El valor de glucosa es obligatorio." },
      { status: 400 },
    );
  }
  if (unit !== "MGDL" && unit !== "MMOLL") {
    return NextResponse.json(
      { error: "La unidad de glucosa no es válida." },
      { status: 400 },
    );
  }
  if (!measurementSource || !VALID_SOURCES.includes(measurementSource)) {
    return NextResponse.json(
      { error: "Debes indicar la fuente de medición: sangre o CGM." },
      { status: 400 },
    );
  }
  if (body.cgmTrend && !VALID_TRENDS.includes(body.cgmTrend)) {
    return NextResponse.json(
      { error: "Tendencia de CGM no válida." },
      { status: 400 },
    );
  }
  if (body.context && !VALID_CONTEXTS.includes(body.context)) {
    return NextResponse.json(
      { error: "Contexto no válido." },
      { status: 400 },
    );
  }

  const reading = await prisma.glucoseReading.create({
    data: {
      userId: session.userId,
      glucoseValue,
      unit: unit as never,
      measurementSource: measurementSource as never,
      cgmTrend:
        measurementSource === "CGM" && body.cgmTrend
          ? (body.cgmTrend as never)
          : undefined,
      context: body.context ? (body.context as never) : undefined,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      notes: body.notes || undefined,
    },
  });

  // Alerta automática si la glucosa está baja — no calcula ni sugiere dosis,
  // solo registra la alerta para que el paciente siga su plan de hipoglucemia.
  const mgdl =
    unit === "MMOLL" ? glucoseValue * 18.0182 : glucoseValue;
  if (mgdl < 70) {
    await prisma.alert.create({
      data: {
        userId: session.userId,
        type: "LOW_GLUCOSE",
        severity: mgdl < 54 ? "CRITICAL" : "WARNING",
        message:
          "Se registró una glucosa baja. Sigue tu plan de tratamiento de hipoglucemia indicado por tu profesional de salud.",
        relatedEntityType: "GlucoseReading",
        relatedEntityId: reading.id,
      },
    });
  }

  return NextResponse.json({ reading });
}
