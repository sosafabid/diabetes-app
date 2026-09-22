import { describe, it, expect } from "vitest";
import {
  detectColumns,
  normalizeRows,
  splitNewAndDuplicates,
  detectHeaderRowIndex,
  rowsToRecords,
} from "./GenericCSVImporter";

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

describe("detectHeaderRowIndex / rowsToRecords — CSV real de FreeStyle Libre", () => {
  // Patrón real: la fila 1 es un renglón de metadatos (5 columnas), no el
  // encabezado — el encabezado real (20 columnas) está en la fila 2.
  const libreRawRows = [
    ["Datos de glucosa", "Generado el", "22-09-2026 03:04 UTC", "Generado por", "Maria Amaya"],
    [
      "Dispositivo",
      "Número de serie",
      "Sello de tiempo del dispositivo",
      "Tipo de registro",
      "Historial de glucosa mg/dL",
      "Escaneo de glucosa mg/dL",
    ],
    ["FreeStyle Libre", "JCGA295-T1730", "13-07-2021 15:06", "0", "132", ""],
    ["FreeStyle Libre", "JCGA295-T1730", "13-07-2021 15:22", "0", "117", ""],
    ["FreeStyle Libre", "JCGA295-T1730", "13-07-2021 16:00", "1", "", "140"],
  ];

  it("detecta la fila 2 (más columnas) como encabezado, no la fila 1 (metadatos)", () => {
    const idx = detectHeaderRowIndex(libreRawRows);
    expect(idx).toBe(1);
  });

  it("rowsToRecords descarta la fila de metadatos y arma los objetos correctamente", () => {
    const { headers, records } = rowsToRecords(libreRawRows, 1);
    expect(headers).toContain("Sello de tiempo del dispositivo");
    expect(headers).toContain("Historial de glucosa mg/dL");
    expect(records).toHaveLength(3);
    expect(records[0]["Historial de glucosa mg/dL"]).toBe("132");
  });

  it("detecta 'Historial de glucosa mg/dL' como columna principal y 'Escaneo de glucosa mg/dL' como respaldo", () => {
    const { headers, records } = rowsToRecords(libreRawRows, 1);
    const detected = detectColumns(headers);
    expect(detected.mapping.glucoseColumn).toBe("Historial de glucosa mg/dL");
    expect(detected.mapping.glucoseColumnFallback).toBe("Escaneo de glucosa mg/dL");
    expect(detected.mapping.datetimeColumn).toBe("Sello de tiempo del dispositivo");

    // Con esas columnas, normalizeRows debe leer las 3 filas — incluida la
    // de escaneo manual, que solo tiene la columna de respaldo llena.
    const result = normalizeRows(records, detected.mapping, "MGDL");
    expect(result.validRows).toHaveLength(3);
    expect(result.validRows[2].glucoseValue).toBe(140); // vino del respaldo
  });

  it("parsea fechas con guiones (DD-MM-YYYY), formato real de Libre", () => {
    const { records } = rowsToRecords(libreRawRows, 1);
    const result = normalizeRows(
      records,
      { datetimeColumn: "Sello de tiempo del dispositivo", glucoseColumn: "Historial de glucosa mg/dL" },
      "MGDL",
    );
    // La 3ra fila es solo-escaneo (sin columna de respaldo en este mapping
    // puntual, da error de glucosa vacía — eso es correcto y esperado).
    expect(result.validRows).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    const first = result.validRows[0].timestamp;
    expect(first.getFullYear()).toBe(2021);
    expect(first.getMonth()).toBe(6); // julio = índice 6
    expect(first.getDate()).toBe(13);
    expect(first.getHours()).toBe(15);
    expect(first.getMinutes()).toBe(6);
  });

  it("un CSV sin fila de metadatos (encabezado ya en la fila 1) sigue funcionando igual", () => {
    const plainRows = [
      ["Timestamp", "Glucose"],
      ["2026-09-01T08:00:00", "120"],
      ["2026-09-01T09:00:00", "130"],
    ];
    expect(detectHeaderRowIndex(plainRows)).toBe(0);
    const { records } = rowsToRecords(plainRows, 0);
    expect(records).toHaveLength(2);
  });

  it("no confunde 'Insulina...(unidades)' con la columna de unidad de glucosa (falso positivo real de Libre)", () => {
    const { headers } = rowsToRecords(libreRawRows, 1);
    const withInsulinColumn = [...headers, "Insulina de acción rápida (unidades)"];
    const detected = detectColumns(withInsulinColumn);
    expect(detected.mapping.unitColumn).toBeUndefined();
  });
});
