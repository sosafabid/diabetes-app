// Barra horizontal simple y liviana — sin librería de gráficos, solo CSS.
// Se usa para mostrar distribuciones (insulina por tipo, comidas por tipo,
// actividad por tipo) de forma visual sin saturar la pantalla.
export default function StatBar({
  label,
  value,
  maxValue,
  displayValue,
  color = "var(--color-primary)",
}: {
  label: string;
  value: number;
  maxValue: number;
  displayValue: string;
  color?: string;
}) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  return (
    <div className="stat-bar-row">
      <span className="stat-bar-label">{label}</span>
      <div className="stat-bar-track">
        <div
          className="stat-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="stat-bar-value">{displayValue}</span>
    </div>
  );
}