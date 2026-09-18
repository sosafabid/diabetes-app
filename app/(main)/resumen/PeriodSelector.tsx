"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CustomPeriodPicker from "./CustomPeriodPicker";

const OPTIONS: { value: string; label: string }[] = [
  { value: "day", label: "Hoy" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "14d", label: "Últimos 14 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "month", label: "Mes calendario" },
  { value: "custom", label: "Personalizado" },
];

export default function PeriodSelector({ currentPeriod }: { currentPeriod: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCustom, setShowCustom] = useState(currentPeriod === "custom");

  function handleChange(value: string) {
    if (value === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    params.delete("from");
    params.delete("to");
    router.push(`/resumen?${params.toString()}`);
  }

  return (
    <div>
      <div className="quick-actions" style={{ marginBottom: showCustom ? "0.75rem" : "1.5rem" }}>
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
      {showCustom && (
        <CustomPeriodPicker
          initialFrom={searchParams.get("from") ?? undefined}
          initialTo={searchParams.get("to") ?? undefined}
        />
      )}
    </div>
  );
}