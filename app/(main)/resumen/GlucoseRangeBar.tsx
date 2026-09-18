// Muestra qué proporción de las lecturas de una fuente (sangre o CGM)
// estuvieron bajas, en rango, o altas — como una sola barra segmentada.
// Nunca mezcla fuentes: se llama una vez por cada una.
export default function GlucoseRangeBar({
  sourceLabel,
  count,
  lowCount,
  highCount,
}: {
  sourceLabel: string;
  count: number;
  lowCount: number;
  highCount: number;
}) {
  if (count === 0) {
    return (
      <div className="range-bar-row">
        <span className="stat-bar-label">{sourceLabel}</span>
        <p className="form-hint" style={{ margin: 0 }}>
          Sin mediciones en este período.
        </p>
      </div>
    );
  }

  const inRangeCount = count - lowCount - highCount;
  const lowPct = Math.round((lowCount / count) * 100);
  const highPct = Math.round((highCount / count) * 100);
  const inRangePct = 100 - lowPct - highPct;

  return (
    <div className="range-bar-row">
      <span className="stat-bar-label">{sourceLabel}</span>
      <div className="range-bar-track">
        {lowPct > 0 && (
          <div
            className="range-segment range-segment-low"
            style={{ width: `${lowPct}%` }}
            title={`Bajo: ${lowCount} (${lowPct}%)`}
          />
        )}
        {inRangePct > 0 && (
          <div
            className="range-segment range-segment-mid"
            style={{ width: `${inRangePct}%` }}
            title={`En rango: ${inRangeCount} (${inRangePct}%)`}
          />
        )}
        {highPct > 0 && (
          <div
            className="range-segment range-segment-high"
            style={{ width: `${highPct}%` }}
            title={`Alto: ${highCount} (${highPct}%)`}
          />
        )}
      </div>
      <span className="range-bar-legend">
        <span className="legend-dot legend-low" /> {lowPct}% bajo ·{" "}
        <span className="legend-dot legend-mid" /> {inRangePct}% en rango ·{" "}
        <span className="legend-dot legend-high" /> {highPct}% alto
      </span>
    </div>
  );
}