import { NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { generateResetToken } from "../../../../src/lib/tokens";
import { sendPasswordResetEmail } from "../../../../src/lib/email";

// Respuesta SIEMPRE genérica, exista o no el correo — evita que alguien
// pueda usar este endpoint para averiguar qué correos están registrados.
const GENERIC_RESPONSE = {
  ok: true,
  message: "Si ese correo tiene una cuenta, te enviamos un link para restablecer tu contraseña.",
};

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Ingresa tu correo." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Mismo mensaje que si sí existiera — no revelamos nada.
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const { token, tokenHash, expiresAt } = generateResetToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/restablecer-contrasena?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (err) {
    console.error("Error enviando correo de recuperación:", err);
    // No exponemos el error al usuario — mismo mensaje genérico igual.
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
