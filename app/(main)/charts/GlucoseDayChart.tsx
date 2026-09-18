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
const MARGIN_TOP = 55; // espacio arriba para que los íconos no se corten
const CHART_HEIGHT = 170;

// Separación vertical entre íconos cuando coinciden en un momento similar,
// y cuánto se elevan por encima del punto de la curva.
const ICON_STACK_OFFSET: Record<"insulin" | "meal" | "activity" | "stress", number> = {
  insulin: 14,
  meal: 26,
  activity: 38,
  stress: 50,
};

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
  const yMin = Math.max(0, Math.floor((rawMin - 20) / 10) * 10);
  const yMax = Math.ceil((rawMax + 20) / 10) * 10;

  function yForValue(v: number) {
    const t = (v - yMin) / (yMax - yMin);
    return MARGIN_TOP + CHART_HEIGHT - t * CHART_HEIGHT;
  }

  const bloodPoints = points.filter((p) => p.source === "BLOOD");
  const cgmPoints = points.filter((p) => p.source === "CGM");

  const bloodPath = bloodPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xForTime(p.timestamp)} ${yForValue(p.mgdl)}`)
    .join(" ");
  const cgmPath = cgmPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xForTime(p.timestamp)} ${yForValue(p.mgdl)}`)
    .join(" ");

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
        fontSize="13"
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
        <text x={2} y={MARGIN_TOP + 4} fontSize="9" fill="var(--color-text-muted)">
          {yMax}
        </text>
        <text x={2} y={MARGIN_TOP + CHART_HEIGHT} fontSize="9" fill="var(--color-text-muted)">
          {yMin}
        </text>

        {/* Líneas de glucosa por fuente — nunca mezcladas */}
        {bloodPoints.length > 0 && (
          <path d={bloodPath} fill="none" stroke="var(--color-danger)" strokeWidth={2} />
        )}
        {cgmPoints.length > 0 && (
          <path d={cgmPath} fill="none" stroke="var(--color-primary)" strokeWidth={2} />
        )}
        {bloodPoints.map((p, i) => (
          <circle
            key={`b-${i}`}
            cx={xForTime(p.timestamp)}
            cy={yForValue(p.mgdl)}
            r={3}
            fill="var(--color-danger)"
          >
            <title>{`🩸 ${Math.round(p.mgdl)} mg/dL — ${p.timestamp.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })}`}</title>
          </circle>
        ))}
        {cgmPoints.map((p, i) => (
          <circle
            key={`c-${i}`}
            cx={xForTime(p.timestamp)}
            cy={yForValue(p.mgdl)}
            r={3}
            fill="var(--color-primary)"
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
              fontSize="9"
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