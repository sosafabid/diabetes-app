"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TIPOS = [
  { value: "WALKING", label: "Caminar" },
  { value: "RUNNING", label: "Correr" },
  { value: "CYCLING", label: "Ciclismo" },
  { value: "WEIGHTS", label: "Pesas" },
  { value: "HIIT", label: "HIIT" },
  { value: "SWIMMING", label: "Natación" },
  { value: "SPORT", label: "Deporte" },
  { value: "OTHER", label: "Otro" },
];

const INTENSIDADES = [
  { value: "LIGHT", label: "Ligera" },
  { value: "MODERATE", label: "Moderada" },
  { value: "INTENSE", label: "Intensa" },
];

export default function RegistrarActividadForm() {
  const router = useRouter();
  const [type, setType] = useState("WALKING");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("MODERATE");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/actividad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, duration: Number(duration), intensity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la actividad.");
        return;
      }
      setDuration("");
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
        Tipo
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Duración (minutos)
        <input
          type="number"
          required
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </label>
      <label>
        Intensidad
        <select value={intensity} onChange={(e) => setIntensity(e.target.value)}>
          {INTENSIDADES.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Registrar actividad"}
      </button>
    </form>
  );
}
