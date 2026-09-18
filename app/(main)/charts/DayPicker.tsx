"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function DayPicker({ currentDay }: { currentDay: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("chartRange", "day");
    params.set("day", value);
    router.push(`/resumen?${params.toString()}#tendencia`);
  }

  return (
    <label className="day-picker-label">
      Ver el día:
      <input type="date" value={currentDay} onChange={(e) => handleChange(e.target.value)} />
    </label>
  );
}