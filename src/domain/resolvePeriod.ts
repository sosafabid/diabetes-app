// ============================================================================
// resolvePeriod — traduce la selección del usuario (7d/14d/30d/mes/personalizado)
// en fechas concretas de inicio y fin. Separado del SummaryEngine porque es
// lógica de calendario, no de estadística clínica.
// ============================================================================

import type { Period, PeriodType } from "./summaryTypes";

/**
 * Parsea una fecha "YYYY-MM-DD" como medianoche en la ZONA HORARIA LOCAL,
 * no en UTC. `new Date("2026-08-01")` se interpreta como UTC y por lo tanto
 * se corre un día hacia atrás en zonas horarias negativas (p.ej. Costa Rica,
 * UTC-6) — este parser evita ese bug.
 */
export function parseDateOnlyLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function resolvePeriod(
  type: PeriodType,
  now: Date = new Date(),
  customStart?: Date,
  customEnd?: Date,
): Period {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (type) {
    case "day": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { type, start, end };
    }
    case "7d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { type, start, end };
    }
    case "14d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 13);
      start.setHours(0, 0, 0, 0);
      return { type, start, end };
    }
    case "30d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { type, start, end };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { type, start, end: monthEnd };
    }
    case "custom": {
      if (!customStart || !customEnd) {
        throw new Error("Período personalizado requiere fecha de inicio y fin.");
      }
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const customEndAdjusted = new Date(customEnd);
      customEndAdjusted.setHours(23, 59, 59, 999);
      return { type, start, end: customEndAdjusted };
    }
  }
}