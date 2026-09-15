// ============================================================================
// TIPOS COMPARTIDOS — Capa de dominio
// ============================================================================
// Estos tipos son el "contrato" entre UI, motores de dominio y datos.
// No deben depender de Prisma ni de detalles de infraestructura, para que
// los motores clínicos (DoseCalculationEngine, SafetyEngine, etc.) se puedan
// probar de forma aislada y, eventualmente, validar clínicamente sin
// arrastrar dependencias de base de datos o UI.
// ============================================================================

export type GlucoseUnit = "MGDL" | "MMOLL";

export type MeasurementSource = "BLOOD" | "CGM";

export type CgmTrend =
  | "STABLE"
  | "RISING"
  | "RISING_FAST"
  | "FALLING"
  | "FALLING_FAST";

export interface GlucoseInput {
  value: number;
  unit: GlucoseUnit;
  source: MeasurementSource;
  trend?: CgmTrend;
  timestamp: string; // ISO 8601
}

export interface RegimenParameters {
  /** Versión vigente de los parámetros clínicos del paciente en el momento del cálculo. */
  regimenVersionId: string;
  carbRatio?: number; // g de carbohidratos por unidad de insulina
  correctionFactor?: number; // cuánto baja 1 U la glucosa (en la unidad del paciente)
  targetGlucoseLow?: number;
  targetGlucoseHigh?: number;
  insulinName: string;
  insulinType: string;
}

export interface RecentInsulinEvent {
  timestamp: string;
  dose: number;
  purpose: "MEAL" | "CORRECTION" | "BASAL" | "OTHER";
  insulinName: string;
}

export interface ExerciseContext {
  recentExercise?: {
    type: string;
    intensity: "LIGHT" | "MODERATE" | "INTENSE";
    minutesAgo: number;
  };
}

export interface RecoveryContext {
  reportedStress?: "LOW" | "MODERATE" | "HIGH";
  illnessReported?: boolean;
  sleepHours?: number;
}

export interface MealInput {
  carbsG: number;
  /** true solo si el usuario confirmó/editó una estimación de IA por foto */
  carbsConfirmedByUser: boolean;
}

/**
 * Entrada completa que recibe el DoseCalculationEngine.
 * Todo lo que NO sea "carbohidratos" o "glucosa actual" debe venir del
 * perfil de tratamiento del paciente (RegimenParameters) — nunca inventado.
 */
export interface DoseCalculationInput {
  userId: string;
  glucose: GlucoseInput;
  meal?: MealInput;
  mealRegimenParameters?: RegimenParameters; // insulina de comidas
  correctionRegimenParameters?: RegimenParameters; // insulina de corrección
  recentInsulinEvents: RecentInsulinEvent[];
  exerciseContext?: ExerciseContext;
  recoveryContext?: RecoveryContext;
}

export type SafetyStatus = "OK" | "WARNING" | "BLOCKED";

export interface SafetyRuleResult {
  ruleId: string;
  triggered: boolean;
  status: SafetyStatus;
  messageEs: string; // mensaje en español, listo para mostrar al paciente
  recommendContactProfessional?: boolean;
  emergencyInstructionsEs?: string;
}

export interface SafetyCheckResult {
  status: SafetyStatus;
  rulesTriggered: SafetyRuleResult[];
  /** Si es true, el DoseCalculationEngine NO debe producir/mostrar una dosis. */
  blocksCalculation: boolean;
}

export interface DoseCalculationBreakdownStep {
  labelEs: string; // p.ej. "Dosis por carbohidratos"
  formula: string; // p.ej. "45 g ÷ 10 g/U"
  value: number;
}

export interface DoseCalculationResult {
  algorithmVersion: string;
  timestamp: string;
  safetyStatus: SafetyStatus;
  /** null si SafetyEngine bloqueó el cálculo */
  totalDose: number | null;
  doseUnit: string;
  breakdown: DoseCalculationBreakdownStep[];
  warningsEs: string[];
  safetyRulesTriggered: SafetyRuleResult[];
  /** Snapshot completo para auditoría — se persiste tal cual en DoseCalculation. */
  auditSnapshot: {
    inputValues: unknown;
    inputSources: unknown;
    parametersUsed: unknown;
  };
}
