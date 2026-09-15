import { describe, it, expect } from "vitest";
import { SafetyEngine } from "./SafetyEngine";
import { DoseCalculationEngine } from "./DoseCalculationEngine";
import type { DoseCalculationInput } from "./types";

function baseInput(overrides: Partial<DoseCalculationInput> = {}): DoseCalculationInput {
  return {
    userId: "user-1",
    glucose: {
      value: 120,
      unit: "MGDL",
      source: "BLOOD",
      timestamp: new Date().toISOString(),
    },
    meal: { carbsG: 45, carbsConfirmedByUser: true },
    mealRegimenParameters: {
      regimenVersionId: "rv-1",
      carbRatio: 10,
      insulinName: "Lispro",
      insulinType: "RAPID",
    },
    correctionRegimenParameters: {
      regimenVersionId: "rv-1",
      correctionFactor: 50,
      targetGlucoseHigh: 150,
      insulinName: "Lispro",
      insulinType: "RAPID",
    },
    recentInsulinEvents: [],
    ...overrides,
  };
}

describe("SafetyEngine", () => {
  const engine = new SafetyEngine();

  it("bloquea cuando la glucosa está severamente baja", () => {
    const result = engine.check(
      baseInput({ glucose: { value: 50, unit: "MGDL", source: "BLOOD", timestamp: new Date().toISOString() } }),
    );
    expect(result.blocksCalculation).toBe(true);
    expect(result.status).toBe("BLOCKED");
  });

  it("bloquea cuando la glucosa está baja (no severa)", () => {
    const result = engine.check(
      baseInput({ glucose: { value: 65, unit: "MGDL", source: "BLOOD", timestamp: new Date().toISOString() } }),
    );
    expect(result.blocksCalculation).toBe(true);
  });

  it("no bloquea con glucosa normal y datos completos", () => {
    const result = engine.check(baseInput());
    expect(result.blocksCalculation).toBe(false);
  });

  it("bloquea si falta carbRatio pero hay carbohidratos", () => {
    const result = engine.check(
      baseInput({ mealRegimenParameters: undefined }),
    );
    expect(result.blocksCalculation).toBe(true);
    expect(result.rulesTriggered.some((r) => r.ruleId === "MISSING_DATA")).toBe(true);
  });

  it("bloquea si la estimación de carbohidratos por foto no fue confirmada", () => {
    const result = engine.check(
      baseInput({ meal: { carbsG: 60, carbsConfirmedByUser: false } }),
    );
    expect(result.blocksCalculation).toBe(true);
    expect(
      result.rulesTriggered.some((r) => r.ruleId === "UNCONFIRMED_CARB_ESTIMATE"),
    ).toBe(true);
  });

  it("emite advertencia (no bloqueo) si hay una dosis muy reciente", () => {
    const now = new Date();
    const result = engine.check(
      baseInput({
        glucose: { value: 120, unit: "MGDL", source: "BLOOD", timestamp: now.toISOString() },
        recentInsulinEvents: [
          {
            timestamp: new Date(now.getTime() - 10 * 60000).toISOString(),
            dose: 4,
            purpose: "MEAL",
            insulinName: "Lispro",
          },
        ],
      }),
    );
    expect(result.blocksCalculation).toBe(false);
    expect(result.status).toBe("WARNING");
    expect(result.rulesTriggered.some((r) => r.ruleId === "RECENT_INSULIN_DOSE")).toBe(true);
  });

  it("emite advertencia con glucosa extremadamente alta, sin bloquear", () => {
    const result = engine.check(
      baseInput({ glucose: { value: 350, unit: "MGDL", source: "BLOOD", timestamp: new Date().toISOString() } }),
    );
    expect(result.blocksCalculation).toBe(false);
    expect(result.rulesTriggered.some((r) => r.ruleId === "VERY_HIGH_GLUCOSE")).toBe(true);
  });

  it("convierte correctamente mmol/L a mg/dL para evaluar el umbral bajo", () => {
    // 3.0 mmol/L ≈ 54 mg/dL -> debe bloquear (muy bajo)
    const result = engine.check(
      baseInput({ glucose: { value: 3.0, unit: "MMOLL", source: "BLOOD", timestamp: new Date().toISOString() } }),
    );
    expect(result.blocksCalculation).toBe(true);
  });
});

describe("DoseCalculationEngine + SafetyEngine (integración)", () => {
  const engine = new DoseCalculationEngine();

  it("NUNCA devuelve una dosis cuando SafetyEngine bloquea", () => {
    const result = engine.calculate(
      baseInput({ glucose: { value: 40, unit: "MGDL", source: "BLOOD", timestamp: new Date().toISOString() } }),
    );
    expect(result.safetyStatus).toBe("BLOCKED");
    expect(result.totalDose).toBeNull();
    expect(result.breakdown).toHaveLength(0);
  });

  it("calcula dosis por carbohidratos + corrección cuando todo está OK", () => {
    const result = engine.calculate(baseInput());
    // 45g / 10 g/U = 4.5 U ; glucosa 120 no supera target 150 -> sin corrección
    expect(result.totalDose).toBe(4.5);
    expect(result.safetyStatus).toBe("OK");
  });

  it("suma corrección cuando la glucosa supera el objetivo alto", () => {
    const result = engine.calculate(
      baseInput({ glucose: { value: 200, unit: "MGDL", source: "BLOOD", timestamp: new Date().toISOString() } }),
    );
    // comida: 4.5 U ; corrección: (200-150)/50 = 1 U -> total 5.5 U
    expect(result.totalDose).toBe(5.5);
  });

  it("cada cálculo conserva un snapshot auditable completo", () => {
    const result = engine.calculate(baseInput());
    expect(result.auditSnapshot.inputValues).toBeDefined();
    expect(result.auditSnapshot.parametersUsed).toBeDefined();
    expect(result.algorithmVersion).toBeTruthy();
    expect(result.timestamp).toBeTruthy();
  });
});
