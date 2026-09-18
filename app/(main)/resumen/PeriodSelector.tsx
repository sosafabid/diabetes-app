"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DayPicker from "../charts/DayPicker";
import CustomPeriodPicker from "./CustomPeriodPicker";

const OPTIONS: { value: string; label: string }[] = [
  { value: "day", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "14d", label: "14 días" },
  { value: "30d", label: "30 días" },
  { value: "month", label: "Mes calendario" },
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "custom", label: "Personalizado" },
];

export default function PeriodSelector({
  currentPeriod,
  currentDay,
  initialFrom,
  initialTo,
}: {
  currentPeriod: string;
  currentDay: string;
  initialFrom?: string;
  initialTo?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCustom, setShowCustom] = useState(currentPeriod === "custom");

  function handleChange(value: string) {
    setShowCustom(value === "custom");
    if (value === "custom") return; // se aplica con el formulario de CustomPeriodPicker

    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    params.delete("from");
    params.delete("to");
    if (value !== "day") params.delete("day");
    router.push(`/resumen?${params.toString()}`);
  }

  return (
    <div>
      <div className="quick-actions" style={{ marginBottom: "1rem" }}>
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
      {currentPeriod === "day" && <DayPicker currentDay={currentDay} />}
      {showCustom && <CustomPeriodPicker initialFrom={initialFrom} initialTo={initialTo} />}
    </div>
  );
}