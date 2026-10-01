import { NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/auth-guard";
import { validateTiers, type TierInput } from "../../../../src/domain/DosingTiers";

export async function GET() {
  const session = await requireSession();

  const regimens = await prisma.insulinRegimen.findMany({
    where: { userId: session.userId, isActive: true },
    include: {
      versions: {
        where: { effectiveTo: null },
        orderBy: { effectiveFrom: "desc" },
        include: { tiers: { orderBy: { order: "asc" } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ regimens });
}

const VALID_TYPES = ["RAPID", "ULTRA_RAPID", "SHORT", "INTERMEDIATE", "LONG", "PREMIXED", "OTHER"];
const VALID_USAGES = ["MEALS", "CORRECTION", "BASAL", "PREMIXED", "OTHER"];
const VALID_MODALITIES = ["CARB_RATIO", "TIERED", "FIXED_DOSE", "MANUAL_ONLY"];
const VALID_SOURCES = ["DECLARED", "CONFIRMED_BY_PROFESSIONAL", "PENDING_REVIEW", "INACTIVE"];

export async function POST(request: Request) {
  const session = await requireSession();

  let body: {
    insulinName?: string;
    insulinType?: string;
    usage?: string;
    brandOrActiveIngredient?: string;
    concentration?: string;
    modality?: string;
    source?: string;
    professionalName?: string;
    prescribedDose?: number;
    schedule?: string;
    frequency?: string;
    carbRatio?: number;
    correctionFactor?: number;
    targetGlucoseLow?: number;
    targetGlucoseHigh?: number;
    notes?: string;
    professionalNotes?: string;
    tiers?: TierInput[];
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
  if (!VALID_TYPES.includes(insulinType) || !VALID_USAGES.includes(usage)) {
    return NextResponse.json({ error: "Tipo o uso de insulina no válido." }, { status: 400 });
  }

  const modality = body.modality && VALID_MODALITIES.includes(body.modality) ? body.modality : "MANUAL_ONLY";
  const source = body.source && VALID_SOURCES.includes(body.source) ? body.source : "DECLARED";

  // Modalidad B: la tabla de tramos se valida ANTES de guardar nada — nunca
  // se calcula una dosis con ella, solo se verifica que sea consistente
  // (sin solapes, sin mezclar "por intervalo total" con "acumulativo").
  if (modality === "TIERED" && body.tiers && body.tiers.length > 0) {
    const tierErrors = validateTiers(body.tiers);
    if (tierErrors.length > 0) {
      return NextResponse.json(
        { error: "La tabla de tramos tiene errores.", tierErrors },
        { status: 400 },
      );
    }
  }

  const regimen = await prisma.insulinRegimen.create({
    data: {
      userId: session.userId,
      insulinName,
      insulinType: insulinType as never,
      usage: usage as never,
      brandOrActiveIngredient: body.brandOrActiveIngredient || undefined,
      concentration: body.concentration || undefined,
      versions: {
        create: {
          modality: modality as never,
          source: source as never,
          professionalName: body.professionalName || undefined,
          prescribedDose: body.prescribedDose,
          schedule: body.schedule,
          frequency: body.frequency,
          carbRatio: body.carbRatio,
          correctionFactor: body.correctionFactor,
          targetGlucoseLow: body.targetGlucoseLow,
          targetGlucoseHigh: body.targetGlucoseHigh,
          notes: body.notes,
          professionalNotes: body.professionalNotes || undefined,
          changedByUserId: session.userId,
          changeReason: "Registro inicial del tratamiento",
          tiers:
            modality === "TIERED" && body.tiers
              ? {
                  create: body.tiers.map((t) => ({
                    order: t.order,
                    carbsFromG: t.carbsFromG,
                    carbsToG: t.carbsToG,
                    units: t.units,
                    isCumulative: t.isCumulative,
                    description: t.description || undefined,
                  })),
                }
              : undefined,
        },
      },
    },
    include: { versions: { include: { tiers: true } } },
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
