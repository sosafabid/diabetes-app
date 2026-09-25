import { getSession } from "../../src/lib/session";
import { prisma } from "../../src/lib/prisma";
import LogoutButton from "./LogoutButton";
import TimezoneSync from "./TimezoneSync";
import NavLinks from "./NavLinks";

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
      <TimezoneSync />
      <header className="app-header">
        <div className="app-brand">
          <img src="/logo.png" alt="Stay Alive ILU" className="app-logo" />
          <span className="app-title">Stay Alive ILU</span>
        </div>
        <div className="app-header-right">
          {user && <span className="app-user">{user.name}</span>}
          <LogoutButton />
        </div>
      </header>
      <NavLinks isAdmin={user?.isAdmin ?? false} />
      <main className="app-content">{children}</main>
    </div>
  );
}
