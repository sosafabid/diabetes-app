import { describe, it, expect } from "vitest";
import { PatternEngine } from "./PatternEngine";

function d(dateStr: string): Date {
  return new Date(dateStr);
}

describe("PatternEngine", () => {
  it("reports insufficient data when nothing is logged", () => {
    const engine = new PatternEngine();
    const results = engine.compute({
      glucoseReadings: [],
      exerciseEvents: [],
      meals: [],
      insulinEvents: [],
      contextEvents: [],
    });
    for (const r of results) {
      expect(r.available).toBe(false);
      expect(r.insufficientMessageEs).toBeTruthy();
    }
  });

  it("compares sleep buckets using only days with both sleep and glucose data", () => {
    const engine = new PatternEngine();
    const results = engine.compute({
      glucoseReadings: [
        { timestamp: d("2026-09-01T08:00:00"), value: 200, unit: "MGDL", source: "CGM" },
        { timestamp: d("2026-09-02T08:00:00"), value: 100, unit: "MGDL", source: "CGM" },
        { timestamp: d("2026-09-03T08:00:00"), value: 190, unit: "MGDL", source: "CGM" },
        { timestamp: d("2026-09-04T08:00:00"), value: 110, unit: "MGDL", source: "CGM" },
      ],
      exerciseEvents: [],
      meals: [],
      insulinEvents: [],
      contextEvents: [
        { timestamp: d("2026-09-01T22:00:00"), sleepHours: 4, isMenstruating: null },
        { timestamp: d("2026-09-02T22:00:00"), sleepHours: 7, isMenstruating: null },
        { timestamp: d("2026-09-03T22:00:00"), sleepHours: 5, isMenstruating: null },
        { timestamp: d("2026-09-04T22:00:00"), sleepHours: 8, isMenstruating: null },
      ],
    });
    const sleep = results.find((r) => r.id === "sleep")!;
    expect(sleep.available).toBe(true);
    expect(sleep.groups?.[0].n).toBe(2); // <6h: 9/1 y 9/3
    expect(sleep.groups?.[0].avgGlucoseMgdl).toBeCloseTo(195);
    expect(sleep.groups?.[1].n).toBe(2); // >=6h: 9/2 y 9/4
    expect(sleep.groups?.[1].avgGlucoseMgdl).toBeCloseTo(105);
  });

  it("never averages blood and CGM together on the same day", () => {
    const engine = new PatternEngine();
    const results2 = engine.compute({
      glucoseReadings: [
        { timestamp: d("2026-09-01T08:00:00"), value: 300, unit: "MGDL", source: "BLOOD" },
        { timestamp: d("2026-09-01T09:00:00"), value: 100, unit: "MGDL", source: "CGM" },
        { timestamp: d("2026-09-02T08:00:00"), value: 130, unit: "MGDL", source: "CGM" },
        { timestamp: d("2026-09-03T08:00:00"), value: 120, unit: "MGDL", source: "CGM" },
        { timestamp: d("2026-09-04T08:00:00"), value: 110, unit: "MGDL", source: "CGM" },
      ],
      exerciseEvents: [{ timestamp: d("2026-09-01T07:00:00") }, { timestamp: d("2026-09-02T07:00:00") }],
      meals: [],
      insulinEvents: [],
      contextEvents: [],
    });
    const activity = results2.find((r) => r.id === "activity")!;
    const day1Row = activity.dataRows?.find((r) => r.labelEs === "01/09/2026");
    // El día 1 tiene sangre=300 y CGM=100 — debe usar SOLO CGM (100), nunca
    // el promedio de ambas (200).
    expect(day1Row?.glucoseMgdl).toBe(100);
  });

  it("flags insufficient meal data below the minimum threshold", () => {
    const engine = new PatternEngine();
    const results = engine.compute({
      glucoseReadings: [
        { timestamp: d("2026-09-01T13:00:00"), value: 150, unit: "MGDL", source: "CGM" },
      ],
      exerciseEvents: [],
      meals: [{ timestamp: d("2026-09-01T12:00:00"), carbsG: 40 }],
      insulinEvents: [],
      contextEvents: [],
    });
    const meals = results.find((r) => r.id === "meals")!;
    expect(meals.available).toBe(false);
  });
});