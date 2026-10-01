import { readingConflict, type ReadingConflictReason } from "./GlucoseEventIntegrity";

// ============================================================================
// Planifica la migración de cada HypoglycemiaEvent existente hacia el nuevo
// GlucoseEvent unificado. 100% puro — no toca Prisma. El script que sí
// escribe en la base de datos (scripts/migrate-glucose-events.ts) llama a
// esta función con los datos ya leídos, y ejecuta el plan que devuelve.
// ============================================================================

export interface LegacyHypoglycemiaEvent {
  id: string;
  userId: string;
  glucoseReadingId: string;
  hypoglycemiaPlanId: string | null;
  status: "PENDING" | "TREATED" | "SEVERE" | "RESOLVED";
  treatedAt: Date | null;
  carbsConsumedG: number | null;
  productUsed: string | null;
  severeMarkedAt: Date | null;
  resolvedGlucoseReadingId: string | null;
  createdAt: Date;
}

export interface MigrationPlanItem {
  legacyId: string;
  glucoseEvent: {
    userId: string;
    type: "LOW";
    status: "OPEN" | "CLOSED";
    initialGlucoseReadingId: string;
    hypoglycemiaPlanId: string | null;
    startedAt: Date;
    endedAt: Date | null;
    migratedFromHypoglycemiaEventId: string;
  };
  intervention: {
    type: "CARBOHYDRATE";
    food: string | null;
    carbohydrateGrams: number;
    timestamp: Date;
  } | null;
  measurement: {
    glucoseReadingId: string;
  } | null;
}

export interface MigrationSkip {
  legacyId: string;
  reasonEs: string;
}

export interface MigrationPlan {
  toCreate: MigrationPlanItem[];
  alreadyMigrated: string[];
  skippedDueToConflict: MigrationSkip[];
}

export function planMigration(
  legacyEvents: LegacyHypoglycemiaEvent[],
  alreadyMigratedLegacyIds: Set<string>,
  usedAsInitial: Set<string>,
  usedAsMeasurement: Set<string>,
): MigrationPlan {
  const toCreate: MigrationPlanItem[] = [];
  const alreadyMigrated: string[] = [];
  const skippedDueToConflict: MigrationSkip[] = [];

  // Copias locales mutables — para detectar conflictos DENTRO del mismo
  // lote de migración también, no solo contra lo ya existente en la DB.
  const localUsedAsInitial = new Set(usedAsInitial);
  const localUsedAsMeasurement = new Set(usedAsMeasurement);

  const reasonEs = (reading: string, reason: ReadingConflictReason) =>
    reason === "ALREADY_INITIAL"
      ? `La lectura ${reading} ya es la inicial de otro evento.`
      : `La lectura ${reading} ya es una medición de seguimiento de otro evento.`;

  for (const legacy of legacyEvents) {
    if (alreadyMigratedLegacyIds.has(legacy.id)) {
      alreadyMigrated.push(legacy.id);
      continue;
    }

    const initialConflict = readingConflict(
      legacy.glucoseReadingId,
      localUsedAsInitial,
      localUsedAsMeasurement,
    );
    if (initialConflict) {
      skippedDueToConflict.push({
        legacyId: legacy.id,
        reasonEs: `Lectura inicial en conflicto — ${reasonEs(legacy.glucoseReadingId, initialConflict)} Evento omitido por completo.`,
      });
      continue;
    }
    localUsedAsInitial.add(legacy.glucoseReadingId);

    const status: "OPEN" | "CLOSED" = legacy.status === "PENDING" ? "OPEN" : "CLOSED";
    const endedAt = legacy.treatedAt ?? legacy.severeMarkedAt ?? null;

    let intervention: MigrationPlanItem["intervention"] = null;
    if (legacy.carbsConsumedG != null) {
      intervention = {
        type: "CARBOHYDRATE",
        food: legacy.productUsed,
        carbohydrateGrams: legacy.carbsConsumedG,
        timestamp: legacy.treatedAt ?? legacy.createdAt,
      };
    }

    let measurement: MigrationPlanItem["measurement"] = null;
    if (legacy.resolvedGlucoseReadingId) {
      const measurementConflict = readingConflict(
        legacy.resolvedGlucoseReadingId,
        localUsedAsInitial,
        localUsedAsMeasurement,
      );
      if (measurementConflict) {
        skippedDueToConflict.push({
          legacyId: legacy.id,
          reasonEs: `Medición de seguimiento en conflicto — ${reasonEs(legacy.resolvedGlucoseReadingId, measurementConflict)} Se migra el evento SIN esa medición.`,
        });
      } else {
        measurement = { glucoseReadingId: legacy.resolvedGlucoseReadingId };
        localUsedAsMeasurement.add(legacy.resolvedGlucoseReadingId);
      }
    }

    toCreate.push({
      legacyId: legacy.id,
      glucoseEvent: {
        userId: legacy.userId,
        type: "LOW",
        status,
        initialGlucoseReadingId: legacy.glucoseReadingId,
        hypoglycemiaPlanId: legacy.hypoglycemiaPlanId,
        startedAt: legacy.createdAt,
        endedAt,
        migratedFromHypoglycemiaEventId: legacy.id,
      },
      intervention,
      measurement,
    });
  }

  return { toCreate, alreadyMigrated, skippedDueToConflict };
}
