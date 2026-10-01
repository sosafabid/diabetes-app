import { describe, it, expect } from "vitest";
import { validateTiers, type TierInput } from "./DosingTiers";

function tier(overrides: Partial<TierInput>): TierInput {
  return { order: 1, carbsFromG: 0, carbsToG: 15, units: 1, isCumulative: false, ...overrides };
}

describe("validateTiers", () => {
  it("una tabla vacía no genera errores", () => {
    expect(validateTiers([])).toEqual([]);
  });

  it("una tabla válida de 3 tramos consecutivos no genera errores", () => {
    const tiers = [
      tier({ order: 1, carbsFromG: 0, carbsToG: 15, units: 1 }),
      tier({ order: 2, carbsFromG: 16, carbsToG: 30, units: 2 }),
      tier({ order: 3, carbsFromG: 31, carbsToG: null, units: 3 }),
    ];
    expect(validateTiers(tiers)).toEqual([]);
  });

  it("detecta cuando el fin del tramo es menor o igual al inicio", () => {
    const errors = validateTiers([tier({ carbsFromG: 20, carbsToG: 10 })]);
    expect(errors.some((e) => e.reasonEs.includes("mayor que el inicio"))).toBe(true);
  });

  it("detecta tramos solapados", () => {
    const tiers = [
      tier({ order: 1, carbsFromG: 0, carbsToG: 20 }),
      tier({ order: 2, carbsFromG: 15, carbsToG: 30 }), // se solapa con el tramo 1
    ];
    const errors = validateTiers(tiers);
    expect(errors.some((e) => e.reasonEs.includes("solapa"))).toBe(true);
  });

  it("solo permite que el ÚLTIMO tramo quede sin límite superior", () => {
    const tiers = [
      tier({ order: 1, carbsFromG: 0, carbsToG: null }), // no es el último — inválido
      tier({ order: 2, carbsFromG: 16, carbsToG: 30 }),
    ];
    const errors = validateTiers(tiers);
    expect(errors.some((e) => e.reasonEs.includes("sin límite superior"))).toBe(true);
  });

  it("nunca mezcla tramos 'por intervalo total' con 'acumulativos' en la misma tabla", () => {
    const tiers = [
      tier({ order: 1, isCumulative: false }),
      tier({ order: 2, carbsFromG: 16, carbsToG: 30, isCumulative: true }),
    ];
    const errors = validateTiers(tiers);
    expect(errors.some((e) => e.reasonEs.includes("mismo tipo"))).toBe(true);
  });

  it("rechaza unidades negativas", () => {
    const errors = validateTiers([tier({ units: -1 })]);
    expect(errors.some((e) => e.reasonEs.includes("negativas"))).toBe(true);
  });
});
