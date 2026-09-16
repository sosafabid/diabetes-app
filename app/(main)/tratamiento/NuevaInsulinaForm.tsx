"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TIPOS = [
  { value: "RAPID", label: "Rápida" },
  { value: "ULTRA_RAPID", label: "Ultrarrápida" },
  { value: "SHORT", label: "Corta" },
  { value: "INTERMEDIATE", label: "Intermedia" },
  { value: "LONG", label: "Larga" },
  { value: "OTHER", label: "Otra" },
];

const USOS = [
  { value: "BASAL", label: "Basal" },
  { value: "MEALS", label: "Comidas" },
  { value: "CORRECTION", label: "Corrección" },
  { value: "OTHER", label: "Otro" },
];

export default function NuevaInsulinaForm() {
  const router = useRouter();
  const [insulinName, setInsulinName] = useState("");
  const [insulinType, setInsulinType] = useState("RAPID");
  const [usage, setUsage] = useState("MEALS");
  const [prescribedDose, setPrescribedDose] = useState("");
  const [schedule, setSchedule] = useState("");
  const [carbRatio, setCarbRatio] = useState("");
  const [correctionFactor, setCorrectionFactor] = useState("");
  const [targetGlucoseLow, setTargetGlucoseLow] = useState("");
  const [targetGlucoseHigh, setTargetGlucoseHigh] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

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
          prescribedDose: prescribedDose ? Number(prescribedDose) : undefined,
          schedule: schedule || undefined,
          carbRatio: carbRatio ? Number(carbRatio) : undefined,
          correctionFactor: correctionFactor
            ? Number(correctionFactor)
            : undefined,
          targetGlucoseLow: targetGlucoseLow
            ? Number(targetGlucoseLow)
            : undefined,
          targetGlucoseHigh: targetGlucoseHigh
            ? Number(targetGlucoseHigh)
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la insulina.");
        return;
      }
      setInsulinName("");
      setPrescribedDose("");
      setSchedule("");
      setCarbRatio("");
      setCorrectionFactor("");
      setTargetGlucoseLow("");
      setTargetGlucoseHigh("");
      setOpen(false);
      router.refresh();
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="primary-button" onClick={() => setOpen(true)}>
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
        Uso principal
        <select value={usage} onChange={(e) => setUsage(e.target.value)}>
          {USOS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </label>

      {usage === "BASAL" && (
        <>
          <label>
            Dosis prescrita (U)
            <input
              type="number"
              step="0.5"
              value={prescribedDose}
              onChange={(e) => setPrescribedDose(e.target.value)}
            />
          </label>
          <label>
            Horario
            <input
              type="text"
              placeholder="p. ej. 21:00"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            />
          </label>
        </>
      )}

      {(usage === "MEALS" || usage === "CORRECTION") && (
        <>
          <p className="form-hint">
            Estos parámetros deben ser los indicados por tu profesional de
            salud — la app nunca los calcula por sí sola.
          </p>
          {usage === "MEALS" && (
            <label>
              Relación insulina/carbohidratos (g de carbohidratos por 1 U)
              <input
                type="number"
                step="0.1"
                value={carbRatio}
                onChange={(e) => setCarbRatio(e.target.value)}
              />
            </label>
          )}
          {usage === "CORRECTION" && (
            <>
              <label>
                Factor de corrección (cuánto baja 1 U tu glucosa)
                <input
                  type="number"
                  step="0.1"
                  value={correctionFactor}
                  onChange={(e) => setCorrectionFactor(e.target.value)}
                />
              </label>
              <label>
                Glucosa objetivo — mínimo
                <input
                  type="number"
                  value={targetGlucoseLow}
                  onChange={(e) => setTargetGlucoseLow(e.target.value)}
                />
              </label>
              <label>
                Glucosa objetivo — máximo
                <input
                  type="number"
                  value={targetGlucoseHigh}
                  onChange={(e) => setTargetGlucoseHigh(e.target.value)}
                />
              </label>
            </>
          )}
        </>
      )}

      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar insulina"}
        </button>
        <button type="button" className="secondary-button" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
