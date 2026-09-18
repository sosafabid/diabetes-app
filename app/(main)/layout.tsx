import Link from "next/link";
import { getSession } from "../../src/lib/session";
import { prisma } from "../../src/lib/prisma";
import LogoutButton from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/hoy", label: "🏠 Hoy" },
  { href: "/glucosa", label: "🩸 Glucosa" },
  { href: "/comidas", label: "🍽️ Comidas" },
  { href: "/insulina", label: "💉 Insulina" },
  { href: "/actividad", label: "🏃 Actividad" },
  { href: "/mi-dia", label: "📊 Mi día" },
  { href: "/resumen", label: "📈 Resumen" },
  { href: "/tratamiento", label: "⚙️ Mi tratamiento" },
];

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({ where: { id: session.userId } })
    : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-title">Stay Alive ILU</span>
        <div className="app-header-right">
          {user && <span className="app-user">{user.name}</span>}
          <LogoutButton />
        </div>
      </header>
      <nav className="app-nav">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="app-nav-link">
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="app-content">{children}</main>
    </div>
  );
}
