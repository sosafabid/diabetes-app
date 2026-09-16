import { NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";

const VALID_TYPES = [
  "WALKING",
  "RUNNING",
  "CYCLING",
  "WEIGHTS",
  "HIIT",
  "SWIMMING",
  "SPORT",
  "OTHER",
];
const VALID_INTENSITY = ["LIGHT", "MODERATE", "INTENSE"];

export async function GET() {
  const session = await requireSession();
  const events = await prisma.exerciseEvent.findMany({
    where: { userId: session.userId },
    orderBy: { timestamp: "desc" },
    take: 50,
  });
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const session = await requireSession();

  let body: { type?: string; duration?: number; intensity?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json(
      { error: "El tipo de actividad no es válido." },
      { status: 400 },
    );
  }
  if (typeof body.duration !== "number" || body.duration <= 0) {
    return NextResponse.json(
      { error: "La duración debe ser mayor a cero." },
      { status: 400 },
    );
  }
  if (!body.intensity || !VALID_INTENSITY.includes(body.intensity)) {
    return NextResponse.json(
      { error: "La intensidad no es válida." },
      { status: 400 },
    );
  }

  const event = await prisma.exerciseEvent.create({
    data: {
      userId: session.userId,
      type: body.type as never,
      duration: body.duration,
      intensity: body.intensity as never,
      timestamp: new Date(),
    },
  });

  return NextResponse.json({ event });
}
