import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../src/lib/prisma";
import { createSessionCookie } from "../../../../src/lib/session";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
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

  if (!email || !password) {
    return NextResponse.json(
      { error: "Correo y contraseña son obligatorios." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Mensaje genérico a propósito: no revelar si el correo existe o no.
  const genericError = { error: "Correo o contraseña incorrectos." };

  if (!user) {
    return NextResponse.json(genericError, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(genericError, { status: 401 });
  }

  await prisma.auditLog.create({
    data: { userId: user.id, action: "LOGIN" },
  });

  await createSessionCookie({ userId: user.id, email: user.email });

  return NextResponse.json({ ok: true });
}
