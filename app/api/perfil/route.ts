import { NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import { createSessionCookie } from "../../../src/lib/session";

export async function PATCH(request: Request) {
  const session = await requireSession();

  let body: { name?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();

  if (!name || !email) {
    return NextResponse.json({ error: "Nombre y correo son obligatorios." }, { status: 400 });
  }

  if (email !== session.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.userId) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese correo." }, { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { name, email },
  });

  // La sesión guarda el correo en el token — si cambió, hay que reemitirlo
  // para que quede consistente con el nuevo valor.
  if (email !== session.email) {
    await createSessionCookie({ userId: user.id, email: user.email });
  }

  return NextResponse.json({ ok: true, user: { name: user.name, email: user.email } });
}
