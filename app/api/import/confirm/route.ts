import { NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/auth-guard";
import {
  normalizeRows,
  splitNewAndDuplicates,
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

  const parsed = Papa.parse<Record<string, string>>(body.csvText, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.data.length === 0) {
    return NextResponse.json({ error: "El archivo está vacío." }, { status: 400 });
  }

  const defaultUnit = body.defaultUnit ?? "MGDL";
  const { validRows, errors } = normalizeRows(parsed.data, body.mapping, defaultUnit);

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

  const status =
    newRows.length === 0
      ? "FAILED"
      : errors.length > 0 || duplicateCount > 0
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
      totalRows: parsed.data.length,
      importedRows: newRows.length,
      duplicateRows: duplicateCount,
      errorRows: errors.length,
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

  return NextResponse.json({
    batchId: batch.id,
    status: batch.status,
    totalRows: parsed.data.length,
    importedRows: newRows.length,
    duplicateRows: duplicateCount,
    errorRows: errors.length,
    errors: errors.slice(0, 100),
  });
}