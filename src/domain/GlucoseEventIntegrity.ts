// ============================================================================
// GlucoseEventIntegrity — regla: una misma GlucoseReading NUNCA puede ser al
// mismo tiempo la lectura INICIAL de un GlucoseEvent y una MEDICIÓN DE
// SEGUIMIENTO de otro (o del mismo) evento.
//
// Postgres/Prisma no puede expresar esto como un constraint nativo de base
// de datos porque son dos tablas distintas (GlucoseEvent e
// EventMeasurement) — un @@unique de Prisma solo aplica dentro de una
// tabla. La alternativa real de "constraint de base de datos" sería un
// trigger de Postgres a mano; no está implementado en esta fase porque el
// resto del proyecto no usa triggers en ningún lado (todo se valida en
// código de aplicación, de forma consistente con el resto del código).
//
// Esta función es la pieza reutilizable: la usa el script de migración
// ahora, y la deben reutilizar las futuras rutas de API (Fase 2) antes de
// crear cualquier EventMeasurement o GlucoseEvent nuevo.
// ============================================================================

export type ReadingConflictReason = "ALREADY_INITIAL" | "ALREADY_MEASUREMENT";

/**
 * `usedAsInitial` y `usedAsMeasurement` son los IDs de GlucoseReading ya
 * comprometidos en cada rol — típicamente obtenidos con dos consultas
 * simples a Prisma (SELECT initialGlucoseReadingId FROM GlucoseEvent /
 * SELECT glucoseReadingId FROM EventMeasurement) antes de llamar aquí.
 */
export function readingConflict(
  readingId: string,
  usedAsInitial: Set<string>,
  usedAsMeasurement: Set<string>,
): ReadingConflictReason | null {
  if (usedAsInitial.has(readingId)) return "ALREADY_INITIAL";
  if (usedAsMeasurement.has(readingId)) return "ALREADY_MEASUREMENT";
  return null;
}
