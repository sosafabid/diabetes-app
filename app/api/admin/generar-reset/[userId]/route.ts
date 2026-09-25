import { NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";
import { requireAdmin } from "../../../../../src/lib/auth-guard";
import { generateResetToken } from "../../../../../src/lib/tokens";

// Reutiliza EXACTAMENTE el mismo mecanismo de token que /api/auth/forgot-password
// (aleatorio, solo se guarda el hash) — la única diferencia es que el link
// resultante se lo copia el admin para mandarlo por otro canal (WhatsApp,
// llamada, correo personal), en vez de que lo mande Resend automáticamente.
// El admin NUNCA ve ni fija la contraseña del usuario directamente — solo
// genera el mismo link de un solo uso que el usuario habría recibido por
// correo, y el usuario sigue siendo quien la define.
export async function POST(_request: Request, { params }: { params: { userId: string } }) {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  const { token, tokenHash, expiresAt } = generateResetToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/restablecer-contrasena?token=${token}`;

  return NextResponse.json({ resetUrl, expiresAt, userEmail: user.email });
}