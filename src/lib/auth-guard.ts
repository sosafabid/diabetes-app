import { getSession } from "./session";
import { prisma } from "./prisma";

/**
 * Para usar en Server Components / route handlers ya protegidos por el
 * middleware (así que en teoría siempre hay sesión aquí) — pero se valida
 * de nuevo por si el middleware falla o se llama la función fuera de una
 * ruta protegida.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("No autenticado.");
  }
  return session;
}

/**
 * Para el panel de administrador. `isAdmin` NO vive en el JWT de sesión
 * (así que revocar el acceso de alguien es inmediato — no hay que esperar
 * a que expire ni renovar una cookie ya emitida) — siempre se revisa
 * fresco contra la base de datos en cada request.
 */
export async function requireAdmin() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.isAdmin) {
    throw new Error("No autorizado.");
  }
  return { session, user };
}
