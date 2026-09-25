import { NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/auth-guard";
import {
  detectColumns,
  detectHeaderRowIndex,
  rowsToRecords,
  normalizeRows,
  normalizeMealsAndInsulin,
  splitNewAndDuplicates,
  type ColumnMapping,
  type GlucoseUnitCode,
} from "../../../../src/domain/GenericCSVImporter";

// Límites generosos para un MVP — evita que un archivo gigante tumbe la
// función serverless. Nada mágico, solo un techo razonable.
const MAX_FILE_CHARS = 6_000_000; // ~6MB de texto
const MAX_ROWS = 30_000;
const SAMPLE_SIZE = 15;
const MAX_ERROR_ROWS_RETURNED = 100;

export async function POST(request: Request) {
  const session = await requireSession();

  let body: {
    csvText?: string;
    mapping?: ColumnMapping;
    defaultUnit?: GlucoseUnitCode;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body.csvText) {
    return NextResponse.json({ error: "Falta el contenido del archivo." }, { status: 400 });
  }
  if (body.csvText.length > MAX_FILE_CHARS) {
    return NextResponse.json(
      { error: "El archivo es demasiado grande. Intenta con un rango de fechas más corto." },
      { status: 400 },
    );
  }

  const rawParsed = Papa.parse<string[]>(body.csvText, { skipEmptyLines: true });
  const rawRows = rawParsed.data;
  if (rawRows.length === 0) {
    return NextResponse.json({ error: "El archivo está vacío." }, { status: 400 });
  }

  const headerRowIndex = detectHeaderRowIndex(rawRows);
  const { headers, records } = rowsToRecords(rawRows, headerRowIndex);

  if (headers.length === 0 || records.length === 0) {
    return NextResponse.json(
      { error: "El archivo está vacío o no se pudo leer como CSV." },
      { status: 400 },
    );
  }
  if (records.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `El archivo tiene demasiadas filas (máximo ${MAX_ROWS}).` },
      { status: 400 },
    );
  }

  const detected = detectColumns(headers);
  const mapping = body.mapping ?? detected.mapping;
  const defaultUnit = body.defaultUnit ?? "MGDL";

  const { validRows, errors, internalDuplicateCount } = normalizeRows(
    records,
    mapping,
    defaultUnit,
  );

  let newCount = validRows.length;
  let duplicateCount = 0;
  let dateRangeStart: Date | null = null;
  let dateRangeEnd: Date | null = null;

  if (validRows.length > 0) {
    const timestamps = validRows.map((r) => r.timestamp.getTime());
    dateRangeStart = new Date(Math.min(...timestamps));
    dateRangeEnd = new Date(Math.max(...timestamps));

    const existing = await prisma.glucoseReading.findMany({
      where: { userId: session.userId, timestamp: { gte: dateRangeStart, lte: dateRangeEnd } },
      select: { timestamp: true, glucoseValue: true, unit: true },
    });
    const { newRows, duplicates } = splitNewAndDuplicates(
      validRows,
      existing.map((e) => ({ timestamp: e.timestamp, glucoseValue: e.glucoseValue, unit: e.unit })),
    );
    newCount = newRows.length;
    duplicateCount = duplicates.length;
  }

  const { meals, insulin } = normalizeMealsAndInsulin(records, mapping);

  const insulinRegimens = await prisma.insulinRegimen.findMany({
    where: { userId: session.userId, isActive: true },
    select: { id: true, insulinName: true, insulinType: true, usage: true },
  });

  return NextResponse.json({
    headers,
    detectedMapping: detected.mapping,
    confidence: detected.confidence,
    mappingUsed: mapping,
    totalRows: records.length,
    validRowCount: validRows.length,
    errorRowCount: errors.length,
    internalDuplicateCount,
    newCount,
    duplicateCount: duplicateCount + internalDuplicateCount,
    dateRangeStart,
    dateRangeEnd,
    sample: validRows.slice(0, SAMPLE_SIZE).map((r) => ({
      timestamp: r.timestamp,
      glucoseValue: r.glucoseValue,
      unit: r.unit,
    })),
    errors: errors.slice(0, MAX_ERROR_ROWS_RETURNED),
    errorsTruncated: errors.length > MAX_ERROR_ROWS_RETURNED,
    mealCount: meals.length,
    rapidInsulinCount: insulin.filter((i) => i.kind === "RAPID").length,
    longActingInsulinCount: insulin.filter((i) => i.kind === "LONG").length,
    insulinRegimens,
  });
}
