import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import NuevaInsulinaForm from "./NuevaInsulinaForm";

const TIPO_LABELS: Record<string, string> = {
  RAPID: "Rápida",
  ULTRA_RAPID: "Ultrarrápida",
  SHORT: "Corta",
  INTERMEDIATE: "Intermedia",
  LONG: "Larga",
  OTHER: "Otra",
};

const USO_LABELS: Record<string, string> = {
  BASAL: "Basal",
  MEALS: "Comidas",
  CORRECTION: "Corrección",
  OTHER: "Otro",
};

export default async function TratamientoPage() {
  const session = await requireSession();

  const regimens = await prisma.insulinRegimen.findMany({
    where: { userId: session.userId, isActive: true },
    include: { versions: { orderBy: { effectiveFrom: "desc" }, take: 1 } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="page">
      <h1>Mi tratamiento</h1>
      <p className="page-subtitle">
        Registra aquí las insulinas y los parámetros que tu profesional de
        salud te indicó. La app nunca inventa ni calcula estos valores.
      </p>

      {regimens.length === 0 ? (
        <div className="empty-state">
          <p>Todavía no has registrado ninguna insulina.</p>
        </div>
      ) : (
        <div className="card-list">
          {regimens.map((r) => {
            const v = r.versions[0];
            return (
              <div key={r.id} className="card">
                <h3>{r.insulinName}</h3>
                <p>
                  {TIPO_LABELS[r.insulinType] ?? r.insulinType} ·{" "}
                  {USO_LABELS[r.usage] ?? r.usage}
                </p>
                {v && (
                  <ul className="card-details">
                    {v.prescribedDose != null && (
                      <li>Dosis: {v.prescribedDose} U</li>
                    )}
                    {v.schedule && <li>Horario: {v.schedule}</li>}
                    {v.carbRatio != null && (
                      <li>Relación carbohidratos: {v.carbRatio} g/U</li>
                    )}
                    {v.correctionFactor != null && (
                      <li>Factor de corrección: {v.correctionFactor}</li>
                    )}
                    {v.targetGlucoseLow != null &&
                      v.targetGlucoseHigh != null && (
                        <li>
                          Objetivo: {v.targetGlucoseLow}–{v.targetGlucoseHigh}{" "}
                          mg/dL
                        </li>
                      )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <NuevaInsulinaForm />
    </div>
  );
}
