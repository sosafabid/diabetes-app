import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../../src/lib/session";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
