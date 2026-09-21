// Cuadrícula semanal — siempre los últimos 7 días, con una mini-gráfica de
// glucosa por día (sin ejes, solo la forma) más los totales del día.
// Inspirado en el "Weekly Summary" de LibreView.
interface DayData {
  dateLabel: string;
  glucosePoints: { timestamp: Date; value: number; unit: "MGDL" | "MMOLL"; source: "BLOOD" | "CGM" }[];
  totalCarbsG: number;
  totalInsulinUnits: number;
  lowEventCount: number;
}

const SPARK_WIDTH = 260;
const SPARK_HEIGHT = 44;

function toMgdl(value: number, unit: "MGDL" | "MMOLL") {
  return unit === "MMOLL" ? value * 18.0182 : value;
}

function MiniSparkline({ points, timeZone }: { points: DayData["glucosePoints"]; timeZone: string }) {
  if (points.length === 0) {
    return (
      <svg width={SPARK_WIDTH} height={SPARK_HEIGHT} viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}>
        <text x={4} y={SPARK_HEIGHT / 2 + 4} fontSize="11" fill="var(--color-text-muted)">
          Sin datos
        </text>
      </svg>
    );
  }

  const sorted = [...points].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const mgdlValues = sorted.map((p) => toMgdl(p.value, p.unit));
  const yMin = Math.min(40, ...mgdlValues);
  const yMax = Math.max(300, ...mgdlValues);

  function minutesSinceMidnight(d: Date) {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = dtf.formatToParts(d);
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
    const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    return h * 60 + m;
  }

  function x(d: Date) {
    return (minutesSinceMidnight(d) / (24 * 60)) * SPARK_WIDTH;
  }
  function y(mgdl: number) {
    const t = (mgdl - yMin) / (yMax - yMin || 1);
    return SPARK_HEIGHT - t * SPARK_HEIGHT;
  }

  const path = sorted
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.timestamp)} ${y(toMgdl(p.value, p.unit))}`)
    .join(" ");

  return (
    <svg width={SPARK_WIDTH} height={SPARK_HEIGHT} viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}>
      <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export default function WeeklyGrid({ days, timeZone }: { days: DayData[]; timeZone: string }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ color: "var(--color-text-muted)", textAlign: "left" }}>
            <th style={{ padding: "0.4rem", fontWeight: 500 }}>Día</th>
            <th style={{ padding: "0.4rem", fontWeight: 500 }}>Glucosa (0h–24h)</th>
            <th style={{ padding: "0.4rem", fontWeight: 500 }}>Carbos</th>
            <th style={{ padding: "0.4rem", fontWeight: 500 }}>Insulina</th>
            <th style={{ padding: "0.4rem", fontWeight: 500 }}>Bajas</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.dateLabel} style={{ borderTop: "1px solid var(--color-border)" }}>
              <td style={{ padding: "0.5rem 0.4rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                {d.dateLabel}
              </td>
              <td style={{ padding: "0.5rem 0.4rem" }}>
                <MiniSparkline points={d.glucosePoints} timeZone={timeZone} />
              </td>
              <td style={{ padding: "0.5rem 0.4rem", whiteSpace: "nowrap" }}>
                {d.totalCarbsG > 0 ? `${d.totalCarbsG} g` : "—"}
              </td>
              <td style={{ padding: "0.5rem 0.4rem", whiteSpace: "nowrap" }}>
                {d.totalInsulinUnits > 0 ? `${d.totalInsulinUnits} U` : "—"}
              </td>
              <td style={{ padding: "0.5rem 0.4rem" }}>{d.lowEventCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
