"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CARBS_RANGES, type CarbsRangeCode } from "../../../src/domain/CarbsRange";

const TIPOS = [
  { value: "BREAKFAST", label: "Desayuno" },
  { value: "LUNCH", label: "Almuerzo" },
  { value: "DINNER", label: "Cena" },
  { value: "SNACK", label: "Merienda" },
  { value: "OTHER", label: "Otra" },
];

export default function RegistrarComidaForm() {
  const router = useRouter();
  const [mealType, setMealType] = useState("BREAKFAST");
  const [carbsMode, setCarbsMode] = useState<"range" | "exact">("range");
  const [selectedRange, setSelectedRange] = useState<CarbsRangeCode | "">("");
  const [exactGrams, setExactGrams] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rangeDefinition = CARBS_RANGES.find((r) => r.code === selectedRange);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (carbsMode === "range" && !selectedRange) {
      setError("Elige un rango de carbohidratos.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/comidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          carbsMode === "range"
            ? { mealType, carbsMode: "range", carbsRange: selectedRange }
            : { mealType, carbsMode: "exact", carbsGDirect: Number(exactGrams) },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la comida.");
        return;
      }
      setSelectedRange("");
      setExactGrams("");
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
        Tipo de comida
        <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="source-toggle">
        <legend>Carbohidratos</legend>
        <label className={`source-option ${carbsMode === "range" ? "selected" : ""}`}>
          <input type="radio" checked={carbsMode === "range"} onChange={() => setCarbsMode("range")} />
          Elegir rango
        </label>
        <label className={`source-option ${carbsMode === "exact" ? "selected" : ""}`}>
          <input type="radio" checked={carbsMode === "exact"} onChange={() => setCarbsMode("exact")} />
          Ingresar cantidad exacta
        </label>
      </fieldset>

      {carbsMode === "range" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "0.5rem" }}>
            {CARBS_RANGES.map((r) => (
              <button
                type="button"
                key={r.code}
                onClick={() => setSelectedRange(r.code)}
                className={selectedRange === r.code ? undefined : "secondary-button"}
              >
                {r.labelEs}
              </button>
            ))}
          </div>
          {rangeDefinition && (
            <div className="empty-state" style={{ textAlign: "left" }}>
              <p style={{ margin: "0 0 0.4rem", fontWeight: 600 }}>Ejemplos orientativos de {rangeDefinition.labelEs}:</p>
              <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                {rangeDefinition.examplesEs.map((ex, i) => (
                  <li key={i} style={{ fontSize: "0.85rem" }}>
                    {ex}
                  </li>
                ))}
              </ul>
              <p className="form-hint" style={{ margin: "0.5rem 0 0" }}>
                Son ejemplos aproximados — el total real depende de la porción y la preparación, no
                un valor nutricional exacto.
              </p>
            </div>
          )}
        </>
      ) : (
        <label>
          Carbohidratos (gramos)
          <input
            type="number"
            required
            step="0.1"
            value={exactGrams}
            onChange={(e) => setExactGrams(e.target.value)}
          />
        </label>
      )}

      <p className="form-hint">
        Construir la comida a partir de alimentos y analizar por foto todavía
        no están disponibles — función próximamente disponible.
      </p>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Registrar comida"}
      </button>
    </form>
  );
}
