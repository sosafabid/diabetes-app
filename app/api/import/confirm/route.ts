import { NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/auth-guard";
import {
  detectHeaderRowIndex,
  rowsToRecords,
  normalizeRows,
  normalizeMealsAndInsulin,
  splitNewAndDuplicates,
  splitNewMeals,
  splitNewInsulin,
  type ColumnMapping,
  type GlucoseUnitCode,
} from "../../../../src/domain/GenericCSVImporter";

const VALID_SOURCES = ["BLOOD", "CGM"];

export async function POST(request: Request) {
  const session = await requireSession();

  let body: {
    csvText?: string;
    mapping?: ColumnMapping;
    defaultUnit?: GlucoseUnitCode;
    sourceType?: string;
    fileName?: string;
    deviceManufacturer?: string;
    deviceModel?: string;
    rapidInsulinRegimenId?: string;
    longActingInsulinRegimenId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body.csvText || !body.mapping || !body.fileName) {
    return NextResponse.json({ error: "Faltan datos para confirmar la importación." }, { status: 400 });
  }
  if (!body.sourceType || !VALID_SOURCES.includes(body.sourceType)) {
    return NextResponse.json(
      { error: "Debes confirmar si estos datos son de sangre/glucómetro o de CGM." },
      { status: 400 },
    );
  }

  const rawParsed = Papa.parse<string[]>(body.csvText, { skipEmptyLines: true });
  const rawRows = rawParsed.data;
  if (rawRows.length === 0) {
    return NextResponse.json({ error: "El archivo está vacío." }, { status: 400 });
  }
  const headerRowIndex = detectHeaderRowIndex(rawRows);
  const { records } = rowsToRecords(rawRows, headerRowIndex);
  if (records.length === 0) {
    return NextResponse.json({ error: "El archivo está vacío." }, { status: 400 });
  }

  const defaultUnit = body.defaultUnit ?? "MGDL";
  const { validRows, errors } = normalizeRows(records, body.mapping, defaultUnit);

  let newRows = validRows;
  let duplicateCount = 0;
  let dateRangeStart: Date | null = null;
  let dateRangeEnd: Date | null = null;

  if (validRows.length > 0) {
    const timestamps = validRows.map((r) => r.timestamp.getTime());
    dateRangeStart = new Date(Math.min(...timestamps));
    dateRangeEnd = new Date(Math.max(...timestamps));

    // Se vuelve a consultar (no se reutiliza el conteo del preview) por si
    // pasó tiempo entre analizar y confirmar y ya se guardó algo más.
    const existing = await prisma.glucoseReading.findMany({
      where: { userId: session.userId, timestamp: { gte: dateRangeStart, lte: dateRangeEnd } },
      select: { timestamp: true, glucoseValue: true, unit: true },
    });
    const split = splitNewAndDuplicates(
      validRows,
      existing.map((e) => ({ timestamp: e.timestamp, glucoseValue: e.glucoseValue, unit: e.unit })),
    );
    newRows = split.newRows;
    duplicateCount = split.duplicates.length;
  }

  // ---- Comidas e insulina (mismo archivo, columnas separadas) ----
  const { meals: parsedMeals, insulin: parsedInsulin } = normalizeMealsAndInsulin(records, body.mapping);
  const rapidDoses = parsedInsulin.filter((i) => i.kind === "RAPID");
  const longDoses = parsedInsulin.filter((i) => i.kind === "LONG");

  // Si el archivo trae dosis de insulina, el paciente TIENE que decir a
  // cuál de sus regímenes ya configurados corresponden — nunca se inventa
  // un régimen nuevo ni se adivina.
  if (rapidDoses.length > 0 && !body.rapidInsulinRegimenId) {
    return NextResponse.json(
      { error: "Este archivo trae dosis de insulina rápida — indica a cuál de tus insulinas corresponde." },
      { status: 400 },
    );
  }
  if (longDoses.length > 0 && !body.longActingInsulinRegimenId) {
    return NextResponse.json(
      { error: "Este archivo trae dosis de insulina prolongada — indica a cuál de tus insulinas corresponde." },
      { status: 400 },
    );
  }
  const regimenIdsToVerify = [body.rapidInsulinRegimenId, body.longActingInsulinRegimenId].filter(
    (id): id is string => Boolean(id),
  );
  if (regimenIdsToVerify.length > 0) {
    const ownedCount = await prisma.insulinRegimen.count({
      where: { id: { in: regimenIdsToVerify }, userId: session.userId },
    });
    if (ownedCount !== regimenIdsToVerify.length) {
      return NextResponse.json({ error: "Régimen de insulina no válido." }, { status: 400 });
    }
  }

  let newMeals = parsedMeals;
  let duplicateMealCount = 0;
  if (parsedMeals.length > 0) {
    const mealTimestamps = parsedMeals.map((m) => m.timestamp.getTime());
    const existingMeals = await prisma.meal.findMany({
      where: {
        userId: session.userId,
        timestamp: { gte: new Date(Math.min(...mealTimestamps)), lte: new Date(Math.max(...mealTimestamps)) },
      },
      select: { timestamp: true, carbsGDirect: true },
    });
    const split = splitNewMeals(
      parsedMeals,
      existingMeals
        .filter((m) => m.carbsGDirect != null)
        .map((m) => ({ timestamp: m.timestamp, carbsG: m.carbsGDirect as number })),
    );
    newMeals = split.newRows;
    duplicateMealCount = split.duplicates.length;
  }

  const insulinWithRegimen = parsedInsulin.map((i) => ({
    ...i,
    insulinRegimenId: (i.kind === "RAPID" ? body.rapidInsulinRegimenId : body.longActingInsulinRegimenId) as string,
  }));
  let newInsulin = insulinWithRegimen;
  let duplicateInsulinCount = 0;
  if (insulinWithRegimen.length > 0) {
    const insulinTimestamps = insulinWithRegimen.map((i) => i.timestamp.getTime());
    const existingInsulin = await prisma.insulinEvent.findMany({
      where: {
        userId: session.userId,
        insulinRegimenId: { in: regimenIdsToVerify },
        timestamp: { gte: new Date(Math.min(...insulinTimestamps)), lte: new Date(Math.max(...insulinTimestamps)) },
      },
      select: { timestamp: true, dose: true, insulinRegimenId: true },
    });
    const split = splitNewInsulin(insulinWithRegimen, existingInsulin);
    newInsulin = split.newRows;
    duplicateInsulinCount = split.duplicates.length;
  }

  const status =
    newRows.length === 0 && newMeals.length === 0 && newInsulin.length === 0
      ? "FAILED"
      : errors.length > 0 || duplicateCount > 0 || duplicateMealCount > 0 || duplicateInsulinCount > 0
        ? "PARTIAL"
        : "COMPLETED";

  const batch = await prisma.importBatch.create({
    data: {
      userId: session.userId,
      fileName: body.fileName,
      sourceType: body.sourceType as never,
      deviceManufacturer: body.deviceManufacturer || undefined,
      deviceModel: body.deviceModel || undefined,
      dateRangeStart,
      dateRangeEnd,
      totalRows: records.length,
      importedRows: newRows.length,
      duplicateRows: duplicateCount + duplicateMealCount + duplicateInsulinCount,
      errorRows: errors.length,
      importedMeals: newMeals.length,
      importedInsulinEvents: newInsulin.length,
      status: status as never,
      errorDetails: errors.length > 0 ? (errors as any) : undefined,
    },
  });

  if (newRows.length > 0) {
    // NOTA IMPORTANTE: a propósito NO se dispara la detección de glucosa
    // baja (Alert / HypoglycemiaEvent) para lecturas importadas — esa
    // detección es para monitoreo en tiempo real; disparar cientos de
    // alertas "trata esto ahora" sobre datos históricos no tiene sentido
    // y sería ruido dañino para el paciente.
    await prisma.glucoseReading.createMany({
      data: newRows.map((r) => ({
        userId: session.userId,
        timestamp: r.timestamp,
        glucoseValue: r.glucoseValue,
        unit: r.unit as never,
        measurementSource: body.sourceType as never,
        origin: "IMPORT",
        deviceManufacturer: body.deviceManufacturer || undefined,
        deviceModel: body.deviceModel || undefined,
        importBatchId: batch.id,
      })),
    });
  }

  if (newMeals.length > 0) {
    // mealType siempre "OTHER" — el archivo solo trae gramos, nunca
    // especifica si fue desayuno/almuerzo/cena; no lo inventamos.
    await prisma.meal.createMany({
      data: newMeals.map((m) => ({
        userId: session.userId,
        timestamp: m.timestamp,
        mealType: "OTHER" as never,
        carbsGDirect: m.carbsG,
        origin: "IMPORT",
        importBatchId: batch.id,
      })),
    });
  }

  if (newInsulin.length > 0) {
    await prisma.insulinEvent.createMany({
      data: newInsulin.map((i) => ({
        userId: session.userId,
        insulinRegimenId: i.insulinRegimenId,
        timestamp: i.timestamp,
        dose: i.dose,
        // Rápida importada se asume de comida (el uso más común); larga
        // siempre es basal. Es una simplificación razonable — el archivo
        // no distingue "corrección" de "comida" para la rápida.
        purpose: (i.kind === "RAPID" ? "MEAL" : "BASAL") as never,
        origin: "IMPORT",
        importBatchId: batch.id,
      })),
    });
  }

  return NextResponse.json({
    batchId: batch.id,
    status: batch.status,
    totalRows: records.length,
    importedRows: newRows.length,
    duplicateRows: duplicateCount,
    errorRows: errors.length,
    errors: errors.slice(0, 100),
    importedMeals: newMeals.length,
    duplicateMeals: duplicateMealCount,
    importedInsulinEvents: newInsulin.length,
    duplicateInsulinEvents: duplicateInsulinCount,
  });
}
