// ============================================================================
// NotificationEngine
// ============================================================================
// Genera recordatorios/alarmas (sección 21). Todas las reglas de tiempo son
// configurables por el paciente — ninguna se presenta como regla universal
// obligatoria. Diseñado para poder silenciarse por tipo, evitando fatiga de
// alarmas.
// ============================================================================

export type NotificationType =
  | "POST_MEAL_CHECK"
  | "HYPOGLYCEMIA_ALERT"
  | "SCHEDULED_INSULIN"
  | "LOGGING_REMINDER";

export interface NotificationPreferences {
  postMealCheckMinutes?: number; // configurable; sin valor por defecto forzado
  enabledTypes: Record<NotificationType, boolean>;
}

export interface GeneratedNotification {
  type: NotificationType;
  messageEs: string;
  scheduledFor: string; // ISO 8601
}

export class NotificationEngine {
  scheduleFromMeal(
    mealTimestamp: string,
    prefs: NotificationPreferences,
  ): GeneratedNotification | null {
    if (!prefs.enabledTypes.POST_MEAL_CHECK) return null;
    const minutes = prefs.postMealCheckMinutes;
    if (!minutes) return null; // el intervalo debe ser configurado por el usuario, no asumido

    const scheduledFor = new Date(
      new Date(mealTimestamp).getTime() + minutes * 60000,
    ).toISOString();

    return {
      type: "POST_MEAL_CHECK",
      messageEs: "Es hora de revisar tu glucosa según tu plan de seguimiento.",
      scheduledFor,
    };
  }

  fromLowGlucoseAlert(timestamp: string): GeneratedNotification {
    return {
      type: "HYPOGLYCEMIA_ALERT",
      messageEs:
        "Se registró una glucosa baja. Sigue tu plan de tratamiento de hipoglucemia y vuelve a medir según lo indicado.",
      scheduledFor: timestamp,
    };
  }

  scheduledInsulinReminder(
    scheduledTime: string,
    insulinNameEs: string,
  ): GeneratedNotification {
    return {
      type: "SCHEDULED_INSULIN",
      messageEs: `Recordatorio: dosis programada de ${insulinNameEs}.`,
      scheduledFor: scheduledTime,
    };
  }
}
