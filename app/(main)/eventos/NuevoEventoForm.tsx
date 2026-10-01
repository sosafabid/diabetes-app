"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevoEventoForm() {
  const router = useRouter();
  const [open, setOpen] = useState<null | "LOW" | "HIGH">(null);
  const [glucoseValue, setGlucoseValue] = useState("");
  const [measurementSource, setMeasurementSource] = useState<"BLOOD" | "CGM" | "">("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setOpen(null);
    setGlucoseValue("");
    setMeasurementSource("");
    setSymptoms("");
    setNotes("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!measurementSource) {
      setError("Indica cómo mediste la glucosa.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/eventos-glucosa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: open,
          glucoseValue: glucoseValue ? Number(glucoseValue) : undefined,
          measurementSource,
          symptoms: symptoms || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar el evento.");
        return;
      }
      router.push(`/eventos/${data.event.id}`);
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button type="button" style={{ background: "var(--color-warning)" }} onClick={() => setOpen("LOW")}>
          🚨 Seguir una glucosa baja
        </button>
        <button type="button" style={{ background: "var(--color-danger)" }} onClick={() => setOpen("HIGH")}>
          🚨 Seguir una glucosa alta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-form">
      <p style={{ margin: 0, fontWeight: 600 }}>
        Nuevo evento de glucosa {open === "LOW" ? "baja" : "alta"}
      </p>
      <label>
        Glucosa inicial (opcional, si la tienes a mano)
        <input
          type="number"
          value={glucoseValue}
          onChange={(e) => setGlucoseValue(e.target.value)}
          placeholder="mg/dL"
        />
      </label>
      <fieldset className="source-toggle">
        <legend>Método de medición</legend>
        <label className={`source-option ${measurementSource === "BLOOD" ? "selected" : ""}`}>
          <input type="radio" checked={measurementSource === "BLOOD"} onChange={() => setMeasurementSource("BLOOD")} />
          🩸 Sangre
        </label>
        <label className={`source-option ${measurementSource === "CGM" ? "selected" : ""}`}>
          <input type="radio" checked={measurementSource === "CGM"} onChange={() => setMeasurementSource("CGM")} />
          📡 CGM
        </label>
      </fieldset>
      <label>
        Síntomas (opcional)
        <input type="text" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
      </label>
      <label>
        Notas — insulina reciente, actividad reciente, etc. (opcional)
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="submit" disabled={loading}>
          {loading ? "Iniciando..." : "Iniciar evento"}
        </button>
        <button type="button" className="secondary-button" onClick={reset}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
