"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPCIONES = [
  { value: "LOW", emoji: "😌", label: "Tranquilo/a" },
  { value: "MODERATE", emoji: "😐", label: "Normal" },
  { value: "HIGH", emoji: "😣", label: "Estresado/a" },
];

export default function RegistrarBienestarForm() {
  const router = useRouter();
  const [reportedStress, setReportedStress] = useState<string | null>(null);
  const [sleepHours, setSleepHours] = useState("");
  const [isMenstruating, setIsMenstruating] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!reportedStress) {
      setError("Elige cómo te sientes.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bienestar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedStress,
          sleepHours: sleepHours ? Number(sleepHours) : undefined,
          isMenstruating: isMenstruating || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setReportedStress(null);
      setSleepHours("");
      setIsMenstruating(false);
      setNotes("");
      router.refresh();
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-form">
      <p style={{ margin: 0, fontWeight: 600 }}>¿Cómo te sientes ahora?</p>
      <div className="mood-options">
        {OPCIONES.map((op) => (
          <button
            key={op.value}
            type="button"
            className={`mood-option ${reportedStress === op.value ? "selected" : ""}`}
            onClick={() => setReportedStress(op.value)}
          >
            <span className="mood-emoji">{op.emoji}</span>
            {op.label}
          </button>
        ))}
      </div>
      <label>
        Horas de sueño anoche (opcional)
        <input
          type="number"
          step="0.5"
          min="0"
          max="24"
          placeholder="p. ej. 6.5"
          value={sleepHours}
          onChange={(e) => setSleepHours(e.target.value)}
        />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={isMenstruating}
          onChange={(e) => setIsMenstruating(e.target.checked)}
        />
        Hoy estoy en período menstrual (opcional)
      </label>
      <label>
        Nota (opcional)
        <input
          type="text"
          placeholder="p. ej. día pesado en el trabajo"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Registrar"}
      </button>
    </form>
  );
}