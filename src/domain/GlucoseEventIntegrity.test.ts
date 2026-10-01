import { describe, it, expect } from "vitest";
import { readingConflict } from "./GlucoseEventIntegrity";

describe("readingConflict", () => {
  it("devuelve null cuando la lectura está libre", () => {
    expect(readingConflict("r1", new Set(), new Set())).toBeNull();
  });

  it("detecta que ya es la inicial de otro evento", () => {
    expect(readingConflict("r1", new Set(["r1"]), new Set())).toBe("ALREADY_INITIAL");
  });

  it("detecta que ya es una medición de otro evento", () => {
    expect(readingConflict("r1", new Set(), new Set(["r1"]))).toBe("ALREADY_MEASUREMENT");
  });

  it("prioriza ALREADY_INITIAL si está en ambos conjuntos a la vez (no debería pasar, pero no debe reventar)", () => {
    expect(readingConflict("r1", new Set(["r1"]), new Set(["r1"]))).toBe("ALREADY_INITIAL");
  });
});
