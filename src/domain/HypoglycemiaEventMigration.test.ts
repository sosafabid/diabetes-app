import { describe, it, expect } from "vitest";
import { planMigration, type LegacyHypoglycemiaEvent } from "./HypoglycemiaEventMigration";

function legacy(overrides: Partial<LegacyHypoglycemiaEvent> = {}): LegacyHypoglycemiaEvent {
  return {
    id: "leg-1",
    userId: "user-1",
    glucoseReadingId: "reading-1",
    hypoglycemiaPlanId: null,
    status: "PENDING",
    treatedAt: null,
    carbsConsumedG: null,
    productUsed: null,
    severeMarkedAt: null,
    resolvedGlucoseReadingId: null,
    createdAt: new Date("2026-01-01T10:00:00"),
    ...overrides,
  };
}

describe("planMigration", () => {
  it("migra un evento PENDING como OPEN sin intervención ni medición", () => {
    const plan = planMigration([legacy()], new Set(), new Set(), new Set());
    expect(plan.toCreate).toHaveLength(1);
    expect(plan.toCreate[0].glucoseEvent.status).toBe("OPEN");
    expect(plan.toCreate[0].intervention).toBeNull();
    expect(plan.toCreate[0].measurement).toBeNull();
  });

  it("migra un evento TREATED como CLOSED con su intervención de carbohidratos", () => {
    const treatedAt = new Date("2026-01-01T10:20:00");
    const plan = planMigration(
      [legacy({ id: "leg-2", status: "TREATED", treatedAt, carbsConsumedG: 15, productUsed: "Miel" })],
      new Set(),
      new Set(),
      new Set(),
    );
    expect(plan.toCreate).toHaveLength(1);
    const item = plan.toCreate[0];
    expect(item.glucoseEvent.status).toBe("CLOSED");
    expect(item.glucoseEvent.endedAt).toEqual(treatedAt);
    expect(item.intervention).toMatchObject({ type: "CARBOHYDRATE", food: "Miel", carbohydrateGrams: 15 });
  });

  it("migra un evento SEVERE como CLOSED, usando severeMarkedAt como cierre", () => {
    const severeMarkedAt = new Date("2026-01-01T10:05:00");
    const plan = planMigration(
      [legacy({ id: "leg-3", status: "SEVERE", severeMarkedAt })],
      new Set(),
      new Set(),
      new Set(),
    );
    expect(plan.toCreate[0].glucoseEvent.status).toBe("CLOSED");
    expect(plan.toCreate[0].glucoseEvent.endedAt).toEqual(severeMarkedAt);
  });

  it("crea la medición de seguimiento cuando resolvedGlucoseReadingId está presente y libre", () => {
    const plan = planMigration(
      [legacy({ id: "leg-4", status: "RESOLVED", resolvedGlucoseReadingId: "reading-follow-1" })],
      new Set(),
      new Set(),
      new Set(),
    );
    expect(plan.toCreate[0].measurement).toEqual({ glucoseReadingId: "reading-follow-1" });
  });

  it("es idempotente: salta los que ya fueron migrados, sin duplicar", () => {
    const events = [legacy({ id: "leg-5" }), legacy({ id: "leg-6", glucoseReadingId: "reading-6" })];
    const plan = planMigration(events, new Set(["leg-5"]), new Set(), new Set());
    expect(plan.alreadyMigrated).toEqual(["leg-5"]);
    expect(plan.toCreate).toHaveLength(1);
    expect(plan.toCreate[0].legacyId).toBe("leg-6");
  });

  it("omite el evento completo si su lectura inicial ya está en conflicto", () => {
    const plan = planMigration(
      [legacy({ id: "leg-7", glucoseReadingId: "reading-ya-usada" })],
      new Set(),
      new Set(["reading-ya-usada"]), // ya es inicial de otro evento
      new Set(),
    );
    expect(plan.toCreate).toHaveLength(0);
    expect(plan.skippedDueToConflict).toHaveLength(1);
    expect(plan.skippedDueToConflict[0].legacyId).toBe("leg-7");
  });

  it("migra el evento SIN la medición si solo la medición está en conflicto (no lo omite completo)", () => {
    const plan = planMigration(
      [legacy({ id: "leg-8", resolvedGlucoseReadingId: "reading-en-conflicto" })],
      new Set(),
      new Set(),
      new Set(["reading-en-conflicto"]), // ya es medición de otro evento
    );
    expect(plan.toCreate).toHaveLength(1);
    expect(plan.toCreate[0].measurement).toBeNull();
    expect(plan.skippedDueToConflict).toHaveLength(1);
  });

  it("detecta conflictos generados DENTRO del mismo lote (dos legacy apuntando a la misma lectura)", () => {
    const plan = planMigration(
      [
        legacy({ id: "leg-9", glucoseReadingId: "reading-compartida" }),
        legacy({ id: "leg-10", glucoseReadingId: "reading-compartida" }),
      ],
      new Set(),
      new Set(),
      new Set(),
    );
    expect(plan.toCreate).toHaveLength(1);
    expect(plan.skippedDueToConflict).toHaveLength(1);
  });
});
