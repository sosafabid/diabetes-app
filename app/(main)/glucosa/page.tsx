import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import RegistrarGlucosaForm from "./RegistrarGlucosaForm";

export default async function GlucosaPage() {
  const session = await requireSession();
  const readings = await prisma.glucoseReading.findMany({
    where: { userId: session.userId },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  return (
    <div className="page">
      <h1>Glucosa</h1>
      <RegistrarGlucosaForm />

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
                {new Date(r.timestamp).toLocaleString("es-CR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
