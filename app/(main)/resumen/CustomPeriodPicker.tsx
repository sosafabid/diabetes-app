"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomPeriodPicker({
  initialFrom,
  initialTo,
}: {
  initialFrom?: string;
  initialTo?: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom ?? "");
  const [to, setTo] = useState(initialTo ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!from || !to) {
      setError("Selecciona ambas fechas.");
      return;
    }
    if (from > to) {
      setError("La fecha de inicio debe ser anterior a la de fin.");
      return;
    }
    router.push(`/resumen?period=custom&from=${from}&to=${to}`);
  }

  return (
    <form onSubmit={handleApply} className="custom-period-form">
      <label>
        Desde
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </label>
      <label>
        Hasta
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </label>
      <button type="submit" className="secondary-button">
        Aplicar
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}