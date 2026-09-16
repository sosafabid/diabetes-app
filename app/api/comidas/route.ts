import { NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";

const VALID_MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"];

export async function GET() {
  const session = await requireSession();
  const meals = await prisma.meal.findMany({
    where: { userId: session.userId },
    orderBy: { timestamp: "desc" },
    take: 50,
  });
  return NextResponse.json({ meals });
}

export async function POST(request: Request) {
  const session = await requireSession();

  let body: { mealType?: string; carbsGDirect?: number; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body.mealType || !VALID_MEAL_TYPES.includes(body.mealType)) {
    return NextResponse.json(
      { error: "El tipo de comida no es válido." },
      { status: 400 },
    );
  }
  if (
    typeof body.carbsGDirect !== "number" ||
    Number.isNaN(body.carbsGDirect) ||
    body.carbsGDirect < 0
  ) {
    return NextResponse.json(
      { error: "Los carbohidratos (en gramos) son obligatorios." },
      { status: 400 },
    );
  }

  const meal = await prisma.meal.create({
    data: {
      userId: session.userId,
      mealType: body.mealType as never,
      carbsGDirect: body.carbsGDirect,
      notes: body.notes || undefined,
      timestamp: new Date(),
    },
  });

  return NextResponse.json({ meal });
}
