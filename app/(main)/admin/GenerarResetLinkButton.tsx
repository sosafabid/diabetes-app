"use client";

import { useState } from "react";

export default function GenerarResetLinkButton({ userId, userName }: { userId: string; userName: string }) {
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/admin/generar-reset/${userId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo generar el link.");
        return;
      }
      setResetUrl(data.resetUrl);
    } catch {
      setError("Ocurrió un error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!resetUrl) return;
    await navigator.clipboard.writeText(resetUrl);
    setCopied(true);
  }

  if (resetUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", maxWidth: 320 }}>
        <input
          type="text"
          readOnly
          value={resetUrl}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          style={{ fontSize: "0.75rem" }}
        />
        <button type="button" className="secondary-button" onClick={handleCopy}>
          {copied ? "Copiado ✓" : `Copiar y enviar a ${userName}`}
        </button>
        <span className="form-hint">Válido 1 hora, un solo uso.</span>
      </div>
    );
  }

  return (
    <div>
      <button type="button" className="secondary-button" onClick={handleGenerate} disabled={loading}>
        {loading ? "Generando..." : "Generar link de contraseña"}
      </button>
      {error && <p className="form-error" style={{ margin: "0.3rem 0 0" }}>{error}</p>}
    </div>
  );
}
