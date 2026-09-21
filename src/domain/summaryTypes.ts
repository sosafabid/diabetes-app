// ============================================================================
// Tipos del SummaryEngine — desacoplados de Prisma, igual que el resto de la
// capa de dominio. La página /resumen mapea los resultados de Prisma a estos
// tipos simplificados antes de pasarlos al motor.
// ============================================================================

export type PeriodType = "day" | "7d" | "14d" | "30d" | "month" | "custom";

export interface Period {
  type: PeriodType;
  start: Date;
  end: Date;
}

export interface GlucoseReadingInput {
  timestamp: Date;
  value: number;
  unit: "MGDL" | "MMOLL";
  source: "BLOOD" | "CGM";
}

export interface InsulinEventInput {
  timestamp: Date;
  dose: number;
  insulinName: string;
  purpose: "MEAL" | "CORRECTION" | "BASAL" | "OTHER";
}

export interface MealInput {
  timestamp: Date;
  mealType: string;
  carbsG: number | null;
}

export interface ExerciseEventInput {
  timestamp: Date;
  type: string;
  duration: number;
}

export interface HypoglycemiaEventInput {
  createdAt: Date;
  status: "PENDING" | "TREATED" | "SEVERE" | "RESOLVED";
  carbsConsumedG: number | null;
  /** Cuándo se registró el tratamiento estándar (flujo carbohidratos), si aplica. */
  treatedAt?: Date | null;
  /** Cuándo se marcó el escenario severo, si aplica. */
  severeMarkedAt?: Date | null;
}

export interface SummaryEngineInput {
  period: Period;
  glucoseReadings: GlucoseReadingInput[];
  insulinEvents: InsulinEventInput[];
  meals: MealInput[];
  exerciseEvents: ExerciseEventInput[];
  hypoglycemiaEvents: HypoglycemiaEventInput[];
  /** Umbral de glucosa baja del plan del paciente, en mg/dL. Si no hay plan configurado, se usa un valor por defecto conservador (ver SummaryEngine). */
  lowThresholdMgdl?: number;
  /** TODO — Clinical validation required: no hay ningún umbral "alto" configurado por el paciente todavía; este valor es un placeholder editable. */
  highThresholdMgdl?: number;
}

export interface GlucoseSourceStats {
  count: number;
  average: number | null;
  min: number | null;
  max: number | null;
  lowCount: number;
  highCount: number;
  /** Coeficiente de variación (%) — desviación estándar / promedio × 100. */
  variabilityPercentCV: number | null;
}

export interface GlucoseSummary {
  combined: GlucoseSourceStats;
  bySource: {
    BLOOD: GlucoseSourceStats;
    CGM: GlucoseSourceStats;
  };
  /** Glucose Management Indicator — A1C estimado a partir del promedio de
   * glucosa (fórmula de Bergenstal et al. 2018). Es un ESTIMADO, no
   * reemplaza un A1C de laboratorio; más preciso con 14+ días de datos. */
  gmiPercent: number | null;
}

export interface InsulinSummary {
  totalUnits: number;
  byInsulinName: Record<string, number>;
  byPurpose: Record<string, number>;
}

export interface MealSummary {
  count: number;
  totalCarbsG: number;
  averageCarbsG: number | null;
  byMealType: Record<string, number>;
  mealsWithoutCarbsRecorded: number;
}

export interface ActivitySummary {
  sessionCount: number;
  totalMinutes: number;
  byType: Record<string, number>;
}

export interface HypoglycemiaSummary {
  episodeCount: number;
  treatedCount: number;
  severeCount: number;
  averageCarbsConsumedG: number | null;
  /** Minutos promedio entre detectarse la baja y quedar tratada/marcada
   * severa (solo cuenta episodios que ya tienen ese momento registrado). */
  averageDurationMinutes: number | null;
}

export interface MissingDataNote {
  messageEs: string;
}

export interface SummaryResult {
  period: Period;
  glucose: GlucoseSummary;
  insulin: InsulinSummary;
  meals: MealSummary;
  activity: ActivitySummary;
  hypoglycemia: HypoglycemiaSummary;
  missingDataNotes: MissingDataNote[];
}
