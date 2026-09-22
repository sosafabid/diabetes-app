// ============================================================================
// GenericCSVImporter — capa de dominio, sin Prisma ni Next.js, 100% testable.
// ============================================================================
// FASE 1 del sistema de importación (ver spec). Responsabilidad: dado un CSV
// ya parseado a filas de objetos (header → valor), detectar qué columnas
// probablemente son fecha/hora/glucosa/unidad, y normalizar cada fila a un
// formato consistente — SIN escribir nada en la base de datos (eso vive en
// la API route, que además necesita consultar duplicados existentes).
//
// REGLAS NO NEGOCIABLES (igual que el resto de la app):
//   - Nunca inventar valores para "reparar" una fila con error — se omite y
//     se reporta por qué.
//   - Nunca interpolar, suavizar ni corregir el valor original.
//   - Nunca asumir la fuente (sangre/CGM) si no se puede determinar — la
//     fuente de un lote SIEMPRE la confirma el paciente antes de importar
//     (ver Fase 2/3 del spec); este motor nunca la adivina silenciosamente.
// ============================================================================

export type GlucoseUnitCode = "MGDL" | "MMOLL";

export interface ColumnMapping {
  /** Columna con fecha+hora juntas (timestamp/datetime), si existe. */
  datetimeColumn?: string;
  /** Columna con solo la fecha, si fecha y hora vienen separadas. */
  dateColumn?: string;
  /** Columna con solo la hora, si fecha y hora vienen separadas. */
  timeColumn?: string;
  glucoseColumn?: string;
  /** Columna alterna de glucosa — algunos exportadores (p. ej. FreeStyle
   * Libre) parten el valor en dos columnas según el tipo de registro
   * ("Historial de glucosa" vs. "Escaneo de glucosa"), y cada fila solo
   * trae UNA de las dos llena. Si la principal viene vacía, se prueba
   * esta. */
  glucoseColumnFallback?: string;
  /** Columna que indica la unidad por fila, si el archivo la trae. */
  unitColumn?: string;
}

export interface DetectedColumns {
  mapping: ColumnMapping;
  headers: string[];
  /** "auto": se detectaron fecha/hora Y glucosa — probablemente lista para
   * usar. "partial": se detectó algo pero falta confirmar. "none": no se
   * detectó nada confiable, el paciente tiene que mapear todo a mano. */
  confidence: "auto" | "partial" | "none";
}

export interface ParsedGlucoseRow {
  /** 1-based, contando la fila de encabezado como 1 — para que el mensaje
   * de error coincida con lo que el paciente ve si abre el CSV. */
  rowIndex: number;
  timestamp: Date;
  glucoseValue: number;
  unit: GlucoseUnitCode;
}

export interface RowError {
  rowIndex: number;
  reasonEs: string;
}

export interface NormalizeResult {
  validRows: ParsedGlucoseRow[];
  errors: RowError[];
  /** Duplicados DENTRO del mismo archivo (dos filas idénticas) — distinto
   * de los duplicados contra lo que ya está en la base de datos. */
  internalDuplicateCount: number;
}

export interface ExistingReadingKey {
  timestamp: Date;
  glucoseValue: number;
  unit: GlucoseUnitCode;
}

const DATETIME_HINTS = [
  "timestamp",
  "datetime",
  "device timestamp",
  "sello de tiempo del dispositivo", // FreeStyle Libre
  "fecha y hora",
  "fecha/hora",
];
const DATE_HINTS = ["date", "fecha"];
const TIME_HINTS = ["time", "hora"];
// Columna PRINCIPAL de glucosa — orden importa: las más específicas primero.
const GLUCOSE_HINTS = [
  "historial de glucosa", // FreeStyle Libre — lecturas automáticas del sensor
  "glucose value",
  "glucose_value",
  "historic glucose",
  "scan glucose",
  "glucose",
  "glucosa",
  "value",
  "valor",
  "mg/dl",
  "mmol/l",
];
// Columna ALTERNA — exportadores como Libre parten el valor en dos columnas
// según el tipo de registro (automático vs. escaneo manual), y cada fila
// solo trae UNA llena.
const GLUCOSE_FALLBACK_HINTS = [
  "escaneo de glucosa", // FreeStyle Libre — escaneo manual
  "glucosa del escáner",
  "scan glucose",
];
const UNIT_HINTS = ["unit", "unidad"];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function findColumn(
  headers: string[],
  normalized: string[],
  hints: string[],
  allowPartial = true,
): string | undefined {
  for (const hint of hints) {
    const exact = normalized.findIndex((h) => h === hint);
    if (exact !== -1) return headers[exact];
  }
  if (!allowPartial) return undefined;
  for (const hint of hints) {
    const partial = normalized.findIndex((h) => h.includes(hint));
    if (partial !== -1) return headers[partial];
  }
  return undefined;
}

/** Intenta adivinar qué columnas son cuáles, tolerando mayúsculas/espacios.
 * Nunca asume — solo sugiere; el paciente siempre confirma en la UI. */
export function detectColumns(headers: string[]): DetectedColumns {
  const normalized = headers.map(normalizeHeader);

  const datetimeColumn = findColumn(headers, normalized, DATETIME_HINTS);
  const dateColumn = datetimeColumn ? undefined : findColumn(headers, normalized, DATE_HINTS);
  const timeColumn = datetimeColumn ? undefined : findColumn(headers, normalized, TIME_HINTS);
  const glucoseColumn = findColumn(headers, normalized, GLUCOSE_HINTS);
  const unitColumn = findColumn(headers, normalized, UNIT_HINTS, false);

  let glucoseColumnFallback: string | undefined;
  if (glucoseColumn) {
    const remainingHeaders = headers.filter((h) => h !== glucoseColumn);
    const remainingNormalized = remainingHeaders.map(normalizeHeader);
    glucoseColumnFallback = findColumn(remainingHeaders, remainingNormalized, GLUCOSE_FALLBACK_HINTS);
  }

  const mapping: ColumnMapping = {
    datetimeColumn,
    dateColumn,
    timeColumn,
    glucoseColumn,
    glucoseColumnFallback,
    unitColumn,
  };
  const hasTimestamp = Boolean(datetimeColumn || dateColumn);
  const confidence: DetectedColumns["confidence"] =
    hasTimestamp && glucoseColumn ? "auto" : hasTimestamp || glucoseColumn ? "partial" : "none";

  return { mapping, headers, confidence };
}

function tryParseDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct;

  // DD/MM/YYYY o DD-MM-YYYY [HH:mm[:ss]] — formatos comunes en exports
  // latinoamericanos y de dispositivos (FreeStyle Libre usa guiones), que
  // Date() nativo interpreta mal o rechaza.
  const m = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (m) {
    const [, d, mo, y, h = "0", mi = "0", s = "0"] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function tryParseTimeOnto(datePart: Date, timeRaw: string): Date {
  const trimmed = timeRaw.trim();
  const m = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return datePart;
  const [, hRaw, mi, s = "0", ampm] = m;
  let hour = Number(hRaw);
  if (ampm) {
    const lower = ampm.toLowerCase();
    if (lower === "pm" && hour < 12) hour += 12;
    if (lower === "am" && hour === 12) hour = 0;
  }
  const result = new Date(datePart);
  result.setHours(hour, Number(mi), Number(s), 0);
  return result;
}

function tryParseGlucose(raw: string): number | null {
  const cleaned = raw.trim().replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

/** Convierte las filas crudas del CSV (ya parseadas a objetos header→valor)
 * en lecturas normalizadas. NO consulta la base de datos — la
 * deduplicación contra lo que ya existe se hace aparte, con
 * `splitNewAndDuplicates`. */
export function normalizeRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  defaultUnit: GlucoseUnitCode,
): NormalizeResult {
  const validRows: ParsedGlucoseRow[] = [];
  const errors: RowError[] = [];
  const seenKeys = new Set<string>();
  let internalDuplicateCount = 0;

  rows.forEach((row, i) => {
    const rowIndex = i + 2; // +1 por el encabezado, +1 porque es 1-based

    let timestamp: Date | null = null;
    if (mapping.datetimeColumn) {
      timestamp = tryParseDate(row[mapping.datetimeColumn] ?? "");
    } else if (mapping.dateColumn) {
      const datePart = tryParseDate(row[mapping.dateColumn] ?? "");
      if (datePart) {
        timestamp = mapping.timeColumn
          ? tryParseTimeOnto(datePart, row[mapping.timeColumn] ?? "")
          : datePart;
      }
    }
    if (!timestamp) {
      errors.push({ rowIndex, reasonEs: "Fecha/hora inválida o vacía" });
      return;
    }

    const glucoseRaw = mapping.glucoseColumn ? row[mapping.glucoseColumn] : undefined;
    let glucoseValue = glucoseRaw != null ? tryParseGlucose(glucoseRaw) : null;
    if (glucoseValue == null && mapping.glucoseColumnFallback) {
      const fallbackRaw = row[mapping.glucoseColumnFallback];
      glucoseValue = fallbackRaw != null ? tryParseGlucose(fallbackRaw) : null;
    }
    if (glucoseValue == null) {
      errors.push({ rowIndex, reasonEs: "Valor de glucosa vacío o no numérico" });
      return;
    }

    let unit: GlucoseUnitCode = defaultUnit;
    if (mapping.unitColumn) {
      const rawUnit = (row[mapping.unitColumn] ?? "").toLowerCase();
      if (rawUnit.includes("mmol")) unit = "MMOLL";
      else if (rawUnit.includes("mg")) unit = "MGDL";
    }

    const key = `${timestamp.getTime()}_${glucoseValue}_${unit}`;
    if (seenKeys.has(key)) {
      internalDuplicateCount++;
      return;
    }
    seenKeys.add(key);

    validRows.push({ rowIndex, timestamp, glucoseValue, unit });
  });

  return { validRows, errors, internalDuplicateCount };
}

/** Separa lo ya parseado en "nuevo" vs. "ya existe en la base de datos",
 * usando timestamp+valor+unidad como llave. `existing` viene de una
 * consulta a Prisma hecha en la API route — esta función en sí no toca
 * la base de datos, por eso es testable sin mock de DB. */
export function splitNewAndDuplicates(
  parsedRows: ParsedGlucoseRow[],
  existing: ExistingReadingKey[],
): { newRows: ParsedGlucoseRow[]; duplicates: ParsedGlucoseRow[] } {
  const existingKeys = new Set(
    existing.map((e) => `${e.timestamp.getTime()}_${e.glucoseValue}_${e.unit}`),
  );
  const newRows: ParsedGlucoseRow[] = [];
  const duplicates: ParsedGlucoseRow[] = [];
  for (const row of parsedRows) {
    const key = `${row.timestamp.getTime()}_${row.glucoseValue}_${row.unit}`;
    if (existingKeys.has(key)) duplicates.push(row);
    else newRows.push(row);
  }
  return { newRows, duplicates };
}

// ============================================================================
// Detección de la fila de encabezado real.
// ============================================================================
// Muchos exportadores (FreeStyle Libre entre ellos) ponen una línea de
// METADATOS antes del encabezado real — p. ej.:
//   "Datos de glucosa,Generado el,22-09-2026 03:04 UTC,Generado por,María"
//   "Dispositivo,Número de serie,Sello de tiempo,...(20 columnas reales)"
// Asumir que la fila 1 siempre es el encabezado rompía con archivos así.
// Heurística: de las primeras filas, la que tiene MÁS columnas con
// contenido es casi siempre el encabezado real (la fila de metadatos trae
// muchas menos columnas que la tabla de datos real).
// ============================================================================

/** Recibe filas ya separadas en columnas (típicamente de Papa.parse sin
 * header) y devuelve el índice de la fila que más probablemente sea el
 * encabezado real. */
export function detectHeaderRowIndex(rawRows: string[][], maxRowsToScan = 10): number {
  let bestIndex = 0;
  let bestCount = -1;
  const limit = Math.min(maxRowsToScan, rawRows.length);
  for (let i = 0; i < limit; i++) {
    const nonEmptyCount = rawRows[i].filter((cell) => cell.trim() !== "").length;
    if (nonEmptyCount > bestCount) {
      bestCount = nonEmptyCount;
      bestIndex = i;
    }
  }
  return bestIndex;
}

/** Convierte filas crudas (arrays de celdas) en objetos header→valor,
 * usando la fila `headerRowIndex` como encabezado y descartando todo lo
 * anterior (metadatos) y las filas totalmente vacías. */
export function rowsToRecords(
  rawRows: string[][],
  headerRowIndex: number,
): { headers: string[]; records: Record<string, string>[] } {
  const headers = (rawRows[headerRowIndex] ?? []).map((h) => h.trim());
  const records = rawRows
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = (row[i] ?? "").trim();
      });
      return obj;
    });
  return { headers, records };
}

