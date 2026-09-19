"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CambiarPerfilForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo actualizar el perfil.");
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-form">
      <p style={{ margin: 0, fontWeight: 600 }}>Perfil</p>
      <label>
        Nombre
        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Correo electrónico
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      {success && <p style={{ color: "var(--color-primary)", fontSize: "0.85rem" }}>Perfil actualizado.</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
