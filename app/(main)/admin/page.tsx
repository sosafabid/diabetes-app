import { prisma } from "../../../src/lib/prisma";
import { requireAdmin } from "../../../src/lib/auth-guard";
import GenerarResetLinkButton from "./GenerarResetLinkButton";

export default async function AdminPage() {
  await requireAdmin();

  const [users, recentResetRequests] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true, consentAcceptedAt: true, isAdmin: true },
    }),
    prisma.passwordResetToken.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const pendingRequests = recentResetRequests.filter(
    (r) => !r.usedAt && r.expiresAt > new Date(),
  );

  return (
    <div className="page">
      <h1>Panel de administrador</h1>

      {pendingRequests.length > 0 && (
        <section className="summary-section">
          <h2>🔔 Solicitudes de restablecimiento pendientes</h2>
          <p className="form-hint" style={{ marginBottom: "1rem" }}>
            Como todavía no hay dominio verificado en Resend, el correo automático puede no
            llegarle a la persona. Genera un link nuevo aquí y mándaselo por WhatsApp o
            correo personal.
          </p>
          <ul className="event-list">
            {pendingRequests.map((r) => (
              <li key={r.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{r.user.name}</p>
                  <p className="form-hint" style={{ margin: 0 }}>
                    {r.user.email} — pidió reestablecer el {new Date(r.createdAt).toLocaleString("es-CR")}
                  </p>
                </div>
                <GenerarResetLinkButton userId={r.userId} userName={r.user.name} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="summary-section">
        <h2>👥 Usuarios ({users.length})</h2>
        <ul className="event-list">
          {users.map((u) => (
            <li
              key={u.id}
              className="card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {u.name} {u.isAdmin && <span className="form-hint">(admin)</span>}
                </p>
                <p className="form-hint" style={{ margin: 0 }}>
                  {u.email} — registrada el {new Date(u.createdAt).toLocaleDateString("es-CR")}
                  {!u.consentAcceptedAt && " — ⚠️ sin consentimiento aceptado"}
                </p>
              </div>
              <GenerarResetLinkButton userId={u.id} userName={u.name} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
