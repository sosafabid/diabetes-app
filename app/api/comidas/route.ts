import { NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import { resolveMealCarbsInput, CARBS_RANGES, type CarbsRangeCode } from "../../../src/domain/CarbsRange";

const VALID_MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"];
const VALID_RANGES = CARBS_RANGES.map((r) => r.code);

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

  let body: {
    mealType?: string;
    carbsMode?: "exact" | "range";
    carbsGDirect?: number;
    carbsRange?: string;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body.mealType || !VALID_MEAL_TYPES.includes(body.mealType)) {
    return NextResponse.json({ error: "El tipo de comida no es válido." }, { status: 400 });
  }

  const carbsMode = body.carbsMode ?? "exact";
  let resolved: ReturnType<typeof resolveMealCarbsInput>;

  if (carbsMode === "range") {
    if (!body.carbsRange || !VALID_RANGES.includes(body.carbsRange as CarbsRangeCode)) {
      return NextResponse.json({ error: "Selecciona un rango de carbohidratos válido." }, { status: 400 });
    }
    resolved = resolveMealCarbsInput({ mode: "range", range: body.carbsRange as CarbsRangeCode });
  } else {
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
    resolved = resolveMealCarbsInput({ mode: "exact", grams: body.carbsGDirect });
  }

  const meal = await prisma.meal.create({
    data: {
      userId: session.userId,
      mealType: body.mealType as never,
      carbsGDirect: resolved.carbsGDirect,
      carbsRange: resolved.carbsRange as never,
      carbsSource: resolved.carbsSource as never,
      notes: body.notes || undefined,
      timestamp: new Date(),
    },
  });

  return NextResponse.json({ meal });
}
