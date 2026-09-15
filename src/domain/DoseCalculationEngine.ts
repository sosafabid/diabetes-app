// ============================================================================
// DoseCalculationEngine
// ============================================================================
// Motor determinista + explicable + auditable (sección 18).
//
// REGLAS DURAS:
// - NUNCA se llama a este motor sin antes ejecutar SafetyEngine.check().
// - Si el SafetyEngine bloquea el cálculo, este motor devuelve totalDose=null
//   y NO produce una dosis, sin excepción.
// - Todos los parámetros clínicos (carbRatio, correctionFactor, target) deben
//   venir de RegimenParameters, provisto por el llamador desde el perfil de
//   tratamiento del paciente. Este motor NUNCA inventa ni asume un valor por
//   defecto para un parámetro clínico ausente.
// - No usa IA/LLM. 100% aritmético y trazable.
// ============================================================================

import { SafetyEngine } from "./SafetyEngine";
import type {
  DoseCalculationBreakdownStep,
  DoseCalculationInput,
  DoseCalculationResult,
} from "./types";

const ALGORITHM_VERSION = "0.1.0-mvp";

export class DoseCalculationEngine {
  constructor(private readonly safetyEngine: SafetyEngine = new SafetyEngine()) {}

  calculate(input: DoseCalculationInput): DoseCalculationResult {
    const timestamp = new Date().toISOString();
    const safety = this.safetyEngine.check(input);

    const auditSnapshot = {
      inputValues: input,
      inputSources: {
        glucoseSource: input.glucose.source,
      },
      parametersUsed: {
        mealRegimenVersionId: input.mealRegimenParameters?.regimenVersionId ?? null,
        correctionRegimenVersionId:
          input.correctionRegimenParameters?.regimenVersionId ?? null,
      },
    };

    if (safety.blocksCalculation) {
      return {
        algorithmVersion: ALGORITHM_VERSION,
        timestamp,
        safetyStatus: "BLOCKED",
        totalDose: null,
        doseUnit: "U",
        breakdown: [],
        warningsEs: safety.rulesTriggered.map((r) => r.messageEs),
        safetyRulesTriggered: safety.rulesTriggered,
        auditSnapshot,
      };
    }

    const breakdown: DoseCalculationBreakdownStep[] = [];
    let total = 0;

    // --- Dosis por carbohidratos (solo si hay comida Y parámetro carbRatio) ---
    if (
      input.meal &&
      input.meal.carbsG > 0 &&
      input.mealRegimenParameters?.carbRatio
    ) {
      const mealDose = input.meal.carbsG / input.mealRegimenParameters.carbRatio;
      breakdown.push({
        labelEs: "Dosis por carbohidratos",
        formula: `${input.meal.carbsG} g ÷ ${input.mealRegimenParameters.carbRatio} g/U`,
        value: mealDose,
      });
      total += mealDose;
    }

    // --- Dosis de corrección (solo si hay parámetros de corrección y objetivo) ---
    const corrParams = input.correctionRegimenParameters;
    if (
      corrParams?.correctionFactor &&
      corrParams.targetGlucoseHigh !== undefined
    ) {
      const glucoseMgdl =
        input.glucose.unit === "MMOLL"
          ? input.glucose.value * 18.0182
          : input.glucose.value;

      if (glucoseMgdl > corrParams.targetGlucoseHigh) {
        const correctionDose =
          (glucoseMgdl - corrParams.targetGlucoseHigh) /
          corrParams.correctionFactor;
        breakdown.push({
          labelEs: "Dosis de corrección",
          formula: `(${glucoseMgdl.toFixed(0)} - ${corrParams.targetGlucoseHigh}) ÷ ${corrParams.correctionFactor}`,
          value: correctionDose,
        });
        total += correctionDose;
      }
    }

    const roundedTotal = Math.round(total * 100) / 100;

    return {
      algorithmVersion: ALGORITHM_VERSION,
      timestamp,
      safetyStatus: safety.status, // "OK" o "WARNING" (nunca "BLOCKED" aquí)
      totalDose: roundedTotal,
      doseUnit: "U",
      breakdown,
      warningsEs: safety.rulesTriggered.map((r) => r.messageEs),
      safetyRulesTriggered: safety.rulesTriggered,
      auditSnapshot,
    };
  }
}
