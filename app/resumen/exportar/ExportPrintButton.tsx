"use client";

export default function ExportPrintButton() {
  return (
    <button type="button" className="no-print" onClick={() => window.print()}>
      🖨️ Guardar como PDF
    </button>
  );
}
