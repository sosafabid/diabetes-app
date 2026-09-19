// Gráfico de tendencia — para rangos largos (semana/mes/3 meses/6 meses) no
// tiene sentido graficar cada lectura individual (se satura), así que se
// muestra el PROMEDIO DIARIO por fuente. Sangre y CGM siempre como líneas
// separadas.
//
// A diferencia del gráfico de "Día", aquí NO se muestran íconos de eventos
// (insulina/comida/actividad/estrés): con un solo punto por día, varios
// eventos del mismo día caerían en la misma posición y se amontonarían,
// volviéndose ilegibles. Esa vista detallada solo tiene sentido en "Día".
type Source = "BLOOD" | "CGM";

interface GlucosePoint {
  timestamp: Date;
  value: number;
  unit: "MGDL" | "MMOLL";
  source: Source;
}

const WIDTH = 700;
const HEIGHT = 220;
const MARGIN_LEFT = 45;
const MARGIN_RIGHT = 30;
const MARGIN_TOP = 15;
const MARGIN_BOTTOM = 30;
const CHART_HEIGHT = HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

function toMgdl(value: number, unit: "MGDL" | "MMOLL") {
  return unit === "MMOLL" ? value * 18.0182 : value;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface DailyAverage {
  date: Date;
  average: number;
}

function computeDailyAverages(points: { timestamp: Date; mgdl: number }[]): DailyAverage[] {
  const byDay = new Map<string, { sum: number; count: number; date: Date }>();
  for (const p of points) {
    const key = dayKey(p.timestamp);
    const entry = byDay.get(key);
    if (entry) {
      entry.sum += p.mgdl;
      entry.count += 1;
    } else {
      const dayStart = new Date(p.timestamp);
      dayStart.setHours(0, 0, 0, 0);
      byDay.set(key, { sum: p.mgdl, count: 1, date: dayStart });
    }
  }
  return Array.from(byDay.values())
    .map((e) => ({ date: e.date, average: e.sum / e.count }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export default function GlucoseTrendLineChart({
  glucoseReadings,
  rangeStart,
  rangeEnd,
  lowThreshold = 70,
  highThreshold = 180,
}: {
  glucoseReadings: GlucosePoint[];
  rangeStart: Date;
  rangeEnd: Date;
  // Se siguen aceptando (opcionales) para no romper la llamada desde
  // page.tsx, pero ya no se usan para renderizar íconos — ver nota arriba.
  insulinEvents?: { timestamp: Date }[];
  mealEvents?: { timestamp: Date }[];
  activityEvents?: { timestamp: Date }[];
  stressEvents?: { timestamp: Date }[];
  lowThreshold?: number;
  highThreshold?: number;
}) {
  if (glucoseReadings.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay lecturas de glucosa en este período para graficar.</p>
      </div>
    );
  }

  const withMgdl = glucoseReadings.map((r) => ({ ...r, mgdl: toMgdl(r.value, r.unit) }));
  const bloodDaily = computeDailyAverages(withMgdl.filter((p) => p.source === "BLOOD"));
  const cgmDaily = computeDailyAverages(withMgdl.filter((p) => p.source === "CGM"));

  const allAverages = [...bloodDaily, ...cgmDaily].map((d) => d.average);
  const rawMin = Math.min(...allAverages, lowThreshold);
  const rawMax = Math.max(...allAverages, highThreshold);
  // El rango siempre cubre al menos 20-350 mg/dL, y se expande más si algún
  // promedio diario o umbral configurado va todavía más allá de eso.
  const yMin = Math.max(0, Math.min(20, Math.floor((rawMin - 10) / 10) * 10));
  const yMax = Math.max(350, Math.ceil((rawMax + 10) / 10) * 10);

  const totalMs = rangeEnd.getTime() - rangeStart.getTime();
  const chartWidth = WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  function xForDate(d: Date) {
    const t = (d.getTime() - rangeStart.getTime()) / totalMs;
    return MARGIN_LEFT + Math.min(1, Math.max(0, t)) * chartWidth;
  }
  function yForValue(v: number) {
    const t = (v - yMin) / (yMax - yMin);
    return MARGIN_TOP + CHART_HEIGHT - t * CHART_HEIGHT;
  }

  function pathFor(daily: DailyAverage[]) {
    return daily
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xForDate(d.date)} ${yForValue(d.average)}`)
      .join(" ");
  }

  // Etiquetas del eje X: hasta 6 marcas repartidas en el rango
  const tickCount = 6;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const t = i / tickCount;
    return new Date(rangeStart.getTime() + t * totalMs);
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ minWidth: 500, overflow: "visible" }}
        role="img"
        aria-label="Tendencia de glucosa (promedio diario) en el período seleccionado"
      >
        {yForValue(lowThreshold) >= MARGIN_TOP && (
          <line
            x1={MARGIN_LEFT}
            x2={WIDTH - MARGIN_RIGHT}
            y1={yForValue(lowThreshold)}
            y2={yForValue(lowThreshold)}
            stroke="var(--color-danger)"
            strokeDasharray="4 3"
            strokeWidth={1}
          />
        )}
        {yForValue(highThreshold) >= MARGIN_TOP && (
          <line
            x1={MARGIN_LEFT}
            x2={WIDTH - MARGIN_RIGHT}
            y1={yForValue(highThreshold)}
            y2={yForValue(highThreshold)}
            stroke="var(--color-warning)"
            strokeDasharray="4 3"
            strokeWidth={1}
          />
        )}

        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const value = Math.round((yMin + (yMax - yMin) * (1 - frac)) / 10) * 10;
          const y = MARGIN_TOP + frac * CHART_HEIGHT;
          return (
            <g key={`gridline-${frac}`}>
              <line
                x1={MARGIN_LEFT}
                x2={WIDTH - MARGIN_RIGHT}
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth={1}
              />
              <text x={2} y={y + 4} fontSize="13" fill="var(--color-text-muted)">
                {value}
              </text>
            </g>
          );
        })}

        {bloodDaily.length > 0 && (
          <path d={pathFor(bloodDaily)} fill="none" stroke="var(--color-danger)" strokeWidth={3} />
        )}
        {cgmDaily.length > 0 && (
          <path d={pathFor(cgmDaily)} fill="none" stroke="var(--color-primary)" strokeWidth={3} />
        )}
        {bloodDaily.map((d, i) => (
          <circle key={`b-${i}`} cx={xForDate(d.date)} cy={yForValue(d.average)} r={4} fill="var(--color-danger)">
            <title>{`🩸 Promedio ${Math.round(d.average)} mg/dL — ${d.date.toLocaleDateString("es-CR")}`}</title>
          </circle>
        ))}
        {cgmDaily.map((d, i) => (
          <circle key={`c-${i}`} cx={xForDate(d.date)} cy={yForValue(d.average)} r={4} fill="var(--color-primary)">
            <title>{`📡 Promedio ${Math.round(d.average)} mg/dL — ${d.date.toLocaleDateString("es-CR")}`}</title>
          </circle>
        ))}

        {ticks.map((t, i) => (
          <text
            key={i}
            x={xForDate(t)}
            y={HEIGHT - 8}
            fontSize="11"
            fill="var(--color-text-muted)"
            textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
          >
            {t.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit" })}
          </text>
        ))}
      </svg>
      <p className="range-bar-legend" style={{ marginTop: "0.4rem" }}>
        <span className="legend-dot" style={{ background: "var(--color-danger)" }} /> Sangre (promedio diario) ·{" "}
        <span className="legend-dot" style={{ background: "var(--color-primary)" }} /> CGM (promedio diario)
      </p>
    </div>
  );
}
