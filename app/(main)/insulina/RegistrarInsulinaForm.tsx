"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Regimen {
  id: string;
  insulinName: string;
  usage: string;
}

const PROPOSITOS = [
  { value: "MEAL", label: "Comida" },
  { value: "CORRECTION", label: "Corrección" },
  { value: "BASAL", label: "Basal" },
  { value: "OTHER", label: "Otro" },
];

export default function RegistrarInsulinaForm({
  regimens,
}: {
  regimens: Regimen[];
}) {
  const router = useRouter();
  const [insulinRegimenId, setInsulinRegimenId] = useState(
    regimens[0]?.id ?? "",
  );
  const [dose, setDose] = useState("");
  const [purpose, setPurpose] = useState("MEAL");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (regimens.length === 0) {
    return (
      <div className="empty-state">
        <p>
          Todavía no has registrado ninguna insulina en tu tratamiento.
          Ve a &quot;Mi tratamiento&quot; para agregarla antes de registrar dosis.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/insulina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insulinRegimenId,
          dose: Number(dose),
          purpose,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la dosis.");
        return;
      }
      setDose("");
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
        Insulina
        <select
          value={insulinRegimenId}
          onChange={(e) => setInsulinRegimenId(e.target.value)}
        >
          {regimens.map((r) => (
            <option key={r.id} value={r.id}>
              {r.insulinName}
            </option>
          ))}
        </select>
      </label>
      <label>
        Dosis (U)
        <input
          type="number"
          required
          step="0.5"
          value={dose}
          onChange={(e) => setDose(e.target.value)}
        />
      </label>
      <label>
        Propósito
        <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
          {PROPOSITOS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <p className="form-hint">
        Este registro es manual. El cálculo asistido de dosis (con
        SafetyEngine) todavía no está conectado a esta pantalla — ver
        pendientes en el README.
      </p>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Registrar insulina"}
      </button>
    </form>
  );
}
