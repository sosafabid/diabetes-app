import { NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";

const VALID_STRESS = ["LOW", "MODERATE", "HIGH"];

export async function GET() {
  const session = await requireSession();
  const events = await prisma.contextEvent.findMany({
    where: { userId: session.userId },
    orderBy: { timestamp: "desc" },
    take: 20,
  });
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const session = await requireSession();

  let body: {
    reportedStress?: string;
    notes?: string;
    sleepHours?: number;
    isMenstruating?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body.reportedStress || !VALID_STRESS.includes(body.reportedStress)) {
    return NextResponse.json(
      { error: "Selecciona cómo te sientes." },
      { status: 400 },
    );
  }

  if (
    body.sleepHours != null &&
    (typeof body.sleepHours !== "number" || body.sleepHours < 0 || body.sleepHours > 24)
  ) {
    return NextResponse.json({ error: "Horas de sueño inválidas." }, { status: 400 });
  }

  const event = await prisma.contextEvent.create({
    data: {
      userId: session.userId,
      reportedStress: body.reportedStress as never,
      sleepHours: body.sleepHours ?? undefined,
      isMenstruating: body.isMenstruating ?? undefined,
      notes: body.notes || undefined,
      timestamp: new Date(),
    },
  });

  return NextResponse.json({ event });
}