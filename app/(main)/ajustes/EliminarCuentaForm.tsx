"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CONFIRM_WORD = "ELIMINAR";

export default function EliminarCuentaForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = password.length > 0 && confirmText === CONFIRM_WORD;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;

    setLoading(true);
    try {
      const res = await fetch("/api/cuenta", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo eliminar la cuenta.");
        return;
      }
      router.push("/login");
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-form" style={{ borderColor: "var(--color-danger)" }}>
      <p style={{ margin: 0, fontWeight: 600, color: "var(--color-danger)" }}>Eliminar cuenta</p>
      <p className="form-hint" style={{ margin: 0 }}>
        Esto borra tu cuenta y TODO tu historial (glucosa, insulina, comidas,
        actividad, estado de ánimo, plan de tratamiento) de forma
        permanente. No se puede deshacer.
      </p>
      <label>
        Confirma tu contraseña
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      <label>
        Escribe {CONFIRM_WORD} para confirmar
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={CONFIRM_WORD}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button
        type="submit"
        disabled={!canSubmit || loading}
        style={{ background: "var(--color-danger)" }}
      >
        {loading ? "Eliminando..." : "Eliminar mi cuenta permanentemente"}
      </button>
    </form>
  );
}
