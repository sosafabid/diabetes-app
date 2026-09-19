import { requireSession } from "../../../src/lib/auth-guard";
import { prisma } from "../../../src/lib/prisma";
import CambiarPerfilForm from "./CambiarPerfilForm";
import CambiarContrasenaForm from "./CambiarContrasenaForm";
import EliminarCuentaForm from "./EliminarCuentaForm";

export default async function AjustesPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  if (!user) {
    return (
      <div className="page">
        <p>No se encontró tu cuenta.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Ajustes y privacidad</h1>
      <p className="page-subtitle">
        Administra tu cuenta. Ve también el{" "}
        <a href="/legal/consentimiento" target="_blank" rel="noopener noreferrer">
          manejo de datos y consentimiento
        </a>
        .
      </p>

      <CambiarPerfilForm initialName={user.name} initialEmail={user.email} />
      <CambiarContrasenaForm />
      <EliminarCuentaForm />
    </div>
  );
}
