import { NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/auth-guard";

export async function GET() {
  const session = await requireSession();
  const batches = await prisma.importBatch.findMany({
    where: { userId: session.userId },
    orderBy: { importedAt: "desc" },
  });
  return NextResponse.json({ batches });
}
