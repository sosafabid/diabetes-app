"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Batch {
  id: string;
  fileName: string;
  sourceType: "BLOOD" | "CGM";
  deviceManufacturer: string | null;
  deviceModel: string | null;
  importedAt: string;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  importedRows: number;
  duplicateRows: number;
  errorRows: number;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  COMPLETED: "Completado",
  PARTIAL: "Parcial (con duplicados u errores omitidos)",
  FAILED: "Falló",
  REVERTED: "Revertido",
};

export default function HistorialImportaciones({ initialBatches }: { initialBatches: Batch[] }) {
  const router = useRouter();
  const [batches, setBatches] = useState(initialBatches);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/import/batches/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBatches((prev) => prev.filter((b) => b.id !== id));
        router.refresh();
      }
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  if (batches.length === 0) {
    return (
      <div className="empty-state">
        <p>Todavía no has importado ningún archivo.</p>
      </div>
    );
  }

  return (
    <ul className="event-list">
      {batches.map((b) => (
        <li key={b.id} className="card" style={{ display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {b.deviceManufacturer ? `${b.deviceManufacturer}${b.deviceModel ? " " + b.deviceModel : ""}` : b.fileName}
              </p>
              <p className="form-hint" style={{ margin: "0.25rem 0" }}>
                {b.sourceType === "BLOOD" ? "🩸 Sangre" : "📡 CGM"} · Importado:{" "}
                {new Date(b.importedAt).toLocaleDateString("es-CR")}
              </p>
              {b.dateRangeStart && b.dateRangeEnd && (
                <p className="form-hint" style={{ margin: "0.25rem 0" }}>
                  {new Date(b.dateRangeStart).toLocaleDateString("es-CR")} –{" "}
                  {new Date(b.dateRangeEnd).toLocaleDateString("es-CR")}
                </p>
              )}
              <p style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}>
                {b.importedRows} registros · {b.duplicateRows} duplicados omitidos ·{" "}
                {b.errorRows} errores omitidos · {STATUS_LABELS[b.status] ?? b.status}
              </p>
            </div>
            {confirmingId === b.id ? (
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  style={{ background: "var(--color-danger)" }}
                  disabled={deletingId === b.id}
                  onClick={() => handleDelete(b.id)}
                >
                  {deletingId === b.id ? "Eliminando..." : "Confirmar"}
                </button>
                <button type="button" className="secondary-button" onClick={() => setConfirmingId(null)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button type="button" className="secondary-button" onClick={() => setConfirmingId(b.id)}>
                Eliminar
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
