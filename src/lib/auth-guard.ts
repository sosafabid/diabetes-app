import { getSession } from "./session";

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
