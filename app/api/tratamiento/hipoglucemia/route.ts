import { NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/auth-guard";

export async function GET() {
  const session = await requireSession();
  const plan = await prisma.hypoglycemiaPlan.findFirst({
    where: { userId: session.userId, effectiveTo: null },
    orderBy: { effectiveFrom: "desc" },
  });
  return NextResponse.json({ plan });
}

export async function POST(request: Request) {
  const session = await requireSession();

  let body: {
    lowThreshold?: number;
    fastCarbsG?: number;
    reassessMinutes?: number;
    productName?: string;
    carbsPerProductUnit?: number;
    glucagonAvailable?: boolean;
    glucagonInstructions?: string;
    emergencyInstructions?: string;
    changeReason?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { lowThreshold, fastCarbsG, reassessMinutes } = body;
  if (
    typeof lowThreshold !== "number" ||
    lowThreshold <= 0 ||
    typeof fastCarbsG !== "number" ||
    fastCarbsG <= 0 ||
    typeof reassessMinutes !== "number" ||
    reassessMinutes <= 0
  ) {
    return NextResponse.json(
      {
        error:
          "Umbral de glucosa baja, carbohidratos para tratarla y minutos para reevaluar son obligatorios.",
      },
      { status: 400 },
    );
  }

  // Nunca se sobrescribe: se cierra la versión vigente (si existe) y se crea una nueva.
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.hypoglycemiaPlan.findFirst({
      where: { userId: session.userId, effectiveTo: null },
    });
    if (current) {
      await tx.hypoglycemiaPlan.update({
        where: { id: current.id },
        data: { effectiveTo: new Date() },
      });
    }
    return tx.hypoglycemiaPlan.create({
      data: {
        userId: session.userId,
        lowThreshold,
        fastCarbsG,
        reassessMinutes,
        productName: body.productName || undefined,
        carbsPerProductUnit: body.carbsPerProductUnit ?? undefined,
        glucagonAvailable: body.glucagonAvailable ?? false,
        glucagonInstructions: body.glucagonInstructions || undefined,
        emergencyInstructions: body.emergencyInstructions || undefined,
        changedByUserId: session.userId,
        changeReason: body.changeReason || "Actualización del plan de hipoglucemia",
      },
    });
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "HYPOGLYCEMIA_PLAN_UPDATED",
      entityType: "HypoglycemiaPlan",
      entityId: result.id,
    },
  });

  return NextResponse.json({ plan: result });
}