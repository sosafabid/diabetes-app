"use client";

import { useState } from "react";
import Link from "next/link";

export default function OlvideContrasenaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo procesar la solicitud.");
        return;
      }
      setSent(true);
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>¿Olvidaste tu contraseña?</h1>
        {sent ? (
          <p>
            Si ese correo tiene una cuenta, te enviamos un link para
            restablecer tu contraseña. Revisa tu bandeja de entrada (y spam)
            — el link es válido por 1 hora.
          </p>
        ) : (
          <>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              Ingresa tu correo y te enviamos un link para restablecerla.
            </p>
            <label>
              Correo electrónico
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de recuperación"}
            </button>
          </>
        )}
        <p>
          <Link href="/login">Volver a iniciar sesión</Link>
        </p>
      </form>
    </main>
  );
}
