// ============================================================================
// Sesión de usuario — JWT firmado en cookie httpOnly.
// ============================================================================
// No usamos un framework de auth completo (NextAuth, etc.) para mantener el
// MVP simple y auditable: el flujo entero (login, verificación, logout) cabe
// en este archivo y en las 3 rutas de app/api/auth/*.
// ============================================================================
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 días

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Falta la variable de entorno SESSION_SECRET (necesaria para firmar la sesión).",
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Lee y valida la sesión actual. Devuelve null si no hay sesión o es inválida. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}
