import { NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";

const VALID_PURPOSES = ["MEAL", "CORRECTION", "BASAL", "OTHER"];

export async function GET() {
  const session = await requireSession();
  const events = await prisma.insulinEvent.findMany({
    where: { userId: session.userId },
    include: { insulinRegimen: true },
    orderBy: { timestamp: "desc" },
    take: 50,
  });
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const session = await requireSession();

  let body: { insulinRegimenId?: string; dose?: number; purpose?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body.insulinRegimenId) {
    return NextResponse.json(
      { error: "Debes seleccionar una insulina." },
      { status: 400 },
    );
  }
  if (typeof body.dose !== "number" || body.dose <= 0) {
    return NextResponse.json(
      { error: "La dosis debe ser un número mayor a cero." },
      { status: 400 },
    );
  }
  if (!body.purpose || !VALID_PURPOSES.includes(body.purpose)) {
    return NextResponse.json(
      { error: "El propósito de la dosis no es válido." },
      { status: 400 },
    );
  }

  const regimen = await prisma.insulinRegimen.findFirst({
    where: { id: body.insulinRegimenId, userId: session.userId },
  });
  if (!regimen) {
    return NextResponse.json(
      { error: "La insulina indicada no existe en tu tratamiento." },
      { status: 404 },
    );
  }

  const event = await prisma.insulinEvent.create({
    data: {
      userId: session.userId,
      insulinRegimenId: regimen.id,
      dose: body.dose,
      purpose: body.purpose as never,
      timestamp: new Date(),
    },
  });

  return NextResponse.json({ event });
}
