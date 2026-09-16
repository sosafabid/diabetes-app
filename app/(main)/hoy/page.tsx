import Link from "next/link";
import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";

export default async function HoyPage() {
  const session = await requireSession();

  const [lastGlucose, lastInsulin, activeAlerts] = await Promise.all([
    prisma.glucoseReading.findFirst({
      where: { userId: session.userId },
      orderBy: { timestamp: "desc" },
    }),
    prisma.insulinEvent.findFirst({
      where: { userId: session.userId },
      orderBy: { timestamp: "desc" },
      include: { insulinRegimen: true },
    }),
    prisma.alert.findMany({
      where: { userId: session.userId, resolvedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="page">
      <h1>Hoy</h1>

      {activeAlerts.length > 0 && (
        <div className="alert-banner">
          {activeAlerts.map((a) => (
            <p key={a.id}>⚠️ {a.message}</p>
          ))}
        </div>
      )}

      <div className="card-list">
        <div className="card">
          <h3>Glucosa actual</h3>
          {lastGlucose ? (
            <>
              <p className="big-value">
                {lastGlucose.glucoseValue}{" "}
                {lastGlucose.unit === "MGDL" ? "mg/dL" : "mmol/L"}
              </p>
              <p>
                Fuente: {lastGlucose.measurementSource === "BLOOD" ? "🩸 Sangre" : "📡 CGM"}
              </p>
            </>
          ) : (
            <p>Sin lecturas todavía.</p>
          )}
        </div>

        <div className="card">
          <h3>Última insulina</h3>
          {lastInsulin ? (
            <p>
              {lastInsulin.dose} U — {lastInsulin.insulinRegimen.insulinName}
            </p>
          ) : (
            <p>Sin dosis registradas todavía.</p>
          )}
        </div>
      </div>

      <h2>Acciones rápidas</h2>
      <div className="quick-actions">
        <Link href="/glucosa" className="quick-action">
          + Registrar glucosa
        </Link>
        <Link href="/comidas" className="quick-action">
          + Registrar comida
        </Link>
        <Link href="/insulina" className="quick-action">
          + Registrar insulina
        </Link>
        <Link href="/actividad" className="quick-action">
          + Registrar actividad
        </Link>
        <Link href="/mi-dia" className="quick-action">
          Ver mi día completo
        </Link>
      </div>
    </div>
  );
}
