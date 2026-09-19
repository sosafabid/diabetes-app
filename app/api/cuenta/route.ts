import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../src/lib/prisma";
import { requireSession } from "../../../src/lib/auth-guard";
import { clearSessionCookie } from "../../../src/lib/session";

export async function DELETE(request: Request) {
  const session = await requireSession();

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body.password) {
    return NextResponse.json(
      { error: "Confirma tu contraseña para eliminar la cuenta." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "No se encontró la cuenta." }, { status: 404 });
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "La contraseña no es correcta." }, { status: 401 });
  }

  const userId = session.userId;

  // Orden de borrado: siempre los "hijos" antes que los "padres" a los que
  // apuntan, para no violar ninguna relación de llave foránea. FoodItem NO
  // se borra — es un catálogo compartido entre usuarios, no datos personales.
  await prisma.$transaction([
    prisma.mealItem.deleteMany({ where: { meal: { userId } } }),
    prisma.habitualMealItem.deleteMany({ where: { habitualMeal: { userId } } }),
    prisma.hypoglycemiaEvent.deleteMany({ where: { userId } }),
    prisma.followUp.deleteMany({ where: { userId } }),
    prisma.alert.deleteMany({ where: { userId } }),
    prisma.insulinEvent.deleteMany({ where: { userId } }),
    prisma.doseCalculation.deleteMany({ where: { userId } }),
    prisma.regimenVersion.deleteMany({ where: { insulinRegimen: { userId } } }),
    prisma.insulinRegimen.deleteMany({ where: { userId } }),
    prisma.meal.deleteMany({ where: { userId } }),
    prisma.habitualMeal.deleteMany({ where: { userId } }),
    prisma.glucoseReading.deleteMany({ where: { userId } }),
    prisma.exerciseEvent.deleteMany({ where: { userId } }),
    prisma.contextEvent.deleteMany({ where: { userId } }),
    prisma.hypoglycemiaPlan.deleteMany({ where: { userId } }),
    prisma.report.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.auditLog.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
