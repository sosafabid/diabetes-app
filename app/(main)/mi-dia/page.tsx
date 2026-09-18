import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";

type TimelineEvent = {
  id: string;
  timestamp: Date;
  icon: string;
  label: string;
  detail: string;
};

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Merienda",
  OTHER: "Comida",
};

const EXERCISE_LABELS: Record<string, string> = {
  WALKING: "Caminata",
  RUNNING: "Carrera",
  CYCLING: "Ciclismo",
  WEIGHTS: "Pesas",
  HIIT: "HIIT",
  SWIMMING: "Natación",
  SPORT: "Deporte",
  OTHER: "Actividad",
};

export default async function MiDiaPage() {
  const session = await requireSession();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [glucose, meals, insulin, exercise, context, hypoEvents] = await Promise.all([
    prisma.glucoseReading.findMany({
      where: { userId: session.userId, timestamp: { gte: startOfDay } },
    }),
    prisma.meal.findMany({
      where: { userId: session.userId, timestamp: { gte: startOfDay } },
    }),
    prisma.insulinEvent.findMany({
      where: { userId: session.userId, timestamp: { gte: startOfDay } },
      include: { insulinRegimen: true },
    }),
    prisma.exerciseEvent.findMany({
      where: { userId: session.userId, timestamp: { gte: startOfDay } },
    }),
    prisma.contextEvent.findMany({
      where: { userId: session.userId, timestamp: { gte: startOfDay } },
    }),
    prisma.hypoglycemiaEvent.findMany({
      where: { userId: session.userId, createdAt: { gte: startOfDay } },
    }),
  ]);

  const events: TimelineEvent[] = [
    ...glucose.map((g) => ({
      id: `g-${g.id}`,
      timestamp: g.timestamp,
      icon: g.measurementSource === "BLOOD" ? "🩸" : "📡",
      label: "Glucosa",
      detail: `${g.glucoseValue} ${g.unit === "MGDL" ? "mg/dL" : "mmol/L"}`,
    })),
    ...meals.map((m) => ({
      id: `m-${m.id}`,
      timestamp: m.timestamp,
      icon: "🍽️",
      label: MEAL_LABELS[m.mealType] ?? "Comida",
      detail: m.carbsGDirect != null ? `${m.carbsGDirect} g carbohidratos` : "",
    })),
    ...insulin.map((i) => ({
      id: `i-${i.id}`,
      timestamp: i.timestamp,
      icon: "💉",
      label: "Insulina",
      detail: `${i.dose} U — ${i.insulinRegimen.insulinName}`,
    })),
    ...exercise.map((e) => ({
      id: `e-${e.id}`,
      timestamp: e.timestamp,
      icon: "🏃",
      label: EXERCISE_LABELS[e.type] ?? "Actividad",
      detail: `${e.duration} min`,
    })),
    ...hypoEvents.map((h) => ({
      id: `h-${h.id}`,
      timestamp: h.createdAt,
      icon: "🚨",
      label: "Hipoglucemia",
      detail:
        h.status === "PENDING"
          ? "Pendiente de tratamiento"
          : h.status === "TREATED"
            ? `Tratada con ${h.carbsConsumedG} g de carbohidratos`
            : h.status === "SEVERE"
              ? "Marcada como severa"
              : "Resuelta",
    })),
    ...context.map((c) => {
      const moodLabels: Record<string, string> = {
        LOW: "😌 Tranquilo/a",
        MODERATE: "😐 Normal",
        HIGH: "😣 Estresado/a",
      };
      return {
        id: `c-${c.id}`,
        timestamp: c.timestamp,
        icon: "🧠",
        label: "Estado de ánimo",
        detail: c.reportedStress ? moodLabels[c.reportedStress] ?? c.reportedStress : "",
      };
    }),
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div className="page">
      <h1>Mi día</h1>
      <p className="page-subtitle">
        {new Date().toLocaleDateString("es-CR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>

      {events.length === 0 ? (
        <div className="empty-state">
          <p>Todavía no has registrado nada hoy.</p>
        </div>
      ) : (
        <ol className="timeline">
          {events.map((ev) => (
            <li key={ev.id} className="timeline-item">
              <span className="timeline-time">
                {ev.timestamp.toLocaleTimeString("es-CR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="timeline-icon">{ev.icon}</span>
              <span className="timeline-label">{ev.label}</span>
              <span className="timeline-detail">{ev.detail}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}