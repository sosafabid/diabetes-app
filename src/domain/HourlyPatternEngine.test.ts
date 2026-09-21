import { describe, it, expect } from "vitest";
import { HourlyPatternEngine } from "./HourlyPatternEngine";

function d(dateStr: string): Date {
  return new Date(dateStr);
}

describe("HourlyPatternEngine", () => {
  const engine = new HourlyPatternEngine();
  const periodStart = d("2026-09-01T00:00:00Z");
  const periodEnd = d("2026-09-08T00:00:00Z"); // 7 días

  it("marca datos insuficientes con pocas lecturas", () => {
    const result = engine.compute({
      glucoseReadings: [
        { timestamp: d("2026-09-01T08:00:00Z"), value: 100, unit: "MGDL", source: "CGM" },
      ],
      meals: [],
      insulinEvents: [],
      periodStart,
      periodEnd,
      timeZone: "UTC",
    });
    expect(result.available).toBe(false);
  });

  it("marca datos insuficientes si todas las lecturas caen en la misma hora", () => {
    const result = engine.compute({
      glucoseReadings: Array.from({ length: 8 }, (_, i) => ({
        // 8 lecturas, distintos días, misma hora (8am UTC) — sin variedad horaria
        timestamp: d(`2026-09-0${i + 1}T08:00:00Z`),
        value: 100,
        unit: "MGDL" as const,
        source: "CGM" as const,
      })),
      meals: [],
      insulinEvents: [],
      periodStart,
      periodEnd,
      timeZone: "UTC",
    });
    expect(result.available).toBe(false);
  });

  it("agrupa por bloques de 2h y nunca mezcla sangre con CGM en el mismo bloque", () => {
    const result = engine.compute({
      glucoseReadings: [
        // Bloque 8-10: sangre y CGM juntos — debe usar SOLO CGM
        { timestamp: d("2026-09-01T08:30:00Z"), value: 300, unit: "MGDL", source: "BLOOD" },
        { timestamp: d("2026-09-02T08:30:00Z"), value: 100, unit: "MGDL", source: "CGM" },
        { timestamp: d("2026-09-03T08:30:00Z"), value: 110, unit: "MGDL", source: "CGM" },
        // Bloque 14-16: otra hora, para variedad horaria
        { timestamp: d("2026-09-01T14:00:00Z"), value: 140, unit: "MGDL", source: "CGM" },
        { timestamp: d("2026-09-02T14:00:00Z"), value: 150, unit: "MGDL", source: "CGM" },
        // Bloque 20-22
        { timestamp: d("2026-09-01T20:00:00Z"), value: 120, unit: "MGDL", source: "CGM" },
        { timestamp: d("2026-09-02T20:00:00Z"), value: 130, unit: "MGDL", source: "CGM" },
      ],
      meals: [{ timestamp: d("2026-09-01T08:00:00Z"), carbsG: 70 }],
      insulinEvents: [{ timestamp: d("2026-09-01T08:15:00Z"), dose: 14 }],
      periodStart,
      periodEnd, // 7 días
      timeZone: "UTC",
    });

    expect(result.available).toBe(true);
    const bucket8 = result.buckets.find((b) => b.startHour === 8)!;
    // Solo CGM (100, 110) → promedio 105, ignora el 300 de sangre
    expect(bucket8.avgGlucoseMgdl).toBe(105);
    expect(bucket8.glucoseReadingCount).toBe(2);
    // 70g de carbos / 7 días = 10 g/día
    expect(bucket8.avgCarbsGPerDay).toBeCloseTo(10, 1);
    // 14U / 7 días = 2 U/día
    expect(bucket8.avgInsulinUnitsPerDay).toBeCloseTo(2, 1);
  });
});
