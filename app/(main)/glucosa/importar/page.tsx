import Link from "next/link";
import { prisma } from "../../../../src/lib/prisma";
import { requireSession } from "../../../../src/lib/auth-guard";
import ImportarGlucosaFlow from "./ImportarGlucosaFlow";
import HistorialImportaciones from "./HistorialImportaciones";

export default async function ImportarGlucosaPage() {
  const session = await requireSession();
  const batches = await prisma.importBatch.findMany({
    where: { userId: session.userId },
    orderBy: { importedAt: "desc" },
  });

  return (
    <div className="page">
      <h1>Importar datos de glucosa</h1>
      <p className="page-subtitle">
        <Link href="/glucosa">← Volver a Glucosa</Link>
      </p>
      <div className="info-banner">
        <p>Puedes importar datos descargados desde tu sensor o glucómetro (archivo CSV).</p>
        <p>Stay Alive ILU no modifica los valores originales.</p>
        <p>Revisa los datos en la vista previa antes de importarlos — nada se guarda hasta que confirmes.</p>
      </div>

      <ImportarGlucosaFlow />

      <h2 style={{ marginTop: "2rem" }}>Importaciones anteriores</h2>
      <HistorialImportaciones
        initialBatches={batches.map((b) => ({
          id: b.id,
          fileName: b.fileName,
          sourceType: b.sourceType,
          deviceManufacturer: b.deviceManufacturer,
          deviceModel: b.deviceModel,
          importedAt: b.importedAt.toISOString(),
          dateRangeStart: b.dateRangeStart?.toISOString() ?? null,
          dateRangeEnd: b.dateRangeEnd?.toISOString() ?? null,
          importedRows: b.importedRows,
          duplicateRows: b.duplicateRows,
          errorRows: b.errorRows,
          status: b.status,
        }))}
      />
    </div>
  );
}
