// ============================================================================
// InsulinActivityEngine
// ============================================================================
// TODO — Clinical validation required.
//
// Este motor calculará en el futuro la "insulina activa" (IOB — insulin on
// board) del paciente, usando un modelo farmacocinético.
//
// NO IMPLEMENTAR ESTO CON VALORES INVENTADOS. El spec del producto prohíbe
// explícitamente inventar duraciones de acción o curvas de actividad de
// insulina (sección 15). Esta clase existe únicamente para reservar el punto
// de extensión en la arquitectura.
//
// Antes de implementar:
// - Obtener perfiles de duración de acción validados clínicamente por tipo
//   de insulina (o permitir que el profesional de salud los configure
//   explícitamente por paciente).
// - Definir con un profesional de salud qué modelo de decaimiento usar
//   (p.ej. lineal, bilineal, exponencial) — NO asumir un modelo por defecto.
// ============================================================================

import type { RecentInsulinEvent } from "./types";

export interface InsulinActivityParams {
  /** Duración de acción validada clínicamente para esta insulina, en minutos. */
  durationMinutes: number;
  /** Modelo de decaimiento a usar — a definir con validación clínica. */
  decayModel: "TODO_NOT_IMPLEMENTED";
}

export interface InsulinActivityResult {
  /** Unidades de insulina aún activas, estimadas. */
  activeUnits: number;
  /** Desglose por evento de insulina que contribuye al total. */
  contributingEvents: RecentInsulinEvent[];
}

export class InsulinActivityEngine {
  /**
   * NO IMPLEMENTADO — requiere validación clínica de los parámetros
   * farmacocinéticos antes de poder calcular IOB de forma segura.
   */
  calculateActiveInsulin(
    _events: RecentInsulinEvent[],
    _params: InsulinActivityParams,
    _asOf: string,
  ): InsulinActivityResult {
    throw new Error(
      "InsulinActivityEngine no está implementado. Requiere validación " +
        "clínica de parámetros farmacocinéticos antes de producción. " +
        "TODO — Clinical validation required.",
    );
  }
}
