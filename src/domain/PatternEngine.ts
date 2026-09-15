// ============================================================================
// PatternEngine
// ============================================================================
// Detecta asociaciones/patrones en los datos del paciente (sección 23).
//
// REGLA DURA: este motor NUNCA debe recomendar cambios de tratamiento
// ("aumenta tu insulina", etc.). Solo puede describir observaciones neutras
// que el paciente pueda comentar con su profesional de salud.
//
// El MVP incluye una implementación mínima (detección de comidas repetidas
// con respuesta glucémica alta). El resto queda como TODO explícito para no
// improvisar heurísticas clínicas no validadas.
// ============================================================================

export interface GlucoseAfterMealSample {
  mealLabel: string; // p.ej. nombre de HabitualMeal o descripción de Meal
  mealTimestamp: string;
  postMealGlucoseMgdl: number;
}

export interface PatternObservation {
  observationEs: string;
  supportingSampleCount: number;
}

const POST_MEAL_HIGH_THRESHOLD_MGDL = 180; // TODO: validar clínicamente / hacer configurable
const MIN_SAMPLES_FOR_OBSERVATION = 3;

export class PatternEngine {
  /**
   * Implementación mínima del MVP: agrupa muestras post-comida por
   * mealLabel y señala, en lenguaje neutro, cuando varias superan el
   * umbral. No sugiere ninguna acción clínica.
   */
  detectRepeatedHighPostMeal(
    samples: GlucoseAfterMealSample[],
  ): PatternObservation[] {
    const byLabel = new Map<string, GlucoseAfterMealSample[]>();
    for (const s of samples) {
      const list = byLabel.get(s.mealLabel) ?? [];
      list.push(s);
      byLabel.set(s.mealLabel, list);
    }

    const observations: PatternObservation[] = [];
    for (const [label, list] of byLabel) {
      const highCount = list.filter(
        (s) => s.postMealGlucoseMgdl > POST_MEAL_HIGH_THRESHOLD_MGDL,
      ).length;
      if (highCount >= MIN_SAMPLES_FOR_OBSERVATION) {
        observations.push({
          observationEs: `Has registrado varias lecturas de glucosa más altas después de "${label}". Este patrón podría ser útil para comentar con tu profesional de salud.`,
          supportingSampleCount: highCount,
        });
      }
    }
    return observations;
  }

  // TODO — Clinical validation required:
  //   - Asociaciones con ejercicio, estrés, sueño.
  //   - Diferencias entre días de la semana / horarios.
  //   - Cualquier análisis estadístico más allá de conteos simples debe
  //     revisarse con un profesional de salud antes de mostrarse al paciente.
}
