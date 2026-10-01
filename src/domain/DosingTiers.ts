// ============================================================================
// DosingTiers — Modalidad B: esquema progresivo por tramos.
//
// REGLA NO NEGOCIABLE: esto SOLO valida que la tabla que el paciente/
// profesional introdujo sea internamente consistente (tramos ordenados,
// sin huecos raros, límites coherentes). NUNCA calcula ni sugiere una
// dosis a partir de un valor de carbohidratos — eso está fuera de esta
// fase por completo.
//
// isCumulative es la distinción explícita que pide el proyecto:
//   false = "dosis indicada para el intervalo total de carbohidratos"
//   true  = "dosis acumulativa por cada tramo adicional"
// Ambas se guardan y se muestran tal cual — nunca se asume que son
// equivalentes ni se convierte una en otra.
// ============================================================================

export interface TierInput {
  order: number;
  carbsFromG: number;
  carbsToG: number | null; // null = sin límite superior
  units: number;
  isCumulative: boolean;
  description?: string | null;
}

export interface TierValidationError {
  order: number;
  reasonEs: string;
}

export function validateTiers(tiers: TierInput[]): TierValidationError[] {
  const errors: TierValidationError[] = [];
  if (tiers.length === 0) return errors;

  const sorted = [...tiers].sort((a, b) => a.order - b.order);

  sorted.forEach((tier, i) => {
    if (tier.carbsFromG < 0) {
      errors.push({ order: tier.order, reasonEs: "El inicio del tramo no puede ser negativo." });
    }
    if (tier.carbsToG != null && tier.carbsToG <= tier.carbsFromG) {
      errors.push({ order: tier.order, reasonEs: "El fin del tramo debe ser mayor que el inicio." });
    }
    if (tier.units < 0) {
      errors.push({ order: tier.order, reasonEs: "Las unidades no pueden ser negativas." });
    }
    // Solo el último tramo (por orden) puede quedar sin límite superior.
    if (tier.carbsToG == null && i !== sorted.length - 1) {
      errors.push({
        order: tier.order,
        reasonEs: "Solo el último tramo puede quedar sin límite superior.",
      });
    }
    // Los tramos consecutivos no deben solaparse ni dejar huecos raros.
    const next = sorted[i + 1];
    if (next && tier.carbsToG != null && next.carbsFromG !== tier.carbsToG + 1 && next.carbsFromG <= tier.carbsToG) {
      errors.push({
        order: tier.order,
        reasonEs: `El tramo se solapa con el siguiente (tramo ${next.order}).`,
      });
    }
  });

  // Todos los tramos de una misma tabla deben coincidir en isCumulative —
  // mezclar ambas interpretaciones en la misma tabla sería confuso e
  // incorrecto, ya que cambia el significado de "units" tramo a tramo.
  const distinctModes = new Set(tiers.map((t) => t.isCumulative));
  if (distinctModes.size > 1) {
    errors.push({
      order: -1,
      reasonEs:
        "Todos los tramos de la misma tabla deben ser del mismo tipo — o todos 'por intervalo total' o todos 'acumulativos', no mezclados.",
    });
  }

  return errors;
}
