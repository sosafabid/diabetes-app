import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import { getUserTimeZone } from "../../../src/lib/timezone";
import RegistrarGlucosaForm from "./RegistrarGlucosaForm";

export default async function GlucosaPage() {
  const session = await requireSession();
  const timeZone = await getUserTimeZone();
  const [readings, plan] = await Promise.all([
    prisma.glucoseReading.findMany({
      where: { userId: session.userId },
      orderBy: { timestamp: "desc" },
      take: 20,
    }),
    prisma.hypoglycemiaPlan.findFirst({
      where: { userId: session.userId, effectiveTo: null },
      orderBy: { effectiveFrom: "desc" },
    }),
  ]);
  // El umbral alto todavía no es configurable por el paciente (mismo valor
  // de referencia usado en los gráficos) — ver nota en /resumen.
  const lowThreshold = plan?.lowThreshold ?? 70;
  const highThreshold = 180;

  return (
    <div className="page">
      <h1>Glucosa</h1>
      <RegistrarGlucosaForm lowThreshold={lowThreshold} highThreshold={highThreshold} />

      <h2>Últimas lecturas</h2>
      {readings.length === 0 ? (
        <div className="empty-state">
          <p>Todavía no has registrado ninguna lectura de glucosa.</p>
        </div>
      ) : (
        <ul className="event-list">
          {readings.map((r) => (
            <li key={r.id} className="event-item">
              <span className="event-source">
                {r.measurementSource === "BLOOD" ? "🩸" : "📡"}
              </span>
              <span className="event-value">
                {r.glucoseValue} {r.unit === "MGDL" ? "mg/dL" : "mmol/L"}
              </span>
              <span className="event-time">
                {new Date(r.timestamp).toLocaleString("es-CR", { timeZone })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}