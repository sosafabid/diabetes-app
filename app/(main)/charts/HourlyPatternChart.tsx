// Gráfico "¿cómo se ve un día típico?" — combina TODOS los días del período
// en una sola línea de 24h, agrupada en bloques de 2h. A diferencia del
// gráfico de tendencia (que muestra día por día), este responde "¿a qué
// hora suele subir/bajar mi glucosa?" usando el promedio de cada bloque.
interface HourlyBucket {
  startHour: number;
  avgGlucoseMgdl: number | null;
  glucoseReadingCount: number;
  avgCarbsGPerDay: number | null;
  avgInsulinUnitsPerDay: number | null;
}

const WIDTH = 700;
const HEIGHT = 260;
const MARGIN_LEFT = 45;
const MARGIN_RIGHT = 30;
const MARGIN_TOP = 20;
const CHART_HEIGHT = 150;
const CARB_ROW_Y = MARGIN_TOP + CHART_HEIGHT + 30;
const INSULIN_ROW_Y = CARB_ROW_Y + 28;

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function HourlyPatternChart({
  buckets,
  lowThreshold = 70,
  highThreshold = 180,
}: {
  buckets: HourlyBucket[];
  lowThreshold?: number;
  highThreshold?: number;
}) {
  const withData = buckets.filter((b) => b.avgGlucoseMgdl != null);
  if (withData.length < 2) {
    return (
      <div className="empty-state">
        <p>Todavía no hay suficientes datos repartidos en el día para este patrón.</p>
      </div>
    );
  }

  const values = withData.map((b) => b.avgGlucoseMgdl as number);
  const rawMin = Math.min(...values, lowThreshold);
  const rawMax = Math.max(...values, highThreshold);
  const yMin = Math.max(0, Math.min(20, Math.floor((rawMin - 10) / 10) * 10));
  const yMax = Math.max(350, Math.ceil((rawMax + 10) / 10) * 10);

  const chartWidth = WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  function xForHour(h: number) {
    return MARGIN_LEFT + (h / 24) * chartWidth;
  }
  function yForValue(v: number) {
    const t = (v - yMin) / (yMax - yMin);
    return MARGIN_TOP + CHART_HEIGHT - t * CHART_HEIGHT;
  }

  const points = withData.map((b) => ({
    x: xForHour(b.startHour + 1), // centrado en el bloque de 2h
    y: yForValue(b.avgGlucoseMgdl as number),
  }));
  const linePath = smoothPath(points);

  const maxCarbs = Math.max(1, ...buckets.map((b) => b.avgCarbsGPerDay ?? 0));
  const maxInsulin = Math.max(1, ...buckets.map((b) => b.avgInsulinUnitsPerDay ?? 0));

  const hourTicks = [0, 6, 12, 18, 24];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${INSULIN_ROW_Y + 20}`}
        width="100%"
        style={{ minWidth: 500, overflow: "visible" }}
        role="img"
        aria-label="Patrón de glucosa, carbohidratos e insulina por hora del día, combinando todos los días del período"
      >
        {yForValue(lowThreshold) >= MARGIN_TOP && (
          <line
            x1={MARGIN_LEFT}
            x2={WIDTH - MARGIN_RIGHT}
            y1={yForValue(lowThreshold)}
            y2={yForValue(lowThreshold)}
            stroke="var(--color-warning)"
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
            stroke="var(--color-danger)"
            strokeDasharray="4 3"
            strokeWidth={1}
          />
        )}

        {[0, 0.5, 1].map((frac) => {
          const value = Math.round((yMin + (yMax - yMin) * (1 - frac)) / 10) * 10;
          const y = MARGIN_TOP + frac * CHART_HEIGHT;
          return (
            <text key={frac} x={2} y={y + 4} fontSize="11" fill="var(--color-text-muted)">
              {value}
            </text>
          );
        })}

        <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth={3} strokeLinecap="round" />
        {withData.map((b, i) => (
          <circle
            key={i}
            cx={xForHour(b.startHour + 1)}
            cy={yForValue(b.avgGlucoseMgdl as number)}
            r={4}
            fill="var(--color-primary)"
            stroke="var(--color-surface)"
            strokeWidth={2}
          >
            <title>{`${b.startHour}:00–${b.startHour + 2}:00 — ${b.avgGlucoseMgdl} mg/dL (${b.glucoseReadingCount} lecturas)`}</title>
          </circle>
        ))}

        {/* Fila de carbohidratos promedio por día */}
        <text x={2} y={CARB_ROW_Y + 4} fontSize="13">
          🍽️
        </text>
        {buckets.map((b, i) =>
          b.avgCarbsGPerDay ? (
            <rect
              key={i}
              x={xForHour(b.startHour) + 4}
              y={CARB_ROW_Y - 8}
              width={Math.max(4, (b.avgCarbsGPerDay / maxCarbs) * (chartWidth / 12 - 8))}
              height={16}
              rx={3}
              fill="var(--color-warning)"
              opacity={0.75}
            >
              <title>{`${b.startHour}:00–${b.startHour + 2}:00 — ${b.avgCarbsGPerDay} g/día en promedio`}</title>
            </rect>
          ) : null,
        )}

        {/* Fila de insulina promedio por día */}
        <text x={2} y={INSULIN_ROW_Y + 4} fontSize="13">
          💉
        </text>
        {buckets.map((b, i) =>
          b.avgInsulinUnitsPerDay ? (
            <rect
              key={i}
              x={xForHour(b.startHour) + 4}
              y={INSULIN_ROW_Y - 8}
              width={Math.max(4, (b.avgInsulinUnitsPerDay / maxInsulin) * (chartWidth / 12 - 8))}
              height={16}
              rx={3}
              fill="var(--color-primary-dark)"
              opacity={0.75}
            >
              <title>{`${b.startHour}:00–${b.startHour + 2}:00 — ${b.avgInsulinUnitsPerDay} U/día en promedio`}</title>
            </rect>
          ) : null,
        )}

        {hourTicks.map((h, i) => (
          <text
            key={h}
            x={xForHour(h)}
            y={INSULIN_ROW_Y + 20}
            fontSize="10"
            fill="var(--color-text-muted)"
            textAnchor={i === 0 ? "start" : i === hourTicks.length - 1 ? "end" : "middle"}
          >
            {h}:00
          </text>
        ))}
      </svg>
      <p className="range-bar-legend" style={{ marginTop: "0.4rem" }}>
        Promedio de glucosa por bloque de 2h · 🍽️ carbohidratos promedio/día · 💉 insulina
        promedio/día
      </p>
    </div>
  );
}
