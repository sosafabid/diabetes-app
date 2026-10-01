// Script de migración — correr localmente con:
//   npx tsx scripts/migrate-glucose-events.ts
// Nunca se ejecuta como parte de la app ni del build. Es SEGURO correrlo
// más de una vez — salta los HypoglycemiaEvent que ya fueron migrados.
//
// NO borra, modifica ni toca HypoglycemiaEvent en ningún momento — solo lo
// LEE para construir los GlucoseEvent nuevos.
import { PrismaClient } from "@prisma/client";
import { planMigration, type LegacyHypoglycemiaEvent } from "../src/domain/HypoglycemiaEventMigration";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Migración HypoglycemiaEvent → GlucoseEvent ===\n");

  const beforeHypoCount = await prisma.hypoglycemiaEvent.count();
  const beforeGlucoseEventCount = await prisma.glucoseEvent.count();
  console.log(`HypoglycemiaEvent existentes: ${beforeHypoCount}`);
  console.log(`GlucoseEvent existentes (antes de correr): ${beforeGlucoseEventCount}\n`);

  const legacyEvents = await prisma.hypoglycemiaEvent.findMany();
  const alreadyMigrated = await prisma.glucoseEvent.findMany({
    where: { migratedFromHypoglycemiaEventId: { not: null } },
    select: { migratedFromHypoglycemiaEventId: true },
  });
  const usedAsInitial = await prisma.glucoseEvent.findMany({ select: { initialGlucoseReadingId: true } });
  const usedAsMeasurement = await prisma.eventMeasurement.findMany({ select: { glucoseReadingId: true } });

  const plan = planMigration(
    legacyEvents as unknown as LegacyHypoglycemiaEvent[],
    new Set(alreadyMigrated.map((e) => e.migratedFromHypoglycemiaEventId as string)),
    new Set(usedAsInitial.map((e) => e.initialGlucoseReadingId)),
    new Set(usedAsMeasurement.map((e) => e.glucoseReadingId)),
  );

  console.log(`Ya migrados (se saltan): ${plan.alreadyMigrated.length}`);
  console.log(`Por migrar ahora: ${plan.toCreate.length}`);
  console.log(`Omitidos por conflicto de lectura: ${plan.skippedDueToConflict.length}\n`);

  if (plan.skippedDueToConflict.length > 0) {
    console.log("⚠️  Advertencias:");
    for (const skip of plan.skippedDueToConflict) {
      console.log(`  - HypoglycemiaEvent ${skip.legacyId}: ${skip.reasonEs}`);
    }
    console.log("");
  }

  if (plan.toCreate.length === 0) {
    console.log("Nada que migrar. Terminado.");
    await prisma.$disconnect();
    return;
  }

  const migratedIds: { legacyId: string; newGlucoseEventId: string }[] = [];
  let sumCarbsConsumedMigrated = 0;

  for (const item of plan.toCreate) {
    const created = await prisma.$transaction(async (tx) => {
      const event = await tx.glucoseEvent.create({ data: item.glucoseEvent });
      if (item.intervention) {
        await tx.eventIntervention.create({
          data: {
            glucoseEventId: event.id,
            type: "CARBOHYDRATE",
            food: item.intervention.food,
            carbohydrateGrams: item.intervention.carbohydrateGrams,
            timestamp: item.intervention.timestamp,
          },
        });
      }
      if (item.measurement) {
        await tx.eventMeasurement.create({
          data: { glucoseEventId: event.id, glucoseReadingId: item.measurement.glucoseReadingId },
        });
      }
      return event;
    });
    migratedIds.push({ legacyId: item.legacyId, newGlucoseEventId: created.id });
    if (item.intervention) sumCarbsConsumedMigrated += item.intervention.carbohydrateGrams;
  }

  // ---- Verificación de conteos ----
  const afterHypoCount = await prisma.hypoglycemiaEvent.count();
  const afterGlucoseEventCount = await prisma.glucoseEvent.count({
    where: { migratedFromHypoglycemiaEventId: { not: null } },
  });

  const expectedSumCarbs = await prisma.hypoglycemiaEvent.aggregate({
    where: { status: "TREATED", carbsConsumedG: { not: null } },
    _sum: { carbsConsumedG: true },
  });

  console.log("=== Reporte final ===");
  console.log(`HypoglycemiaEvent (antes): ${beforeHypoCount} — (después, sin cambios): ${afterHypoCount}`);
  console.log(
    `HypoglycemiaEvent sin tocar: ${beforeHypoCount === afterHypoCount ? "✅ confirmado, nada se borró/modificó" : "❌ ALERTA — el conteo cambió, algo no debería"}`,
  );
  console.log(`GlucoseEvent migrados en total (acumulado): ${afterGlucoseEventCount}`);
  console.log(
    `Conteo esperado (HypoglycemiaEvent total): ${beforeHypoCount} ${
      afterGlucoseEventCount === beforeHypoCount ? "✅ coincide" : "⚠️  no coincide — revisar advertencias arriba"
    }`,
  );
  console.log(
    `Suma de carbohidratos en TREATED: ${expectedSumCarbs._sum.carbsConsumedG ?? 0}g — migrados en esta corrida: ${sumCarbsConsumedMigrated}g`,
  );
  console.log(`\nRegistros migrados en esta corrida (${migratedIds.length}):`);
  for (const m of migratedIds) {
    console.log(`  HypoglycemiaEvent ${m.legacyId} → GlucoseEvent ${m.newGlucoseEventId}`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error durante la migración:", err);
  await prisma.$disconnect();
  process.exit(1);
});
