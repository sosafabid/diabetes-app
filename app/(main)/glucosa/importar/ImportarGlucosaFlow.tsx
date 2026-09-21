"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RowError {
  rowIndex: number;
  reasonEs: string;
}

interface AnalyzeResult {
  headers: string[];
  detectedMapping: {
    datetimeColumn?: string;
    dateColumn?: string;
    timeColumn?: string;
    glucoseColumn?: string;
    unitColumn?: string;
  };
  confidence: "auto" | "partial" | "none";
  totalRows: number;
  validRowCount: number;
  errorRowCount: number;
  newCount: number;
  duplicateCount: number;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  sample: { timestamp: string; glucoseValue: number; unit: string }[];
  errors: RowError[];
  errorsTruncated: boolean;
}

export default function ImportarGlucosaFlow() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);

  const [datetimeColumn, setDatetimeColumn] = useState("");
  const [timeColumn, setTimeColumn] = useState("");
  const [glucoseColumn, setGlucoseColumn] = useState("");
  const [unitColumn, setUnitColumn] = useState("");
  const [defaultUnit, setDefaultUnit] = useState<"MGDL" | "MMOLL">("MGDL");
  const [sourceType, setSourceType] = useState<"BLOOD" | "CGM" | "">("");
  const [deviceManufacturer, setDeviceManufacturer] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    status: string;
    importedRows: number;
    duplicateRows: number;
    errorRows: number;
  } | null>(null);

  function currentMapping() {
    return timeColumn
      ? { dateColumn: datetimeColumn, timeColumn, glucoseColumn, unitColumn: unitColumn || undefined }
      : { datetimeColumn, glucoseColumn, unitColumn: unitColumn || undefined };
  }

  async function runAnalyze(text: string, mapping?: ReturnType<typeof currentMapping>) {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/import/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: text, mapping, defaultUnit }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo analizar el archivo.");
        setAnalysis(null);
        return;
      }
      setAnalysis(data);
      if (!mapping) {
        // Primera pasada: usar lo que se detectó automáticamente.
        setDatetimeColumn(data.detectedMapping.datetimeColumn ?? data.detectedMapping.dateColumn ?? "");
        setTimeColumn(data.detectedMapping.timeColumn ?? "");
        setGlucoseColumn(data.detectedMapping.glucoseColumn ?? "");
        setUnitColumn(data.detectedMapping.unitColumn ?? "");
      }
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    const text = await selected.text();
    setCsvText(text);
    await runAnalyze(text);
  }

  async function handleMappingChange() {
    if (!csvText) return;
    await runAnalyze(csvText, currentMapping());
  }

  async function handleConfirm() {
    if (!file || !sourceType) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvText,
          mapping: currentMapping(),
          defaultUnit,
          sourceType,
          fileName: file.name,
          deviceManufacturer: deviceManufacturer || undefined,
          deviceModel: deviceModel || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo importar.");
        return;
      }
      setResult(data);
      router.refresh();
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setConfirming(false);
    }
  }

  function reset() {
    setFile(null);
    setCsvText("");
    setAnalysis(null);
    setResult(null);
    setSourceType("");
    setError(null);
  }

  if (result) {
    return (
      <div className="card-form">
        <p style={{ margin: 0, fontWeight: 600 }}>
          {result.status === "FAILED" ? "No se importó nada" : "Importación completada"}
        </p>
        <ul className="card-details">
          <li>{result.importedRows} lecturas nuevas importadas</li>
          <li>{result.duplicateRows} duplicados omitidos (ya existían)</li>
          <li>{result.errorRows} filas con error, omitidas</li>
        </ul>
        <button type="button" onClick={reset}>
          Importar otro archivo
        </button>
      </div>
    );
  }

  return (
    <div className="card-form">
      <p style={{ margin: 0, fontWeight: 600 }}>1. Elige el archivo CSV</p>
      <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
      {analyzing && <p className="form-hint">Analizando archivo...</p>}
      {error && <p className="form-error">{error}</p>}

      {analysis && (
        <>
          <p style={{ margin: "1rem 0 0", fontWeight: 600 }}>2. Confirma las columnas</p>
          <p className="form-hint" style={{ margin: 0 }}>
            {analysis.confidence === "auto"
              ? "Detectamos las columnas automáticamente — revísalas antes de continuar."
              : "No pudimos detectar todo automáticamente — selecciona las columnas correctas."}
          </p>

          <label>
            Columna de fecha (o fecha y hora juntas)
            <select
              value={datetimeColumn}
              onChange={(e) => {
                setDatetimeColumn(e.target.value);
                handleMappingChange();
              }}
            >
              <option value="">Sin especificar</option>
              {analysis.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>

          <label>
            Columna de hora (opcional, si la fecha no incluye hora)
            <select
              value={timeColumn}
              onChange={(e) => {
                setTimeColumn(e.target.value);
                handleMappingChange();
              }}
            >
              <option value="">No aplica (la fecha ya incluye la hora)</option>
              {analysis.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>

          <label>
            Columna de glucosa
            <select
              value={glucoseColumn}
              onChange={(e) => {
                setGlucoseColumn(e.target.value);
                handleMappingChange();
              }}
            >
              <option value="">Sin especificar</option>
              {analysis.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>

          <label>
            Columna de unidad (opcional, si el archivo la trae por fila)
            <select
              value={unitColumn}
              onChange={(e) => {
                setUnitColumn(e.target.value);
                handleMappingChange();
              }}
            >
              <option value="">No aplica</option>
              {analysis.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="source-toggle">
            <legend>Unidad por defecto (si el archivo no trae unidad por fila)</legend>
            <label className={`source-option ${defaultUnit === "MGDL" ? "selected" : ""}`}>
              <input
                type="radio"
                checked={defaultUnit === "MGDL"}
                onChange={() => {
                  setDefaultUnit("MGDL");
                  handleMappingChange();
                }}
              />
              mg/dL
            </label>
            <label className={`source-option ${defaultUnit === "MMOLL" ? "selected" : ""}`}>
              <input
                type="radio"
                checked={defaultUnit === "MMOLL"}
                onChange={() => {
                  setDefaultUnit("MMOLL");
                  handleMappingChange();
                }}
              />
              mmol/L
            </label>
          </fieldset>

          <fieldset className="source-toggle">
            <legend>Fuente de TODO este archivo (obligatorio — nunca se adivina)</legend>
            <label className={`source-option ${sourceType === "BLOOD" ? "selected" : ""}`}>
              <input
                type="radio"
                checked={sourceType === "BLOOD"}
                onChange={() => setSourceType("BLOOD")}
              />
              🩸 Sangre / glucómetro
            </label>
            <label className={`source-option ${sourceType === "CGM" ? "selected" : ""}`}>
              <input type="radio" checked={sourceType === "CGM"} onChange={() => setSourceType("CGM")} />
              📡 CGM
            </label>
          </fieldset>

          <label>
            Fabricante del dispositivo (opcional)
            <input
              type="text"
              placeholder="p. ej. Abbott, Dexcom"
              value={deviceManufacturer}
              onChange={(e) => setDeviceManufacturer(e.target.value)}
            />
          </label>
          <label>
            Modelo del dispositivo (opcional)
            <input
              type="text"
              placeholder="p. ej. FreeStyle Libre 3"
              value={deviceModel}
              onChange={(e) => setDeviceModel(e.target.value)}
            />
          </label>

          <p style={{ margin: "1rem 0 0", fontWeight: 600 }}>3. Vista previa</p>
          <ul className="card-details">
            <li>{analysis.totalRows} filas en el archivo</li>
            <li>{analysis.validRowCount} filas válidas</li>
            <li>{analysis.errorRowCount} filas con error (se omiten, no se reparan)</li>
            <li>{analysis.newCount} lecturas nuevas se importarían</li>
            <li>{analysis.duplicateCount} duplicados se omitirían (ya existen o se repiten en el archivo)</li>
            {analysis.dateRangeStart && analysis.dateRangeEnd && (
              <li>
                Rango: {new Date(analysis.dateRangeStart).toLocaleDateString("es-CR")} –{" "}
                {new Date(analysis.dateRangeEnd).toLocaleDateString("es-CR")}
              </li>
            )}
          </ul>

          {analysis.sample.length > 0 && (
            <ul className="event-list">
              {analysis.sample.map((s, i) => (
                <li key={i} className="event-item">
                  <span className="event-value">{s.glucoseValue}</span>
                  <span>{s.unit === "MGDL" ? "mg/dL" : "mmol/L"}</span>
                  <span className="event-time">
                    {new Date(s.timestamp).toLocaleString("es-CR")}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {analysis.errors.length > 0 && (
            <>
              <button type="button" className="secondary-button" onClick={() => setShowErrors((s) => !s)}>
                {showErrors ? "Ocultar errores" : `Ver ${analysis.errorRowCount} filas con error`}
              </button>
              {showErrors && (
                <ul className="card-details">
                  {analysis.errors.map((err, i) => (
                    <li key={i}>
                      Fila {err.rowIndex}: {err.reasonEs}
                    </li>
                  ))}
                  {analysis.errorsTruncated && <li>...y más (se muestran las primeras 100)</li>}
                </ul>
              )}
            </>
          )}

          <p className="form-hint">
            Stay Alive ILU no modifica los valores originales — las filas con error se omiten y se
            reportan, nunca se "reparan" inventando un dato.
          </p>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!sourceType || !glucoseColumn || !datetimeColumn || confirming || analysis.newCount === 0}
          >
            {confirming ? "Importando..." : `Importar ${analysis.newCount} lecturas`}
          </button>
        </>
      )}
    </div>
  );
}
