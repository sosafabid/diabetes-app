import { describe, it, expect } from "vitest";
import { CARBS_RANGES, getCarbsRangeDefinition, resolveMealCarbsInput } from "./CarbsRange";

describe("CARBS_RANGES", () => {
  it("los 7 rangos no se solapan y cubren de 0 a infinito sin huecos", () => {
    expect(CARBS_RANGES).toHaveLength(7);
    for (let i = 0; i < CARBS_RANGES.length - 1; i++) {
      const current = CARBS_RANGES[i];
      const next = CARBS_RANGES[i + 1];
      expect(current.maxG).not.toBeNull();
      expect(next.minG).toBe((current.maxG as number) + 1);
    }
    expect(CARBS_RANGES[CARBS_RANGES.length - 1].maxG).toBeNull();
  });

  it("cada rango trae al menos un ejemplo orientativo", () => {
    for (const range of CARBS_RANGES) {
      expect(range.examplesEs.length).toBeGreaterThan(0);
    }
  });
});

describe("resolveMealCarbsInput", () => {
  it("modo exacto guarda el número y deja el rango en null", () => {
    const result = resolveMealCarbsInput({ mode: "exact", grams: 38 });
    expect(result).toEqual({ carbsGDirect: 38, carbsRange: null, carbsSource: "MANUAL_EXACT" });
  });

  it("modo rango NUNCA inventa un número — carbsGDirect queda null", () => {
    const result = resolveMealCarbsInput({ mode: "range", range: "R31_45" });
    expect(result.carbsGDirect).toBeNull();
    expect(result.carbsRange).toBe("R31_45");
    expect(result.carbsSource).toBe("RANGE");
  });
});

describe("getCarbsRangeDefinition", () => {
  it("encuentra la definición por código", () => {
    expect(getCarbsRangeDefinition("R16_30").labelEs).toBe("16–30 g");
  });

  it("lanza error ante un código inválido en vez de devolver algo inventado", () => {
    // @ts-expect-error - probando código inválido a propósito
    expect(() => getCarbsRangeDefinition("NOT_REAL")).toThrow();
  });
});
