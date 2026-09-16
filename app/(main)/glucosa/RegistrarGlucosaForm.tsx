"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CONTEXTOS = [
  { value: "", label: "Sin especificar" },
  { value: "BEFORE_MEAL", label: "Antes de comer" },
  { value: "AFTER_MEAL", label: "Después de comer" },
  { value: "BEFORE_EXERCISE", label: "Antes de ejercicio" },
  { value: "AFTER_EXERCISE", label: "Después de ejercicio" },
  { value: "BEFORE_SLEEP", label: "Antes de dormir" },
  { value: "SUSPECTED_HYPO", label: "Sospecha de glucosa baja" },
  { value: "OTHER", label: "Otro" },
];

const TENDENCIAS = [
  { value: "", label: "Sin dato de tendencia" },
  { value: "STABLE", label: "→ Estable" },
  { value: "RISING", label: "↗ Subiendo" },
  { value: "RISING_FAST", label: "↗↗ Subiendo rápidamente" },
  { value: "FALLING", label: "↘ Bajando" },
  { value: "FALLING_FAST", label: "↘↘ Bajando rápidamente" },
];

export default function RegistrarGlucosaForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [source, setSource] = useState<"BLOOD" | "CGM" | "">("");
  const [trend, setTrend] = useState("");
  const [context, setContext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!source) {
      setError("Debes indicar si la medición fue por sangre o por CGM.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/glucosa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          glucoseValue: Number(value),
          unit: "MGDL",
          measurementSource: source,
          cgmTrend: source === "CGM" && trend ? trend : undefined,
          context: context || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la lectura.");
        return;
      }
      setValue("");
      setSource("");
      setTrend("");
      setContext("");
      router.refresh();
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-form">
      <label>
        Valor de glucosa (mg/dL)
        <input
          type="number"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>

      <fieldset className="source-toggle">
        <legend>Fuente de medición (obligatorio)</legend>
        <label className={`source-option ${source === "BLOOD" ? "selected" : ""}`}>
          <input
            type="radio"
            name="source"
            checked={source === "BLOOD"}
            onChange={() => setSource("BLOOD")}
          />
          🩸 Sangre / glucómetro
        </label>
        <label className={`source-option ${source === "CGM" ? "selected" : ""}`}>
          <input
            type="radio"
            name="source"
            checked={source === "CGM"}
            onChange={() => setSource("CGM")}
          />
          📡 CGM
        </label>
      </fieldset>

      {source === "CGM" && (
        <label>
          Tendencia
          <select value={trend} onChange={(e) => setTrend(e.target.value)}>
            {TENDENCIAS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        Contexto
        <select value={context} onChange={(e) => setContext(e.target.value)}>
          {CONTEXTOS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Registrar glucosa"}
      </button>
    </form>
  );
}
