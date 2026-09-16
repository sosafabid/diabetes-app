"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  lowThreshold: number;
  fastCarbsG: number;
  reassessMinutes: number;
  productName: string | null;
  carbsPerProductUnit: number | null;
  glucagonAvailable: boolean;
  glucagonInstructions: string | null;
  emergencyInstructions: string | null;
}

export default function PlanHipoglucemiaForm({
  currentPlan,
}: {
  currentPlan: Plan | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!currentPlan);
  const [lowThreshold, setLowThreshold] = useState(
    String(currentPlan?.lowThreshold ?? 70),
  );
  const [fastCarbsG, setFastCarbsG] = useState(
    String(currentPlan?.fastCarbsG ?? 15),
  );
  const [reassessMinutes, setReassessMinutes] = useState(
    String(currentPlan?.reassessMinutes ?? 15),
  );
  const [productName, setProductName] = useState(currentPlan?.productName ?? "");
  const [carbsPerProductUnit, setCarbsPerProductUnit] = useState(
    currentPlan?.carbsPerProductUnit != null
      ? String(currentPlan.carbsPerProductUnit)
      : "",
  );
  const [glucagonAvailable, setGlucagonAvailable] = useState(
    currentPlan?.glucagonAvailable ?? false,
  );
  const [glucagonInstructions, setGlucagonInstructions] = useState(
    currentPlan?.glucagonInstructions ?? "",
  );
  const [emergencyInstructions, setEmergencyInstructions] = useState(
    currentPlan?.emergencyInstructions ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/tratamiento/hipoglucemia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lowThreshold: Number(lowThreshold),
          fastCarbsG: Number(fastCarbsG),
          reassessMinutes: Number(reassessMinutes),
          productName: productName || undefined,
          carbsPerProductUnit: carbsPerProductUnit
            ? Number(carbsPerProductUnit)
            : undefined,
          glucagonAvailable,
          glucagonInstructions: glucagonInstructions || undefined,
          emergencyInstructions: emergencyInstructions || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar el plan.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!editing && currentPlan) {
    return (
      <div className="card">
        <h3>🚨 Mi plan de hipoglucemia</h3>
        <ul className="card-details">
          <li>Umbral: {currentPlan.lowThreshold} mg/dL</li>
          <li>Carbohidratos para tratarla: {currentPlan.fastCarbsG} g</li>
          <li>Reevaluar en: {currentPlan.reassessMinutes} min</li>
          {currentPlan.productName && (
            <li>Producto habitual: {currentPlan.productName}</li>
          )}
          {currentPlan.glucagonAvailable && <li>Glucagón disponible</li>}
        </ul>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setEditing(true)}
        >
          Editar plan
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-form">
      <h3>🚨 Mi plan de hipoglucemia</h3>
      <p className="form-hint">
        Configura esto según lo indicado por tu profesional de salud. La app
        nunca calcula estos valores por sí sola.
      </p>
      <label>
        Umbral de glucosa baja (mg/dL)
        <input
          type="number"
          required
          value={lowThreshold}
          onChange={(e) => setLowThreshold(e.target.value)}
        />
      </label>
      <label>
        Carbohidratos de acción rápida para tratarla (g)
        <input
          type="number"
          required
          value={fastCarbsG}
          onChange={(e) => setFastCarbsG(e.target.value)}
        />
      </label>
      <label>
        Minutos recomendados para volver a medir
        <input
          type="number"
          required
          value={reassessMinutes}
          onChange={(e) => setReassessMinutes(e.target.value)}
        />
      </label>
      <label>
        Producto habitual (opcional)
        <input
          type="text"
          placeholder="p. ej. Tabletas de glucosa"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
      </label>
      <label>
        Carbohidratos por unidad del producto (opcional)
        <input
          type="number"
          value={carbsPerProductUnit}
          onChange={(e) => setCarbsPerProductUnit(e.target.value)}
        />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={glucagonAvailable}
          onChange={(e) => setGlucagonAvailable(e.target.checked)}
        />
        Tengo glucagón disponible
      </label>
      {glucagonAvailable && (
        <label>
          Instrucciones de glucagón
          <textarea
            value={glucagonInstructions}
            onChange={(e) => setGlucagonInstructions(e.target.value)}
            rows={3}
          />
        </label>
      )}
      <label>
        Instrucciones para hipoglucemia severa (inconsciente / no puede tragar)
        <textarea
          value={emergencyInstructions}
          onChange={(e) => setEmergencyInstructions(e.target.value)}
          rows={3}
          placeholder="p. ej. Llamar al 911, contactar a..."
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar plan"}
        </button>
        {currentPlan && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => setEditing(false)}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}