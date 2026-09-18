// Gráfico de glucosa del día — SVG puro, sin librería externa.
// Sangre y CGM se dibujan como líneas separadas (nunca mezcladas en la
// misma serie). Los íconos de insulina/comida/actividad/estrés se colocan
// JUSTO ENCIMA de la curva, en su posición real de tiempo (eje X) y cerca
// de su altura real de glucosa (eje Y) — así se puede ver visualmente qué
// pasó justo antes/después de cada evento, en vez de una fila separada sin
// relación con la curva.
type Source = "BLOOD" | "CGM";

interface GlucosePoint {
  timestamp: Date;
  value: number;
  unit: "MGDL" | "MMOLL";
  source: Source;
}

interface EventMarker {
  timestamp: Date;
}

const WIDTH = 700;
const HEIGHT = 260;
const MARGIN_LEFT = 45;
const MARGIN_RIGHT = 45;
const MARGIN_TOP = 62; // espacio arriba para que los íconos (más grandes) no se corten
const CHART_HEIGHT = 170;

// Separación vertical entre íconos cuando coinciden en un momento similar,
// y cuánto se elevan por encima del punto de la curva.
const ICON_STACK_OFFSET: Record<"insulin" | "meal" | "activity" | "stress", number> = {
  insulin: 14,
  meal: 26,
  activity: 38,
  stress: 50,
};

/** Convierte una lista de puntos en una curva suave (spline Catmull-Rom
 * transformada a curvas Bézier), en vez de segmentos rectos — visualmente
 * más parecido a un CGM real. */
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

function areaPath(linePath: string, pts: { x: number; y: number }[], baselineY: number): string {
  if (pts.length === 0) return "";
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

function toMgdl(value: number, unit: "MGDL" | "MMOLL") {
  return unit === "MMOLL" ? value * 18.0182 : value;
}

function minutesSinceMidnight(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

function xForTime(d: Date) {
  const chartWidth = WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  return MARGIN_LEFT + (minutesSinceMidnight(d) / (24 * 60)) * chartWidth;
}

/** Encuentra el valor de glucosa más cercano en el tiempo a un evento, para
 * poder colocar el ícono cerca de la altura real de la curva en ese momento. */
function nearestMgdl(
  target: Date,
  points: { timestamp: Date; mgdl: number }[],
): number | null {
  if (points.length === 0) return null;
  let closest = points[0];
  let closestDiff = Math.abs(points[0].timestamp.getTime() - target.getTime());
  for (const p of points) {
    const diff = Math.abs(p.timestamp.getTime() - target.getTime());
    if (diff < closestDiff) {
      closest = p;
      closestDiff = diff;
    }
  }
  return closest.mgdl;
}

export default function GlucoseDayChart({
  glucoseReadings,
  insulinEvents,
  mealEvents,
  activityEvents,
  stressEvents = [],
  lowThreshold = 70,
  highThreshold = 180,
}: {
  glucoseReadings: GlucosePoint[];
  insulinEvents: EventMarker[];
  mealEvents: EventMarker[];
  activityEvents: EventMarker[];
  stressEvents?: EventMarker[];
  lowThreshold?: number;
  highThreshold?: number;
}) {
  if (glucoseReadings.length === 0) {
    return (
      <div className="empty-state">
        <p>Todavía no hay lecturas de glucosa hoy para graficar.</p>
      </div>
    );
  }

  const points = glucoseReadings
    .map((r) => ({ ...r, mgdl: toMgdl(r.value, r.unit) }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const allValues = points.map((p) => p.mgdl);
  const rawMin = Math.min(...allValues, lowThreshold);
  const rawMax = Math.max(...allValues, highThreshold);
  // El rango siempre cubre al menos 20-350 mg/dL (valores reales que puede
  // alcanzar una persona con diabetes), y se expande más si algún dato o
  // umbral configurado va todavía más allá de eso.
  const yMin = Math.max(0, Math.min(20, Math.floor((rawMin - 10) / 10) * 10));
  const yMax = Math.max(350, Math.ceil((rawMax + 10) / 10) * 10);

  function yForValue(v: number) {
    const t = (v - yMin) / (yMax - yMin);
    return MARGIN_TOP + CHART_HEIGHT - t * CHART_HEIGHT;
  }

  const bloodPoints = points.filter((p) => p.source === "BLOOD");
  const cgmPoints = points.filter((p) => p.source === "CGM");

  const bloodXY = bloodPoints.map((p) => ({ x: xForTime(p.timestamp), y: yForValue(p.mgdl) }));
  const cgmXY = cgmPoints.map((p) => ({ x: xForTime(p.timestamp), y: yForValue(p.mgdl) }));

  const bloodPath = smoothPath(bloodXY);
  const cgmPath = smoothPath(cgmXY);
  const baselineY = MARGIN_TOP + CHART_HEIGHT;
  const bloodArea = areaPath(bloodPath, bloodXY, baselineY);
  const cgmArea = areaPath(cgmPath, cgmXY, baselineY);

  function iconY(t: Date, kind: keyof typeof ICON_STACK_OFFSET) {
    const mgdl = nearestMgdl(t, points) ?? (yMin + yMax) / 2;
    const baseY = yForValue(mgdl);
    return Math.max(12, baseY - ICON_STACK_OFFSET[kind]);
  }

  function renderIcons(events: EventMarker[], kind: keyof typeof ICON_STACK_OFFSET, emoji: string) {
    return events.map((e, i) => (
      <text
        key={`${kind}-${i}`}
        x={xForTime(e.timestamp)}
        y={iconY(e.timestamp, kind)}
        fontSize="17"
        textAnchor="middle"
      >
        {emoji}
        <title>{`${e.timestamp.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })}`}</title>
      </text>
    ));
  }

  const hourTicks = [0, 6, 12, 18, 24];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ minWidth: 500, overflow: "visible" }}
        role="img"
        aria-label="Gráfico de glucosa del día con eventos de insulina, comidas, actividad y estrés sobre la curva"
      >
        <defs>
          <linearGradient id="bloodAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-danger)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-danger)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cgmAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Líneas de referencia bajo/alto */}
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

        {/* Eje Y: min/max */}
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
              <text x={2} y={y + 4} fontSize="11" fill="var(--color-text-muted)">
                {value}
              </text>
            </g>
          );
        })}

        {/* Líneas de glucosa por fuente — nunca mezcladas. Curva suave con
            área de degradado debajo, estilo CGM comercial. */}
        {bloodXY.length > 0 && <path d={bloodArea} fill="url(#bloodAreaGradient)" />}
        {cgmXY.length > 0 && <path d={cgmArea} fill="url(#cgmAreaGradient)" />}
        {bloodPoints.length > 0 && (
          <path
            d={bloodPath}
            fill="none"
            stroke="var(--color-danger)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {cgmPoints.length > 0 && (
          <path
            d={cgmPath}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {bloodPoints.map((p, i) => (
          <circle
            key={`b-${i}`}
            cx={xForTime(p.timestamp)}
            cy={yForValue(p.mgdl)}
            r={4}
            fill="var(--color-danger)"
            stroke="var(--color-surface)"
            strokeWidth={2}
          >
            <title>{`🩸 ${Math.round(p.mgdl)} mg/dL — ${p.timestamp.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })}`}</title>
          </circle>
        ))}
        {cgmPoints.map((p, i) => (
          <circle
            key={`c-${i}`}
            cx={xForTime(p.timestamp)}
            cy={yForValue(p.mgdl)}
            r={4}
            fill="var(--color-primary)"
            stroke="var(--color-surface)"
            strokeWidth={2}
          >
            <title>{`📡 ${Math.round(p.mgdl)} mg/dL — ${p.timestamp.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })}`}</title>
          </circle>
        ))}

        {/* Íconos de eventos, alineados en el tiempo y a la altura real de la curva */}
        {renderIcons(insulinEvents, "insulin", "💉")}
        {renderIcons(mealEvents, "meal", "🍽️")}
        {renderIcons(activityEvents, "activity", "🏃")}
        {renderIcons(stressEvents, "stress", "🧠")}

        {/* Eje X: horas */}
        {hourTicks.map((h, i) => {
          const x = MARGIN_LEFT + (h / 24) * (WIDTH - MARGIN_LEFT - MARGIN_RIGHT);
          return (
            <text
              key={h}
              x={x}
              y={HEIGHT - 6}
              fontSize="10"
              fill="var(--color-text-muted)"
              textAnchor={i === 0 ? "start" : i === hourTicks.length - 1 ? "end" : "middle"}
            >
              {h}:00
            </text>
          );
        })}
      </svg>
      <p className="range-bar-legend" style={{ marginTop: "0.4rem" }}>
        <span className="legend-dot" style={{ background: "var(--color-danger)" }} /> Sangre ·{" "}
        <span className="legend-dot" style={{ background: "var(--color-primary)" }} /> CGM · 💉 Insulina · 🍽️
        Comida · 🏃 Actividad · 🧠 Estrés reportado
      </p>
    </div>
  );
}