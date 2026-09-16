import { NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/auth-guard";

export async function GET() {
  const session = await requireSession();

  const regimens = await prisma.insulinRegimen.findMany({
    where: { userId: session.userId, isActive: true },
    include: {
      versions: {
        orderBy: { effectiveFrom: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ regimens });
}

export async function POST(request: Request) {
  const session = await requireSession();

  let body: {
    insulinName?: string;
    insulinType?: string;
    usage?: string;
    prescribedDose?: number;
    schedule?: string;
    frequency?: string;
    carbRatio?: number;
    correctionFactor?: number;
    targetGlucoseLow?: number;
    targetGlucoseHigh?: number;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { insulinName, insulinType, usage } = body;
  if (!insulinName || !insulinType || !usage) {
    return NextResponse.json(
      { error: "Nombre, tipo y uso de la insulina son obligatorios." },
      { status: 400 },
    );
  }

  const validTypes = [
    "RAPID",
    "ULTRA_RAPID",
    "SHORT",
    "INTERMEDIATE",
    "LONG",
    "OTHER",
  ];
  const validUsages = ["MEALS", "CORRECTION", "BASAL", "OTHER"];
  if (!validTypes.includes(insulinType) || !validUsages.includes(usage)) {
    return NextResponse.json(
      { error: "Tipo o uso de insulina no válido." },
      { status: 400 },
    );
  }

  const regimen = await prisma.insulinRegimen.create({
    data: {
      userId: session.userId,
      insulinName,
      insulinType: insulinType as never,
      usage: usage as never,
      versions: {
        create: {
          prescribedDose: body.prescribedDose,
          schedule: body.schedule,
          frequency: body.frequency,
          carbRatio: body.carbRatio,
          correctionFactor: body.correctionFactor,
          targetGlucoseLow: body.targetGlucoseLow,
          targetGlucoseHigh: body.targetGlucoseHigh,
          notes: body.notes,
          changedByUserId: session.userId,
          changeReason: "Registro inicial del tratamiento",
        },
      },
    },
    include: { versions: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "REGIMEN_VERSION_CREATED",
      entityType: "InsulinRegimen",
      entityId: regimen.id,
    },
  });

  return NextResponse.json({ regimen });
}
