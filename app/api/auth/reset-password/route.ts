import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../src/lib/prisma";
import { hashResetToken } from "../../../../src/lib/tokens";

export async function POST(request: Request) {
  let body: { token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { token, password } = body;
  if (!token || !password) {
    return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 },
    );
  }

  const tokenHash = hashResetToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (
    !resetToken ||
    resetToken.usedAt !== null ||
    resetToken.expiresAt.getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "Este link ya no es válido. Solicita uno nuevo." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: { userId: resetToken.userId, action: "PASSWORD_RESET" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
