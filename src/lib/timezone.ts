// ============================================================================
// Zona horaria dinámica del usuario.
// ============================================================================
// El servidor (Vercel) corre en una zona horaria fija — no sirve para un
// usuario que viaja. En vez de eso: el navegador detecta su propia zona
// horaria (Intl.DateTimeFormat) y la guarda en una cookie; el servidor lee
// esa cookie en cada request y calcula "hoy", formatea horas, etc. con la
// zona horaria real del usuario en ESE momento — si viaja a China, cambia
// sola a la zona horaria de China la próxima vez que abra la app ahí.
// ============================================================================
import { cookies } from "next/headers";

export const TZ_COOKIE = "tz";
export const DEFAULT_TZ = "America/Costa_Rica";

/** Lee la zona horaria del usuario desde la cookie (puesta por TimezoneSync
 * en el cliente). Si todavía no existe (primera visita), usa un valor por
 * defecto razonable hasta que el cliente la detecte y la guarde. */
export async function getUserTimeZone(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(TZ_COOKIE)?.value || DEFAULT_TZ;
}

/** Diferencia (en ms) entre la hora UTC y la hora "de pared" en timeZone,
 * para un instante dado. Técnica estándar sin librerías externas. */
function getTZOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) === 24 ? 0 : Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return asUTC - date.getTime();
}

/** Medianoche (00:00:00.000) del día, EN la zona horaria dada, devuelta como
 * el instante UTC absoluto correspondiente. */
export function zonedStartOfDay(date: Date, timeZone: string): Date {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const y = Number(map.year);
  const m = Number(map.month);
  const d = Number(map.day);
  const guessUTC = Date.UTC(y, m - 1, d, 0, 0, 0);
  const offset = getTZOffsetMs(new Date(guessUTC), timeZone);
  return new Date(guessUTC - offset);
}

/** Fin de día (23:59:59.999) en la zona horaria dada. */
export function zonedEndOfDay(date: Date, timeZone: string): Date {
  const start = zonedStartOfDay(date, timeZone);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/** Suma/resta días a una fecha, preservando la hora "de pared" en la zona
 * horaria dada (evita sorpresas con cambios de horario de verano). */
export function zonedAddDays(date: Date, days: number, timeZone: string): Date {
  const start = zonedStartOfDay(date, timeZone);
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Construye la medianoche del día y-m-d EN timeZone, como instante UTC. */
export function zonedDateFromYMD(y: number, m: number, d: number, timeZone: string): Date {
  const guessUTC = Date.UTC(y, m - 1, d, 0, 0, 0);
  const offset = getTZOffsetMs(new Date(guessUTC), timeZone);
  return new Date(guessUTC - offset);
}

/** Parsea "YYYY-MM-DD" directamente como medianoche EN timeZone (evita el
 * doble-redondeo de convertir primero a hora local del servidor). */
export function parseYMDInTZ(dateStr: string, timeZone: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return zonedDateFromYMD(y, m, d, timeZone);
}

/** Rango del mes calendario (1º día 00:00 a último día 23:59:59.999) que
 * contiene `date`, en la zona horaria dada. */
export function zonedMonthRange(date: Date, timeZone: string): { start: Date; end: Date } {
  const dtf = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const y = Number(map.year);
  const m = Number(map.month);
  const start = zonedDateFromYMD(y, m, 1, timeZone);
  const nextMonthStart = m === 12 ? zonedDateFromYMD(y + 1, 1, 1, timeZone) : zonedDateFromYMD(y, m + 1, 1, timeZone);
  const end = new Date(nextMonthStart.getTime() - 1);
  return { start, end };
}

/** Formatea "YYYY-MM-DD" de una fecha, EN timeZone (para prellenar inputs
 * type="date"). */
export function formatYMDInTZ(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    date,
  );
}

/** Formatea una fecha/hora en la zona horaria del usuario, en español. */
export function formatTimeInTZ(date: Date, timeZone: string): string {
  return date.toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}

export function formatDateTimeInTZ(date: Date, timeZone: string): string {
  return date.toLocaleString("es-CR", { timeZone });
}

export function formatDateInTZ(date: Date, timeZone: string): string {
  return date.toLocaleDateString("es-CR", { timeZone });
}

/** Minutos desde medianoche (en la zona horaria dada) — para posicionar
 * puntos en el gráfico de "Día" según la hora real del usuario. */
export function minutesSinceMidnightInTZ(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const hour = Number(map.hour) === 24 ? 0 : Number(map.hour);
  return hour * 60 + Number(map.minute);
}