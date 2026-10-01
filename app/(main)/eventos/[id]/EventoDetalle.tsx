"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface InsulinRegimenOption {
  id: string;
  insulinName: string;
}

interface EventData {
  id: string;
  type: "LOW" | "HIGH";
  status: "OPEN" | "RESOLVED" | "CLOSED" | "NEEDS_REVIEW";
  symptoms: string | null;
  notes: string | null;
  startedAt: string;
  resolvedAt: string | null;
  endedAt: string | null;
  initialGlucoseReading: { glucoseValue: number; unit: string; measurementSource: string; timestamp: string };
  interventions: {
    id: string;
    type: "CARBOHYDRATE" | "INSULIN";
    food: string | null;
    carbohydrateGrams: number | null;
    timestamp: string;
    insulinEvent: { dose: number; doseUnit: string } | null;
  }[];
  measurements: {
    id: string;
    createdAt: string;
    glucoseReading: { glucoseValue: number; unit: string; measurementSource: string; timestamp: string };
  }[];
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: "🟡 En curso",
  RESOLVED: "🟢 Resuelto por el paciente",
  CLOSED: "⚪ Cerrado",
  NEEDS_REVIEW: "🔵 Requiere revisión",
};

export default function EventoDetalle({
  initialEvent,
  insulinRegimens,
}: {
  initialEvent: EventData;
  insulinRegimens: InsulinRegimenOption[];
}) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [interventionType, setInterventionType] = useState<"CARBOHYDRATE" | "INSULIN">(
    event.type === "LOW" ? "CARBOHYDRATE" : "INSULIN",
  );
  const [food, setFood] = useState("");
  const [grams, setGrams] = useState("");
  const [regimenId, setRegimenId] = useState("");
  const [dose, setDose] = useState("");

  const [measurementValue, setMeasurementValue] = useState("");
  const [measurementSource, setMeasurementSource] = useState<"BLOOD" | "CGM" | "">("");

  const isClosed = event.status === "CLOSED";

  async function refresh() {
    router.refresh();
  }

  async function addIntervention(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/eventos-glucosa/${event.id}/intervencion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          interventionType === "CARBOHYDRATE"
            ? { type: "CARBOHYDRATE", food: food || undefined, carbohydrateGrams: Number(grams) }
            : { type: "INSULIN", insulinRegimenId: regimenId, dose: Number(dose) },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo registrar la intervención.");
        return;
      }
      setFood("");
      setGrams("");
      setDose("");
      await refresh();
    } catch {
      setError("Ocurrió un error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  async function addMeasurement(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!measurementSource) {
      setError("Indica cómo mediste.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/eventos-glucosa/${event.id}/medicion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ glucoseValue: Number(measurementValue), measurementSource }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo registrar la medición.");
        return;
      }
      setMeasurementValue("");
      await refresh();
    } catch {
      setError("Ocurrió un error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  async function markResolved() {
    setLoading(true);
    try {
      const res = await fetch(`/api/eventos-glucosa/${event.id}/resolver`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setEvent((prev) => ({ ...prev, status: data.event.status, resolvedAt: data.event.resolvedAt }));
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  async function closeEvent() {
    setLoading(true);
    try {
      const res = await fetch(`/api/eventos-glucosa/${event.id}/cerrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) setEvent((prev) => ({ ...prev, status: data.event.status, endedAt: data.event.endedAt }));
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="summary-section">
        <h2>
          {event.type === "LOW" ? "🔻 Evento de glucosa baja" : "🔺 Evento de glucosa alta"} —{" "}
          {STATUS_LABELS[event.status]}
        </h2>
        <p>
          <strong>Glucosa inicial:</strong> {event.initialGlucoseReading.glucoseValue}{" "}
          {event.initialGlucoseReading.unit === "MGDL" ? "mg/dL" : "mmol/L"} (
          {event.initialGlucoseReading.measurementSource === "BLOOD" ? "sangre" : "CGM"})
        </p>
        {event.symptoms && <p>Síntomas: {event.symptoms}</p>}
        {event.notes && <p>Notas: {event.notes}</p>}
      </div>

      <div className="summary-section">
        <h3>Intervenciones</h3>
        {event.interventions.length === 0 ? (
          <p className="form-hint">Todavía no hay intervenciones registradas.</p>
        ) : (
          <ul className="event-list">
            {event.interventions.map((i) => (
              <li key={i.id} className="event-item">
                {i.type === "CARBOHYDRATE" ? (
                  <span>
                    🍯 {i.food || "Carbohidratos"} — {i.carbohydrateGrams} g
                  </span>
                ) : (
                  <span>
                    💉 Insulina — {i.insulinEvent?.dose} {i.insulinEvent?.doseUnit}
                  </span>
                )}
                <span className="event-time">{new Date(i.timestamp).toLocaleTimeString("es-CR")}</span>
              </li>
            ))}
          </ul>
        )}

        {!isClosed && (
          <form onSubmit={addIntervention} className="card-form">
            <fieldset className="source-toggle">
              <legend>Nueva intervención</legend>
              <label className={`source-option ${interventionType === "CARBOHYDRATE" ? "selected" : ""}`}>
                <input
                  type="radio"
                  checked={interventionType === "CARBOHYDRATE"}
                  onChange={() => setInterventionType("CARBOHYDRATE")}
                />
                🍯 Carbohidratos
              </label>
              <label className={`source-option ${interventionType === "INSULIN" ? "selected" : ""}`}>
                <input
                  type="radio"
                  checked={interventionType === "INSULIN"}
                  onChange={() => setInterventionType("INSULIN")}
                />
                💉 Insulina
              </label>
            </fieldset>

            {interventionType === "CARBOHYDRATE" ? (
              <>
                <label>
                  Alimento (opcional)
                  <input type="text" placeholder="p. ej. Miel" value={food} onChange={(e) => setFood(e.target.value)} />
                </label>
                <label>
                  Carbohidratos (gramos)
                  <input type="number" required value={grams} onChange={(e) => setGrams(e.target.value)} />
                </label>
              </>
            ) : (
              <>
                <label>
                  Insulina
                  <select value={regimenId} onChange={(e) => setRegimenId(e.target.value)} required>
                    <option value="">Selecciona</option>
                    {insulinRegimens.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.insulinName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Unidades administradas
                  <input type="number" step="0.5" required value={dose} onChange={(e) => setDose(e.target.value)} />
                </label>
              </>
            )}
            <button type="submit" disabled={loading}>
              Registrar intervención
            </button>
          </form>
        )}
      </div>

      <div className="summary-section">
        <h3>Mediciones de seguimiento</h3>
        {event.measurements.length === 0 ? (
          <p className="form-hint">Todavía no hay mediciones de seguimiento.</p>
        ) : (
          <ul className="event-list">
            {event.measurements.map((m) => (
              <li key={m.id} className="event-item">
                <span>
                  {m.glucoseReading.measurementSource === "BLOOD" ? "🩸" : "📡"} {m.glucoseReading.glucoseValue}{" "}
                  {m.glucoseReading.unit === "MGDL" ? "mg/dL" : "mmol/L"}
                </span>
                <span className="event-time">{new Date(m.glucoseReading.timestamp).toLocaleTimeString("es-CR")}</span>
              </li>
            ))}
          </ul>
        )}

        {!isClosed && (
          <form onSubmit={addMeasurement} className="card-form">
            <label>
              Nueva glucosa
              <input
                type="number"
                required
                value={measurementValue}
                onChange={(e) => setMeasurementValue(e.target.value)}
              />
            </label>
            <fieldset className="source-toggle">
              <legend>Método</legend>
              <label className={`source-option ${measurementSource === "BLOOD" ? "selected" : ""}`}>
                <input type="radio" checked={measurementSource === "BLOOD"} onChange={() => setMeasurementSource("BLOOD")} />
                🩸 Sangre
              </label>
              <label className={`source-option ${measurementSource === "CGM" ? "selected" : ""}`}>
                <input type="radio" checked={measurementSource === "CGM"} onChange={() => setMeasurementSource("CGM")} />
                📡 CGM
              </label>
            </fieldset>
            <button type="submit" disabled={loading}>
              Registrar medición
            </button>
          </form>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      {!isClosed && (
        <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
          {event.status !== "RESOLVED" && (
            <button type="button" className="secondary-button" onClick={markResolved} disabled={loading}>
              Marcar como resuelto
            </button>
          )}
          <button type="button" style={{ background: "var(--color-text-muted)" }} onClick={closeEvent} disabled={loading}>
            Cerrar evento
          </button>
        </div>
      )}
    </div>
  );
}
