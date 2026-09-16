"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [carbs, setCarbs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/comidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealType, carbsGDirect: Number(carbs) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la comida.");
        return;
      }
      setCarbs("");
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
      <label>
        Carbohidratos (gramos)
        <input
          type="number"
          required
          step="0.1"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
        />
      </label>
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
