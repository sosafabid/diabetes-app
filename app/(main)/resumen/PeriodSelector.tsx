"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "7d", label: "Últimos 7 días" },
  { value: "14d", label: "Últimos 14 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "month", label: "Mes calendario" },
];

export default function PeriodSelector({ currentPeriod }: { currentPeriod: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    router.push(`/resumen?${params.toString()}`);
  }

  return (
    <div className="quick-actions" style={{ marginBottom: "1.5rem" }}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={opt.value === currentPeriod ? "" : "secondary-button"}
          onClick={() => handleChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}