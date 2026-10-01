// ============================================================================
// CarbsRange — selección rápida de carbohidratos por rango.
//
// REGLA NO NEGOCIABLE: un rango JAMÁS se convierte en un número exacto. Si
// el paciente elige "31-45 g", se guarda el rango tal cual — nunca 38g
// como si fuera medido. Por eso resolveMealCarbsInput() nunca devuelve un
// carbsGDirect cuando el modo es "range".
//
// Los ejemplos de alimentos son ORIENTATIVOS, no equivalencias nutricionales
// exactas — el total real depende de la porción y la preparación. Nunca se
// asigna un valor fijo a un plato mixto (como "casado") sin considerar sus
// ingredientes.
// ============================================================================

export type CarbsRangeCode = "ZERO" | "R1_15" | "R16_30" | "R31_45" | "R46_60" | "R61_90" | "OVER_90";

export interface CarbsRangeDefinition {
  code: CarbsRangeCode;
  labelEs: string;
  minG: number;
  maxG: number | null; // null = sin tope (el último rango)
  /** Ejemplos orientativos de alimentos comunes en Costa Rica para ese
   * rango — SIEMPRE presentados como aproximados, nunca como medición. */
  examplesEs: string[];
}

export const CARBS_RANGES: CarbsRangeDefinition[] = [
  {
    code: "ZERO",
    labelEs: "0 g",
    minG: 0,
    maxG: 0,
    examplesEs: ["Agua, café o té sin azúcar", "Carne, pollo o pescado solos", "Ensalada verde sin aderezo dulce"],
  },
  {
    code: "R1_15",
    labelEs: "1–15 g",
    minG: 1,
    maxG: 15,
    examplesEs: [
      "1 tortilla de maíz pequeña",
      "½ taza de frutas picadas",
      "1 cucharada de frijoles",
    ],
  },
  {
    code: "R16_30",
    labelEs: "16–30 g",
    minG: 16,
    maxG: 30,
    examplesEs: [
      "1 taza de frijoles",
      "1 plátano pequeño",
      "2 tortillas de maíz",
      "1 rebanada de pan",
    ],
  },
  {
    code: "R31_45",
    labelEs: "31–45 g",
    minG: 31,
    maxG: 45,
    examplesEs: [
      "1 taza de arroz blanco cocido",
      "1 papa mediana",
      "1 plátano maduro grande",
      "1 vaso de gaseosa (350 ml)",
    ],
  },
  {
    code: "R46_60",
    labelEs: "46–60 g",
    minG: 46,
    maxG: 60,
    examplesEs: [
      "1 ½ taza de arroz blanco cocido",
      "1 taza de arroz + ½ taza de frijoles",
      "1 porción grande de puré de papa",
    ],
  },
  {
    code: "R61_90",
    labelEs: "61–90 g",
    minG: 61,
    maxG: 90,
    examplesEs: [
      "Un casado pequeño (arroz, frijoles, un poco de plátano) — varía mucho según ingredientes",
      "2 tazas de arroz blanco cocido",
    ],
  },
  {
    code: "OVER_90",
    labelEs: "Más de 90 g",
    minG: 91,
    maxG: null,
    examplesEs: [
      "Un casado completo con plátano y refresco natural con azúcar — varía mucho según ingredientes",
      "Porción grande de pasta",
    ],
  },
];

export function getCarbsRangeDefinition(code: CarbsRangeCode): CarbsRangeDefinition {
  const found = CARBS_RANGES.find((r) => r.code === code);
  if (!found) throw new Error(`Rango de carbohidratos desconocido: ${code}`);
  return found;
}

export type MealCarbsInput =
  | { mode: "exact"; grams: number }
  | { mode: "range"; range: CarbsRangeCode };

export interface ResolvedMealCarbs {
  carbsGDirect: number | null;
  carbsRange: CarbsRangeCode | null;
  carbsSource: "MANUAL_EXACT" | "RANGE";
}

/** Traduce lo que eligió el paciente a los campos que se guardan —
 * nunca inventa un número para un rango. */
export function resolveMealCarbsInput(input: MealCarbsInput): ResolvedMealCarbs {
  if (input.mode === "exact") {
    return { carbsGDirect: input.grams, carbsRange: null, carbsSource: "MANUAL_EXACT" };
  }
  return { carbsGDirect: null, carbsRange: input.range, carbsSource: "RANGE" };
}
