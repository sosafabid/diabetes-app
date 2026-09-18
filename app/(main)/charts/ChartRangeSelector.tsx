"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
];

export default function ChartRangeSelector({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("chartRange", value);
    router.push(`/resumen?${params.toString()}#tendencia`);
  }

  return (
    <div className="quick-actions" style={{ marginBottom: "1rem" }}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={opt.value === current ? "" : "secondary-button"}
          onClick={() => handleChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}