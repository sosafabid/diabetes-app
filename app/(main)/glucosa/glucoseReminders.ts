"use client";

// ============================================================================
// Recordatorios de re-medición cuando la glucosa sale alta o baja.
// ============================================================================
// Usa notificaciones LOCALES (@capacitor/local-notifications) — se programan
// directo en el dispositivo, sin necesidad de un servidor de push (Firebase/
// APNs). Esto las hace mucho más simples y confiables para un MVP: no hay
// tokens de dispositivo que guardar, ni backend de push que mantener.
//
// Supuestos que asumí (fácil de ajustar, son solo las constantes de abajo):
//   - Alta: recordatorio cada hora, por 2 horas → 2 avisos (a +60 y +120 min)
//   - Baja: cada 15 minutos, por 2 horas → 8 avisos (a +15, +30, ..., +120)
//     (la duración de 2h para "baja" no la especificaste — la igualé a la
//     de "alta" por consistencia; cámbiala en LOW_OFFSETS_MIN si prefieres
//     otra ventana)
//
// Cada nueva lectura CANCELA los recordatorios pendientes del tipo
// correspondiente y, si la nueva lectura sigue fuera de rango, programa una
// tanda nueva — así nunca se acumulan avisos viejos ni siguen sonando
// después de que ya volviste a medir.
//
// En la versión web (navegador, no la app nativa) esto no hace nada — el
// plugin de Capacitor simplemente no está disponible ahí.
// ============================================================================

const HIGH_OFFSETS_MIN = [60, 120];
const LOW_OFFSETS_MIN = [15, 30, 45, 60, 75, 90, 105, 120];

// IDs fijos por "slot" — como solo tiene sentido tener una tanda activa de
// cada tipo a la vez, reusar los mismos IDs y cancelar-antes-de-programar
// evita necesitar una base de datos de notificaciones pendientes.
const HIGH_NOTIFICATION_IDS = HIGH_OFFSETS_MIN.map((_, i) => 9001 + i);
const LOW_NOTIFICATION_IDS = LOW_OFFSETS_MIN.map((_, i) => 9101 + i);

async function getLocalNotifications() {
  // Import dinámico: si el paquete no está disponible (p. ej. corriendo
  // solo la web sin Capacitor instalado), esto no rompe el build.
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return null;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    return LocalNotifications;
  } catch {
    return null;
  }
}

async function cancelIds(LocalNotifications: NonNullable<Awaited<ReturnType<typeof getLocalNotifications>>>, ids: number[]) {
  try {
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
  } catch {
    // No hay nada pendiente con esos IDs — no es un error real.
  }
}

async function scheduleOffsets(
  LocalNotifications: NonNullable<Awaited<ReturnType<typeof getLocalNotifications>>>,
  ids: number[],
  offsetsMin: number[],
  title: string,
  body: string,
) {
  const now = Date.now();
  await LocalNotifications.schedule({
    notifications: ids.map((id, i) => ({
      id,
      title,
      body,
      schedule: { at: new Date(now + offsetsMin[i] * 60 * 1000) },
    })),
  });
}

/**
 * Llamar después de guardar una lectura de glucosa. Cancela cualquier tanda
 * pendiente de recordatorios (alta y baja) y, según el valor nuevo,
 * programa una tanda fresca si corresponde.
 */
export async function updateGlucoseReminders(
  glucoseMgdl: number,
  lowThreshold: number,
  highThreshold: number,
): Promise<void> {
  const LocalNotifications = await getLocalNotifications();
  if (!LocalNotifications) return;

  // Siempre se cancela primero — una lectura nueva siempre reemplaza a la
  // tanda anterior, esté donde esté el valor ahora.
  await cancelIds(LocalNotifications, HIGH_NOTIFICATION_IDS);
  await cancelIds(LocalNotifications, LOW_NOTIFICATION_IDS);

  if (glucoseMgdl < lowThreshold) {
    try {
      await LocalNotifications.requestPermissions();
    } catch {
      return;
    }
    await scheduleOffsets(
      LocalNotifications,
      LOW_NOTIFICATION_IDS,
      LOW_OFFSETS_MIN,
      "Recordatorio: mide tu glucosa",
      "Tu última lectura fue baja. Vuelve a medir para confirmar cómo vas.",
    );
    return;
  }

  if (glucoseMgdl > highThreshold) {
    try {
      await LocalNotifications.requestPermissions();
    } catch {
      return;
    }
    await scheduleOffsets(
      LocalNotifications,
      HIGH_NOTIFICATION_IDS,
      HIGH_OFFSETS_MIN,
      "Recordatorio: mide tu glucosa",
      "Tu última lectura fue alta. Vuelve a medir para confirmar cómo vas.",
    );
  }
}