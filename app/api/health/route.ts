// Endpoint de verificación: confirma que la app puede conectarse a la base
// de datos (Neon). Útil para comprobar el deploy en Vercel.
import { NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";

export async function GET() {
  try {
    // Consulta trivial — no toca datos de pacientes, solo verifica conexión.
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: "conectado",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "no se pudo conectar",
        message: error instanceof Error ? error.message : "error desconocido",
      },
      { status: 500 },
    );
  }
}
