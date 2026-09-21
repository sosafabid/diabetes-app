import { describe, it, expect } from "vitest";
import { detectColumns, normalizeRows, splitNewAndDuplicates } from "./GenericCSVImporter";

describe("detectColumns", () => {
  it("detecta columnas estándar (timestamp + glucose)", () => {
    const result = detectColumns(["Timestamp", "Glucose Value", "Device"]);
    expect(result.confidence).toBe("auto");
    expect(result.mapping.datetimeColumn).toBe("Timestamp");
    expect(result.mapping.glucoseColumn).toBe("Glucose Value");
  });

  it("detecta fecha y hora en columnas separadas, en español", () => {
    const result = detectColumns(["Fecha", "Hora", "Glucosa"]);
    expect(result.confidence).toBe("auto");
    expect(result.mapping.dateColumn).toBe("Fecha");
    expect(result.mapping.timeColumn).toBe("Hora");
    expect(result.mapping.glucoseColumn).toBe("Glucosa");
  });

  it("tolera mayúsculas y espacios", () => {
    const result = detectColumns(["  DATE  ", " Glucose "]);
    expect(result.mapping.dateColumn).toBe("  DATE  ");
    expect(result.mapping.glucoseColumn).toBe(" Glucose ");
  });

  it("marca 'none' cuando no reconoce ninguna columna", () => {
    const result = detectColumns(["Col A", "Col B", "Col C"]);
    expect(result.confidence).toBe("none");
  });

  it("marca 'partial' cuando detecta solo una parte", () => {
    const result = detectColumns(["Fecha", "Nota"]);
    expect(result.confidence).toBe("partial");
  });
});

describe("normalizeRows", () => {
  const mappingCombined = { datetimeColumn: "Timestamp", glucoseColumn: "Glucose" };
  const mappingSeparate = { dateColumn: "Fecha", timeColumn: "Hora", glucoseColumn: "Glucosa" };

  it("normaliza un CSV válido con timestamp combinado", () => {
    const result = normalizeRows(
      [
        { Timestamp: "2026-09-01T08:00:00", Glucose: "120" },
        { Timestamp: "2026-09-01T09:00:00", Glucose: "135" },
      ],
      mappingCombined,
      "MGDL",
    );
    expect(result.validRows).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.validRows[0].glucoseValue).toBe(120);
    expect(result.validRows[0].unit).toBe("MGDL");
  });

  it("normaliza con columnas de fecha y hora separadas", () => {
    const result = normalizeRows(
      [{ Fecha: "01/09/2026", Hora: "08:30", Glucosa: "110" }],
      mappingSeparate,
      "MGDL",
    );
    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0].timestamp.getHours()).toBe(8);
    expect(result.validRows[0].timestamp.getMinutes()).toBe(30);
  });

  it("acepta mg/dL y mmol/L, y una columna de unidad por fila si existe", () => {
    const result = normalizeRows(
      [
        { Timestamp: "2026-09-01T08:00:00", Glucose: "120", Unit: "mg/dL" },
        { Timestamp: "2026-09-01T09:00:00", Glucose: "6.7", Unit: "mmol/L" },
      ],
      { ...mappingCombined, unitColumn: "Unit" },
      "MGDL",
    );
    expect(result.validRows[0].unit).toBe("MGDL");
    expect(result.validRows[1].unit).toBe("MMOLL");
    // El valor original NUNCA se convierte/recalcula — se guarda tal cual.
    expect(result.validRows[1].glucoseValue).toBe(6.7);
  });

  it("reporta fechas inválidas sin descartar el archivo completo", () => {
    const result = normalizeRows(
      [
        { Timestamp: "2026-09-01T08:00:00", Glucose: "120" },
        { Timestamp: "no-es-una-fecha", Glucose: "130" },
        { Timestamp: "2026-09-01T10:00:00", Glucose: "125" },
      ],
      mappingCombined,
      "MGDL",
    );
    expect(result.validRows).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reasonEs).toContain("Fecha/hora");
    expect(result.errors[0].rowIndex).toBe(3); // fila 2 del CSV = índice 3 (header=1)
  });

  it("reporta valores de glucosa vacíos o no numéricos", () => {
    const result = normalizeRows(
      [
        { Timestamp: "2026-09-01T08:00:00", Glucose: "" },
        { Timestamp: "2026-09-01T09:00:00", Glucose: "abc" },
        { Timestamp: "2026-09-01T10:00:00", Glucose: "120" },
      ],
      mappingCombined,
      "MGDL",
    );
    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toHaveLength(2);
    expect(result.errors.every((e) => e.reasonEs.includes("glucosa"))).toBe(true);
  });

  it("nunca inventa un valor para reparar una fila — la omite y reporta", () => {
    const result = normalizeRows(
      [{ Timestamp: "", Glucose: "120" }],
      mappingCombined,
      "MGDL",
    );
    expect(result.validRows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it("detecta duplicados DENTRO del mismo archivo", () => {
    const result = normalizeRows(
      [
        { Timestamp: "2026-09-01T08:00:00", Glucose: "120" },
        { Timestamp: "2026-09-01T08:00:00", Glucose: "120" }, // idéntica
      ],
      mappingCombined,
      "MGDL",
    );
    expect(result.validRows).toHaveLength(1);
    expect(result.internalDuplicateCount).toBe(1);
  });

  it("maneja un archivo vacío sin lanzar error", () => {
    const result = normalizeRows([], mappingCombined, "MGDL");
    expect(result.validRows).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});

describe("splitNewAndDuplicates", () => {
  it("separa lo nuevo de lo que ya existe en la base de datos", () => {
    const parsed = [
      { rowIndex: 2, timestamp: new Date("2026-09-01T08:00:00"), glucoseValue: 120, unit: "MGDL" as const },
      { rowIndex: 3, timestamp: new Date("2026-09-01T09:00:00"), glucoseValue: 130, unit: "MGDL" as const },
    ];
    const existing = [
      { timestamp: new Date("2026-09-01T08:00:00"), glucoseValue: 120, unit: "MGDL" as const },
    ];
    const { newRows, duplicates } = splitNewAndDuplicates(parsed, existing);
    expect(newRows).toHaveLength(1);
    expect(newRows[0].glucoseValue).toBe(130);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].glucoseValue).toBe(120);
  });

  it("una lectura manual con el mismo timestamp/valor/unidad cuenta como duplicado", () => {
    // Esto es intencional: si el paciente ya registró esa lectura a mano y
    // luego importa el mismo dato del sensor, no queremos que se duplique.
    const parsed = [
      { rowIndex: 2, timestamp: new Date("2026-09-01T08:00:00"), glucoseValue: 120, unit: "MGDL" as const },
    ];
    const existing = [
      { timestamp: new Date("2026-09-01T08:00:00"), glucoseValue: 120, unit: "MGDL" as const },
    ];
    const { newRows, duplicates } = splitNewAndDuplicates(parsed, existing);
    expect(newRows).toHaveLength(0);
    expect(duplicates).toHaveLength(1);
  });
});
