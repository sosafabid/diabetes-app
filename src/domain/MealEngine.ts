// ============================================================================
// MealEngine
// ============================================================================
// Normaliza los 3 métodos de registro de comida (sección 11) en un único
// MealInput consumible por DoseCalculationEngine.
//
// Método A — carbohidratos directos.
// Método B — construida a partir de FoodItem[] (alimentos regionales).
// Método C — foto + estimación de IA: la estimación NUNCA se considera un
//   dato válido hasta que el usuario la confirme o edite explícitamente.
//   Ver InsulinActivityEngine.ts y SafetyEngine.checkContradictoryData()
//   para el bloqueo correspondiente si no está confirmada.
// ============================================================================

import type { MealInput } from "./types";

export interface FoodItemQuantity {
  carbsGPerPortion: number;
  quantity: number; // en múltiplos de la porción del FoodItem
}

export class MealEngine {
  /** Método A: carbohidratos introducidos directamente por el paciente. */
  fromDirectCarbs(carbsG: number): MealInput {
    return { carbsG, carbsConfirmedByUser: true };
  }

  /** Método B: comida construida a partir de alimentos del catálogo. */
  fromFoodItems(items: FoodItemQuantity[]): MealInput {
    const carbsG = items.reduce(
      (sum, item) => sum + item.carbsGPerPortion * item.quantity,
      0,
    );
    return { carbsG: Math.round(carbsG * 10) / 10, carbsConfirmedByUser: true };
  }

  /**
   * Método C: estimación de IA por foto. `confirmed` debe ser true solo si
   * el usuario explícitamente confirmó/editó el valor mostrado.
   */
  fromPhotoEstimate(estimatedCarbsG: number, confirmed: boolean): MealInput {
    return { carbsG: estimatedCarbsG, carbsConfirmedByUser: confirmed };
  }
}
