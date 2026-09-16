"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PendingEvent {
  id: string;
  glucoseReadingId: string;
  glucoseValue: number;
  plan: {
    fastCarbsG: number;
    productName: string | null;
    reassessMinutes: number;
    glucagonAvailable: boolean;
    glucagonInstructions: string | null;
    emergencyInstructions: string | null;
  } | null;
}

export default function AlertaHipoglucemia({ event }: { event: PendingEvent }) {
  const router = useRouter();
  const [mode, setMode] = useState<"inicial" | "tratar" | "severo">("inicial");
  const [carbs, setCarbs] = useState(String(event.plan?.fastCarbsG ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function registrarTratamiento(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/glucosa/${event.glucoseReadingId}/tratar-hipoglucemia`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ carbsConsumedG: Number(carbs) }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo registrar el tratamiento.");
        return;
      }
      router.refresh();
    } catch {
      setError("Ocurrió un error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  async function marcarSevero() {
    setLoading(true);
    try {
      await fetch(`/api/glucosa/${event.glucoseReadingId}/hipoglucemia-severa`, {
        method: "POST",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (mode === "severo") {
    return (
      <div className="hypo-alert hypo-alert-severe">
        <h3>🚨 Hipoglucemia severa</h3>
        <p>No intentes calcular carbohidratos ni insulina en esta situación.</p>
        {event.plan?.glucagonAvailable && (
          <div>
            <strong>Glucagón:</strong>
            <p>{event.plan.glucagonInstructions || "Sin instrucciones configuradas."}</p>
          </div>
        )}
        <div>
          <strong>Instrucciones de emergencia:</strong>
          <p>
            {event.plan?.emergencyInstructions ||
              "No configuraste instrucciones de emergencia. Busca asistencia médica de inmediato."}
          </p>
        </div>
        <button type="button" onClick={marcarSevero} disabled={loading}>
          {loading ? "Registrando..." : "Ya busqué ayuda — registrar evento"}
        </button>
      </div>
    );
  }

  if (mode === "tratar") {
    return (
      <form onSubmit={registrarTratamiento} className="hypo-alert">
        <h3>Registrar tratamiento</h3>
        <label>
          Gramos de carbohidratos consumidos
          <input
            type="number"
            required
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
          />
        </label>
        {event.plan && (
          <p className="form-hint">
            Vuelve a medir en {event.plan.reassessMinutes} minutos.
          </p>
        )}
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Confirmar tratamiento"}
        </button>
      </form>
    );
  }

  return (
    <div className="hypo-alert">
      <h3>⚠️ Glucosa baja — {event.glucoseValue} mg/dL</h3>
      {event.plan ? (
        <p>
          Según tu plan personal: consume <strong>{event.plan.fastCarbsG} g</strong>{" "}
          de carbohidratos de acción rápida
          {event.plan.productName && <> ({event.plan.productName})</>}. Vuelve a
          medir en {event.plan.reassessMinutes} minutos.
        </p>
      ) : (
        <p>
          Todavía no has configurado tu plan personal de hipoglucemia. Ve a
          &quot;Mi tratamiento&quot; para configurarlo con tu profesional de salud.
        </p>
      )}
      <div className="form-actions">
        <button type="button" onClick={() => setMode("tratar")}>
          Registrar tratamiento
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setMode("severo")}
        >
          No puedo tragar / Emergencia
        </button>
      </div>
    </div>
  );
}