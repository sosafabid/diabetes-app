// Script de una sola vez — correr localmente con:
//   npx tsx scripts/hacer-admin.ts tu-correo@ejemplo.com
// Nunca se ejecuta como parte de la app ni del build.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Uso: npx tsx scripts/hacer-admin.ts correo@ejemplo.com");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
  });

  console.log(`✅ ${user.name} (${user.email}) ahora es admin.`);
}

main()
  .catch((err) => {
    console.error("Error:", err.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
