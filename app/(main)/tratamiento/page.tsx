import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import NuevaInsulinaForm from "./NuevaInsulinaForm";
import PlanHipoglucemiaForm from "./PlanHipoglucemiaForm";

const TIPO_LABELS: Record<string, string> = {
  RAPID: "Rápida",
  ULTRA_RAPID: "Ultrarrápida",
  SHORT: "Corta",
  INTERMEDIATE: "Intermedia",
  LONG: "Larga",
  PREMIXED: "Premezclada",
  OTHER: "Otra",
};

const USO_LABELS: Record<string, string> = {
  BASAL: "Basal",
  MEALS: "Comidas",
  CORRECTION: "Corrección",
  PREMIXED: "Premezclada",
  OTHER: "Otro",
};

const MODALITY_LABELS: Record<string, string> = {
  CARB_RATIO: "Relación insulina/carbohidratos",
  TIERED: "Esquema progresivo por tramos",
  FIXED_DOSE: "Dosis fija",
  MANUAL_ONLY: "Solo registro manual",
};

const SOURCE_LABELS: Record<string, string> = {
  DECLARED: "Declarada por el paciente",
  CONFIRMED_BY_PROFESSIONAL: "✅ Confirmada por un profesional",
  PENDING_REVIEW: "⏳ Pendiente de revisión",
  INACTIVE: "Inactiva",
};

export default async function TratamientoPage() {
  const session = await requireSession();

  const [regimens, hypoglycemiaPlan] = await Promise.all([
    prisma.insulinRegimen.findMany({
      where: { userId: session.userId, isActive: true },
      include: {
        versions: {
          where: { effectiveTo: null },
          orderBy: { effectiveFrom: "desc" },
          include: { tiers: { orderBy: { order: "asc" } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.hypoglycemiaPlan.findFirst({
      where: { userId: session.userId, effectiveTo: null },
      orderBy: { effectiveFrom: "desc" },
    }),
  ]);

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
          {regimens.map((r) => (
            <div key={r.id} className="card">
              <h3>{r.insulinName}</h3>
              <p>
                {TIPO_LABELS[r.insulinType] ?? r.insulinType} · {USO_LABELS[r.usage] ?? r.usage}
                {r.brandOrActiveIngredient && ` · ${r.brandOrActiveIngredient}`}
                {r.concentration && ` (${r.concentration})`}
              </p>
              {r.versions.length === 0 && (
                <p className="form-hint">Sin pauta configurada todavía.</p>
              )}
              {r.versions.map((v) => (
                <div key={v.id} style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--color-border)" }}>
                  {v.schedule && <p style={{ margin: 0, fontWeight: 600 }}>{v.schedule}</p>}
                  <p className="form-hint" style={{ margin: "0.2rem 0" }}>
                    {v.modality ? MODALITY_LABELS[v.modality] : "Sin modalidad clasificada"} —{" "}
                    {SOURCE_LABELS[v.source] ?? v.source}
                    {v.professionalName && ` (${v.professionalName})`}
                  </p>
                  <ul className="card-details">
                    {v.prescribedDose != null && <li>Dosis prescrita: {v.prescribedDose} U</li>}
                    {v.carbRatio != null && <li>Relación carbohidratos: {v.carbRatio} g/U</li>}
                    {v.correctionFactor != null && <li>Factor de corrección: {v.correctionFactor}</li>}
                    {v.targetGlucoseLow != null && v.targetGlucoseHigh != null && (
                      <li>
                        Objetivo: {v.targetGlucoseLow}–{v.targetGlucoseHigh} mg/dL
                      </li>
                    )}
                    {v.tiers.length > 0 && (
                      <li>
                        Tramos ({v.tiers[0].isCumulative ? "acumulativo" : "por intervalo total"}):
                        <ul style={{ margin: "0.3rem 0 0", paddingLeft: "1.2rem" }}>
                          {v.tiers.map((t) => (
                            <li key={t.id}>
                              {t.carbsFromG}–{t.carbsToG ?? "∞"} g → {t.units} U
                              {t.description && ` (${t.description})`}
                            </li>
                          ))}
                        </ul>
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <NuevaInsulinaForm />

      <h2>Plan de hipoglucemia</h2>
      <PlanHipoglucemiaForm currentPlan={hypoglycemiaPlan} />
    </div>
  );
}
