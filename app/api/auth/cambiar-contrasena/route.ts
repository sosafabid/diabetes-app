import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/auth-guard";

export async function POST(request: Request) {
  const session = await requireSession();

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener al menos 8 caracteres." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "No se encontró la cuenta." }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "La contraseña actual no es correcta." }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.auditLog.create({ data: { userId: user.id, action: "PASSWORD_CHANGED" } }),
  ]);

  return NextResponse.json({ ok: true });
}
