// ============================================================================
// Tokens de recuperación de contraseña.
// ============================================================================
// El token real (aleatorio, 32 bytes) solo existe en el link del correo —
// en la base de datos SOLO se guarda su hash SHA-256, igual que nunca se
// guarda una contraseña en texto plano. Así, aunque alguien leyera la base
// de datos, no podría reconstruir un link de reseteo válido.
// ============================================================================
import crypto from "crypto";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export function generateResetToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
