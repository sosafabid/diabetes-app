import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../src/lib/prisma";
import { createSessionCookie } from "../../../../src/lib/session";

export async function POST(request: Request) {
  let body: { email?: string; password?: string; name?: string; consentAccepted?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 },
    );
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const name = body.name?.trim();

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "Nombre, correo y contraseña son obligatorios." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 },
    );
  }
  if (body.consentAccepted !== true) {
    return NextResponse.json(
      { error: "Debes aceptar el manejo de datos y consentimiento para crear tu cuenta." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese correo." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, name, passwordHash, consentAcceptedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "REGISTER" },
  });

  await createSessionCookie({ userId: user.id, email: user.email });

  return NextResponse.json({ ok: true, userId: user.id });
}
