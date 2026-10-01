"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TIPOS = [
  { value: "RAPID", label: "Rápida" },
  { value: "ULTRA_RAPID", label: "Ultrarrápida" },
  { value: "SHORT", label: "Corta" },
  { value: "INTERMEDIATE", label: "Intermedia" },
  { value: "LONG", label: "Larga / basal" },
  { value: "PREMIXED", label: "Premezclada" },
  { value: "OTHER", label: "Otra" },
];

const USOS = [
  { value: "BASAL", label: "Basal" },
  { value: "MEALS", label: "Comidas" },
  { value: "CORRECTION", label: "Corrección" },
  { value: "PREMIXED", label: "Premezclada" },
  { value: "OTHER", label: "Otro" },
];

const MODALIDADES = [
  { value: "MANUAL_ONLY", label: "Solo registro manual (sin pauta de cálculo)" },
  { value: "CARB_RATIO", label: "Relación insulina/carbohidratos" },
  { value: "TIERED", label: "Esquema progresivo por tramos" },
  { value: "FIXED_DOSE", label: "Dosis fija por comida/horario" },
];

const FUENTES = [
  { value: "DECLARED", label: "La introduzco yo (paciente)" },
  { value: "CONFIRMED_BY_PROFESSIONAL", label: "Confirmada por mi profesional de salud" },
  { value: "PENDING_REVIEW", label: "Pendiente de que la revise mi profesional" },
];

interface TierRow {
  order: number;
  carbsFromG: string;
  carbsToG: string;
  units: string;
  isCumulative: boolean;
  description: string;
}

export default function NuevaInsulinaForm() {
  const router = useRouter();
  const [insulinName, setInsulinName] = useState("");
  const [insulinType, setInsulinType] = useState("RAPID");
  const [usage, setUsage] = useState("MEALS");
  const [brandOrActiveIngredient, setBrandOrActiveIngredient] = useState("");
  const [concentration, setConcentration] = useState("");
  const [modality, setModality] = useState("MANUAL_ONLY");
  const [source, setSource] = useState("DECLARED");
  const [professionalName, setProfessionalName] = useState("");
  const [prescribedDose, setPrescribedDose] = useState("");
  const [schedule, setSchedule] = useState("");
  const [carbRatio, setCarbRatio] = useState("");
  const [tiers, setTiers] = useState<TierRow[]>([
    { order: 1, carbsFromG: "0", carbsToG: "", units: "", isCumulative: false, description: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [professionalNotes, setProfessionalNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  function addTierRow() {
    setTiers((prev) => [
      ...prev,
      { order: prev.length + 1, carbsFromG: "", carbsToG: "", units: "", isCumulative: prev[0]?.isCumulative ?? false, description: "" },
    ]);
  }
  function removeTierRow(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index).map((t, i) => ({ ...t, order: i + 1 })));
  }
  function updateTier(index: number, patch: Partial<TierRow>) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function reset() {
    setInsulinName("");
    setBrandOrActiveIngredient("");
    setConcentration("");
    setModality("MANUAL_ONLY");
    setSource("DECLARED");
    setProfessionalName("");
    setPrescribedDose("");
    setSchedule("");
    setCarbRatio("");
    setTiers([{ order: 1, carbsFromG: "0", carbsToG: "", units: "", isCumulative: false, description: "" }]);
    setNotes("");
    setProfessionalNotes("");
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/tratamiento/insulinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insulinName,
          insulinType,
          usage,
          brandOrActiveIngredient: brandOrActiveIngredient || undefined,
          concentration: concentration || undefined,
          modality,
          source,
          professionalName: professionalName || undefined,
          prescribedDose:
            modality === "FIXED_DOSE" && prescribedDose ? Number(prescribedDose) : undefined,
          schedule: schedule || undefined,
          carbRatio: modality === "CARB_RATIO" && carbRatio ? Number(carbRatio) : undefined,
          notes: notes || undefined,
          professionalNotes: professionalNotes || undefined,
          tiers:
            modality === "TIERED"
              ? tiers.map((t) => ({
                  order: t.order,
                  carbsFromG: Number(t.carbsFromG),
                  carbsToG: t.carbsToG === "" ? null : Number(t.carbsToG),
                  units: Number(t.units),
                  isCumulative: t.isCumulative,
                  description: t.description || undefined,
                }))
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la insulina.");
        return;
      }
      reset();
      router.refresh();
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}>
        + Agregar insulina
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-form">
      <label>
        Nombre de la insulina
        <input
          type="text"
          required
          placeholder="p. ej. Glargina, Lispro"
          value={insulinName}
          onChange={(e) => setInsulinName(e.target.value)}
        />
      </label>
      <label>
        Tipo
        <select value={insulinType} onChange={(e) => setInsulinType(e.target.value)}>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Uso principal (finalidad declarada)
        <select value={usage} onChange={(e) => setUsage(e.target.value)}>
          {USOS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Marca o principio activo (opcional)
        <input
          type="text"
          value={brandOrActiveIngredient}
          onChange={(e) => setBrandOrActiveIngredient(e.target.value)}
        />
      </label>
      <label>
        Concentración (opcional)
        <input
          type="text"
          placeholder="p. ej. U-100"
          value={concentration}
          onChange={(e) => setConcentration(e.target.value)}
        />
      </label>
      <label>
        Horario / franja (opcional — útil si tienes varias insulinas o pautas distintas por momento del día)
        <input
          type="text"
          placeholder="p. ej. 21:00, Mañana, Con cada comida"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
        />
      </label>

      <p className="form-hint" style={{ marginTop: "0.5rem" }}>
        Lo de abajo es solo para <strong>guardar tu pauta como referencia</strong> — la app nunca
        calcula ni recomienda una dosis con esto.
      </p>

      <label>
        Modalidad de la pauta
        <select value={modality} onChange={(e) => setModality(e.target.value)}>
          {MODALIDADES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      {modality === "CARB_RATIO" && (
        <label>
          Relación insulina/carbohidratos (gramos de carbohidratos por 1 U)
          <input type="number" step="0.1" value={carbRatio} onChange={(e) => setCarbRatio(e.target.value)} />
        </label>
      )}

      {modality === "FIXED_DOSE" && (
        <label>
          Dosis prescrita (U)
          <input
            type="number"
            step="0.5"
            value={prescribedDose}
            onChange={(e) => setPrescribedDose(e.target.value)}
          />
        </label>
      )}

      {modality === "TIERED" && (
        <div className="card-form" style={{ background: "var(--color-bg)" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Tabla de tramos</p>
          <fieldset className="source-toggle">
            <legend>¿Cómo se aplica la tabla?</legend>
            <label className={`source-option ${!tiers[0]?.isCumulative ? "selected" : ""}`}>
              <input
                type="radio"
                checked={!tiers[0]?.isCumulative}
                onChange={() => setTiers((prev) => prev.map((t) => ({ ...t, isCumulative: false })))}
              />
              Dosis por intervalo total
            </label>
            <label className={`source-option ${tiers[0]?.isCumulative ? "selected" : ""}`}>
              <input
                type="radio"
                checked={tiers[0]?.isCumulative ?? false}
                onChange={() => setTiers((prev) => prev.map((t) => ({ ...t, isCumulative: true })))}
              />
              Dosis acumulativa por cada tramo
            </label>
          </fieldset>

          {tiers.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
              <span className="form-hint">Tramo {t.order}:</span>
              <input
                type="number"
                placeholder="Desde (g)"
                value={t.carbsFromG}
                onChange={(e) => updateTier(i, { carbsFromG: e.target.value })}
                style={{ width: 90 }}
              />
              <span>–</span>
              <input
                type="number"
                placeholder="Hasta (g), vacío = sin tope"
                value={t.carbsToG}
                onChange={(e) => updateTier(i, { carbsToG: e.target.value })}
                style={{ width: 130 }}
              />
              <span>→</span>
              <input
                type="number"
                placeholder="U"
                step="0.5"
                value={t.units}
                onChange={(e) => updateTier(i, { units: e.target.value })}
                style={{ width: 70 }}
              />
              <span className="form-hint">U</span>
              {tiers.length > 1 && (
                <button type="button" className="secondary-button" onClick={() => removeTierRow(i)}>
                  Quitar
                </button>
              )}
            </div>
          ))}
          <button type="button" className="secondary-button" onClick={addTierRow}>
            + Agregar tramo
          </button>
        </div>
      )}

      <label>
        Procedencia de esta pauta
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          {FUENTES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      {source === "CONFIRMED_BY_PROFESSIONAL" && (
        <label>
          Nombre del profesional (opcional)
          <input type="text" value={professionalName} onChange={(e) => setProfessionalName(e.target.value)} />
        </label>
      )}

      <label>
        Tus notas (opcional)
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </label>
      <label>
        Notas de tu profesional de salud (opcional)
        <textarea value={professionalNotes} onChange={(e) => setProfessionalNotes(e.target.value)} rows={2} />
      </label>

      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar insulina"}
        </button>
        <button type="button" className="secondary-button" onClick={reset}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
