import { describe, it, expect } from "vitest";
import { SummaryEngine } from "./SummaryEngine";
import { resolvePeriod, parseDateOnlyLocal } from "./resolvePeriod";
import type { SummaryEngineInput } from "./summaryTypes";

function baseInput(overrides: Partial<SummaryEngineInput> = {}): SummaryEngineInput {
  return {
    period: { type: "7d", start: new Date("2026-09-01"), end: new Date("2026-09-07") },
    glucoseReadings: [],
    insulinEvents: [],
    meals: [],
    exerciseEvents: [],
    hypoglycemiaEvents: [],
    ...overrides,
  };
}

describe("SummaryEngine", () => {
  const engine = new SummaryEngine();

  it("nunca mezcla sangre y CGM en bySource", () => {
    const result = engine.compute(
      baseInput({
        glucoseReadings: [
          { timestamp: new Date(), value: 100, unit: "MGDL", source: "BLOOD" },
          { timestamp: new Date(), value: 200, unit: "MGDL", source: "CGM" },
        ],
      }),
    );
    expect(result.glucose.bySource.BLOOD.count).toBe(1);
    expect(result.glucose.bySource.BLOOD.average).toBe(100);
    expect(result.glucose.bySource.CGM.count).toBe(1);
    expect(result.glucose.bySource.CGM.average).toBe(200);
    expect(result.glucose.combined.count).toBe(2);
  });

  it("convierte mmol/L a mg/dL antes de calcular estadísticas", () => {
    const result = engine.compute(
      baseInput({
        glucoseReadings: [
          { timestamp: new Date(), value: 5.5, unit: "MMOLL", source: "BLOOD" },
        ],
      }),
    );
    // 5.5 mmol/L ≈ 99.1 mg/dL
    expect(result.glucose.bySource.BLOOD.average).toBeCloseTo(99.1, 0);
  });

  it("cuenta episodios bajos y altos según el umbral configurado", () => {
    const result = engine.compute(
      baseInput({
        lowThresholdMgdl: 70,
        highThresholdMgdl: 180,
        glucoseReadings: [
          { timestamp: new Date(), value: 60, unit: "MGDL", source: "BLOOD" },
          { timestamp: new Date(), value: 100, unit: "MGDL", source: "BLOOD" },
          { timestamp: new Date(), value: 200, unit: "MGDL", source: "BLOOD" },
        ],
      }),
    );
    expect(result.glucose.combined.lowCount).toBe(1);
    expect(result.glucose.combined.highCount).toBe(1);
  });

  it("suma insulina total y la agrupa por nombre y propósito, sin recomendar cambios", () => {
    const result = engine.compute(
      baseInput({
        insulinEvents: [
          { timestamp: new Date(), dose: 4, insulinName: "Lispro", purpose: "MEAL" },
          { timestamp: new Date(), dose: 18, insulinName: "Glargina", purpose: "BASAL" },
          { timestamp: new Date(), dose: 2, insulinName: "Lispro", purpose: "CORRECTION" },
        ],
      }),
    );
    expect(result.insulin.totalUnits).toBe(24);
    expect(result.insulin.byInsulinName.Lispro).toBe(6);
    expect(result.insulin.byInsulinName.Glargina).toBe(18);
    expect(result.insulin.byPurpose.MEAL).toBe(4);
  });

  it("calcula carbohidratos totales y promedio solo sobre comidas con dato registrado", () => {
    const result = engine.compute(
      baseInput({
        meals: [
          { timestamp: new Date(), mealType: "BREAKFAST", carbsG: 45 },
          { timestamp: new Date(), mealType: "LUNCH", carbsG: 60 },
          { timestamp: new Date(), mealType: "DINNER", carbsG: null },
        ],
      }),
    );
    expect(result.meals.count).toBe(3);
    expect(result.meals.totalCarbsG).toBe(105);
    expect(result.meals.averageCarbsG).toBe(52.5);
    expect(result.meals.mealsWithoutCarbsRecorded).toBe(1);
  });

  it("resume hipoglucemias sin calcular ni sugerir dosis", () => {
    const result = engine.compute(
      baseInput({
        hypoglycemiaEvents: [
          { createdAt: new Date(), status: "TREATED", carbsConsumedG: 15 },
          { createdAt: new Date(), status: "TREATED", carbsConsumedG: 20 },
          { createdAt: new Date(), status: "SEVERE", carbsConsumedG: null },
        ],
      }),
    );
    expect(result.hypoglycemia.episodeCount).toBe(3);
    expect(result.hypoglycemia.treatedCount).toBe(2);
    expect(result.hypoglycemia.severeCount).toBe(1);
    expect(result.hypoglycemia.averageCarbsConsumedG).toBe(17.5);
  });

  it("señala datos insuficientes cuando hay muy pocas lecturas", () => {
    const result = engine.compute(
      baseInput({
        glucoseReadings: [
          { timestamp: new Date(), value: 100, unit: "MGDL", source: "BLOOD" },
        ],
      }),
    );
    expect(
      result.missingDataNotes.some((n) => n.messageEs.includes("pocas mediciones")),
    ).toBe(true);
  });

  it("no genera notas de datos faltantes cuando hay suficiente información", () => {
    const readings = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(),
      value: 100 + i,
      unit: "MGDL" as const,
      source: "BLOOD" as const,
    }));
    const result = engine.compute(baseInput({ glucoseReadings: readings }));
    expect(
      result.missingDataNotes.some((n) => n.messageEs.includes("pocas mediciones")),
    ).toBe(false);
  });

  it("calcula el GMI con la fórmula de Bergenstal et al. (2018)", () => {
    const result = engine.compute(
      baseInput({
        glucoseReadings: [
          { timestamp: new Date(), value: 150, unit: "MGDL", source: "CGM" },
        ],
      }),
    );
    // GMI = 3.31 + 0.02392 * 150 = 6.898 → redondeado a 6.9
    expect(result.glucose.gmiPercent).toBeCloseTo(6.9, 1);
  });

  it("devuelve GMI null cuando no hay lecturas", () => {
    const result = engine.compute(baseInput());
    expect(result.glucose.gmiPercent).toBeNull();
  });

  it("calcula la variabilidad (%CV) y es null con una sola lectura", () => {
    const single = engine.compute(
      baseInput({
        glucoseReadings: [{ timestamp: new Date(), value: 100, unit: "MGDL", source: "CGM" }],
      }),
    );
    expect(single.glucose.combined.variabilityPercentCV).toBeNull();

    const varied = engine.compute(
      baseInput({
        glucoseReadings: [
          { timestamp: new Date(), value: 100, unit: "MGDL", source: "CGM" },
          { timestamp: new Date(), value: 200, unit: "MGDL", source: "CGM" },
        ],
      }),
    );
    // media 150, desviación estándar poblacional 50 → CV = 50/150*100 ≈ 33.3%
    expect(varied.glucose.combined.variabilityPercentCV).toBeCloseTo(33.3, 1);
  });

  it("calcula la duración promedio de hipoglucemias solo con episodios que ya tienen cierre", () => {
    const createdAt = new Date("2026-09-01T10:00:00");
    const treatedAt = new Date("2026-09-01T10:20:00"); // 20 min después
    const result = engine.compute(
      baseInput({
        hypoglycemiaEvents: [
          { createdAt, status: "TREATED", carbsConsumedG: 15, treatedAt },
          { createdAt, status: "PENDING", carbsConsumedG: null }, // sin cierre — no cuenta
        ],
      }),
    );
    expect(result.hypoglycemia.averageDurationMinutes).toBe(20);
  });
});

describe("resolvePeriod", () => {
  const now = new Date("2026-09-16T12:00:00");

  it("7d incluye hoy y los 6 días anteriores (7 días en total)", () => {
    const period = resolvePeriod("7d", now);
    const diffDays = Math.round(
      (period.end.getTime() - period.start.getTime()) / 86400000,
    );
    expect(diffDays).toBe(7);
    expect(period.start.getDate()).toBe(10);
  });

  it("month usa el mes calendario completo", () => {
    const period = resolvePeriod("month", now);
    expect(period.start.getDate()).toBe(1);
    expect(period.start.getMonth()).toBe(8); // septiembre = índice 8
    expect(period.end.getMonth()).toBe(8);
    expect(period.end.getDate()).toBe(30); // septiembre tiene 30 días
  });

  it("custom requiere fecha de inicio y fin", () => {
    expect(() => resolvePeriod("custom", now)).toThrow();
  });

  it("custom usa exactamente las fechas dadas", () => {
    const period = resolvePeriod(
      "custom",
      now,
      parseDateOnlyLocal("2026-08-01"),
      parseDateOnlyLocal("2026-08-15"),
    );
    expect(period.start.getDate()).toBe(1);
    expect(period.end.getDate()).toBe(15);
  });
});
