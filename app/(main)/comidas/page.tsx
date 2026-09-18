import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import { getUserTimeZone } from "../../../src/lib/timezone";
import RegistrarComidaForm from "./RegistrarComidaForm";

const TIPO_LABELS: Record<string, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Merienda",
  OTHER: "Otra",
};

export default async function ComidasPage() {
  const session = await requireSession();
  const timeZone = await getUserTimeZone();
  const meals = await prisma.meal.findMany({
    where: { userId: session.userId },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  return (
    <div className="page">
      <h1>Comidas</h1>
      <RegistrarComidaForm />

      <h2>Últimas comidas</h2>
      {meals.length === 0 ? (
        <div className="empty-state">
          <p>Todavía no has registrado ninguna comida.</p>
        </div>
      ) : (
        <ul className="event-list">
          {meals.map((m) => (
            <li key={m.id} className="event-item">
              <span>{TIPO_LABELS[m.mealType] ?? m.mealType}</span>
              <span className="event-value">{m.carbsGDirect} g</span>
              <span className="event-time">
                {new Date(m.timestamp).toLocaleString("es-CR", { timeZone })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}