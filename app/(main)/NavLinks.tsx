"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/hoy", label: "🏠 Hoy" },
  { href: "/glucosa", label: "🩸 Glucosa" },
  { href: "/comidas", label: "🍽️ Comidas" },
  { href: "/insulina", label: "💉 Insulina" },
  { href: "/actividad", label: "🏃 Actividad" },
  { href: "/bienestar", label: "🧠 Estado de ánimo" },
  { href: "/mi-dia", label: "📊 Mi día" },
  { href: "/resumen", label: "📈 Resumen" },
  { href: "/tratamiento", label: "⚙️ Mi tratamiento" },
  { href: "/ajustes", label: "🔐 Ajustes y privacidad" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="app-nav">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`app-nav-link${isActive ? " active" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
