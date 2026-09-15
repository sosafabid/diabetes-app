// ============================================================================
// SafetyEngine
// ============================================================================
// PRINCIPIO NO NEGOCIABLE (sección 20 del spec):
// SafetyEngine tiene PRIORIDAD sobre DoseCalculationEngine.
// Si este motor determina blocksCalculation = true, el sistema NO debe
// mostrar ninguna dosis calculada, sin excepción.
//
// Este motor es 100% determinista y basado en reglas explícitas. No usa IA.
// Cada regla debe ser explicable y trazable en el mensaje que recibe el
// paciente.
//
// TODO — Clinical validation required:
//   Los umbrales exactos (p.ej. qué se considera "glucosa baja") deben ser
//   confirmados/ajustados por un profesional de salud antes de producción.
//   Los valores por defecto aquí son conservadores y sirven solo de esqueleto.
// ============================================================================

import type {
  DoseCalculationInput,
  SafetyCheckResult,
  SafetyRuleResult,
} from "./types";

// Umbrales por defecto en mg/dL — TODO: clínicamente validar / hacer configurables por paciente.
const DEFAULT_LOW_GLUCOSE_THRESHOLD_MGDL = 70;
const DEFAULT_VERY_LOW_GLUCOSE_THRESHOLD_MGDL = 54;
const DEFAULT_VERY_HIGH_GLUCOSE_THRESHOLD_MGDL = 300;
const RECENT_INSULIN_WINDOW_MINUTES = 60; // ventana para "dosis reciente desconocida/duplicada"

export class SafetyEngine {
  /**
   * Ejecuta TODAS las reglas de seguridad sobre el input.
   * Debe llamarse SIEMPRE antes de invocar DoseCalculationEngine.
   */
  check(input: DoseCalculationInput): SafetyCheckResult {
    const rules: SafetyRuleResult[] = [
      this.checkLowGlucose(input),
      this.checkMissingData(input),
      this.checkContradictoryData(input),
      this.checkRecentUnknownDose(input),
      this.checkExtremeValues(input),
      this.checkCgmDataIssue(input),
      this.checkRecentIntenseExercise(input),
      this.checkIllnessReported(input),
    ].filter((r) => r.triggered);

    const blocksCalculation = rules.some((r) => r.status === "BLOCKED");
    const status = blocksCalculation
      ? "BLOCKED"
      : rules.some((r) => r.status === "WARNING")
        ? "WARNING"
        : "OK";

    return { status, rulesTriggered: rules, blocksCalculation };
  }

  private checkLowGlucose(input: DoseCalculationInput): SafetyRuleResult {
    const mgdl = toMgdl(input.glucose.value, input.glucose.unit);
    if (mgdl < DEFAULT_VERY_LOW_GLUCOSE_THRESHOLD_MGDL) {
      return {
        ruleId: "LOW_GLUCOSE_SEVERE",
        triggered: true,
        status: "BLOCKED",
        messageEs:
          "Tu glucosa está muy baja. Sigue el plan de tratamiento de hipoglucemia indicado por tu profesional de salud antes de continuar.",
        recommendContactProfessional: true,
        emergencyInstructionsEs:
          "Si tienes síntomas graves o no puedes tratar la hipoglucemia por tu cuenta, busca atención médica de inmediato.",
      };
    }
    if (mgdl < DEFAULT_LOW_GLUCOSE_THRESHOLD_MGDL) {
      return {
        ruleId: "LOW_GLUCOSE",
        triggered: true,
        status: "BLOCKED",
        messageEs:
          "Tu glucosa está baja. No se mostrará un cálculo de dosis hasta que confirmes que la has tratado según tu plan.",
      };
    }
    return notTriggered("LOW_GLUCOSE");
  }

  private checkMissingData(input: DoseCalculationInput): SafetyRuleResult {
    const missing: string[] = [];
    if (!input.glucose) missing.push("glucosa");
    if (
      input.meal &&
      input.meal.carbsG > 0 &&
      !input.mealRegimenParameters?.carbRatio
    ) {
      missing.push("relación insulina/carbohidratos");
    }
    if (missing.length > 0) {
      return {
        ruleId: "MISSING_DATA",
        triggered: true,
        status: "BLOCKED",
        messageEs: `Falta información necesaria para calcular una dosis de forma segura: ${missing.join(", ")}. Consulta con tu profesional de salud.`,
      };
    }
    return notTriggered("MISSING_DATA");
  }

  private checkContradictoryData(input: DoseCalculationInput): SafetyRuleResult {
    if (
      input.meal?.carbsG !== undefined &&
      input.meal.carbsG > 0 &&
      input.meal.carbsConfirmedByUser === false
    ) {
      return {
        ruleId: "UNCONFIRMED_CARB_ESTIMATE",
        triggered: true,
        status: "BLOCKED",
        messageEs:
          "La estimación de carbohidratos de la foto aún no ha sido confirmada. Revisa y confirma los carbohidratos antes de continuar.",
      };
    }
    return notTriggered("CONTRADICTORY_DATA");
  }

  private checkRecentUnknownDose(input: DoseCalculationInput): SafetyRuleResult {
    const now = new Date(input.glucose.timestamp).getTime();
    const recentSameType = input.recentInsulinEvents.find((e) => {
      const minutesAgo = (now - new Date(e.timestamp).getTime()) / 60000;
      return minutesAgo >= 0 && minutesAgo <= RECENT_INSULIN_WINDOW_MINUTES;
    });
    if (recentSameType) {
      return {
        ruleId: "RECENT_INSULIN_DOSE",
        triggered: true,
        status: "WARNING",
        messageEs: `Ya registraste una dosis de insulina hace menos de ${RECENT_INSULIN_WINDOW_MINUTES} minutos. Verifica antes de aplicar otra dosis para evitar duplicarla.`,
        recommendContactProfessional: false,
      };
    }
    return notTriggered("RECENT_INSULIN_DOSE");
  }

  private checkExtremeValues(input: DoseCalculationInput): SafetyRuleResult {
    const mgdl = toMgdl(input.glucose.value, input.glucose.unit);
    if (mgdl >= DEFAULT_VERY_HIGH_GLUCOSE_THRESHOLD_MGDL) {
      return {
        ruleId: "VERY_HIGH_GLUCOSE",
        triggered: true,
        status: "WARNING",
        messageEs:
          "Tu glucosa está muy alta. Sigue las indicaciones de tu profesional de salud para estos casos y considera contactarlo si esto persiste.",
        recommendContactProfessional: true,
      };
    }
    return notTriggered("VERY_HIGH_GLUCOSE");
  }

  private checkCgmDataIssue(input: DoseCalculationInput): SafetyRuleResult {
    if (
      input.glucose.source === "CGM" &&
      input.glucose.trend === undefined
    ) {
      return {
        ruleId: "CGM_MISSING_TREND",
        triggered: true,
        status: "WARNING",
        messageEs:
          "No se recibió información de tendencia de tu CGM. Considera confirmar tu glucosa con una medición de sangre capilar si tienes dudas.",
      };
    }
    return notTriggered("CGM_DATA_ISSUE");
  }

  private checkRecentIntenseExercise(input: DoseCalculationInput): SafetyRuleResult {
    const ex = input.exerciseContext?.recentExercise;
    if (ex && ex.intensity === "INTENSE" && ex.minutesAgo <= 120) {
      return {
        ruleId: "RECENT_INTENSE_EXERCISE",
        triggered: true,
        status: "WARNING",
        messageEs:
          "Registraste actividad física intensa recientemente, lo cual puede afectar tu glucosa en las próximas horas. Ten esto en cuenta y sigue tu plan de seguimiento.",
      };
    }
    return notTriggered("RECENT_INTENSE_EXERCISE");
  }

  private checkIllnessReported(input: DoseCalculationInput): SafetyRuleResult {
    if (input.recoveryContext?.illnessReported) {
      return {
        ruleId: "ILLNESS_REPORTED",
        triggered: true,
        status: "WARNING",
        messageEs:
          "Reportaste sentirte enfermo/a. La enfermedad puede afectar tus niveles de glucosa; sigue el plan indicado por tu profesional de salud para días de enfermedad.",
        recommendContactProfessional: true,
      };
    }
    return notTriggered("ILLNESS_REPORTED");
  }
}

function notTriggered(ruleId: string): SafetyRuleResult {
  return { ruleId, triggered: false, status: "OK", messageEs: "" };
}

function toMgdl(value: number, unit: "MGDL" | "MMOLL"): number {
  return unit === "MMOLL" ? value * 18.0182 : value;
}
