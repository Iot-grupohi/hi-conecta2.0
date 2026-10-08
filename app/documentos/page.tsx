import { PageHeader } from "@/components/ui/page-header";
import { DocumentsTable } from "@/features/documents/documents-table";
import { getAllDocuments, getHrData } from "@/lib/data";
import { auth } from "@/auth";
import { canWriteHr } from "@/lib/hr-write";

export default async function DocumentsPage() {
  const [documents, data, session] = await Promise.all([
    getAllDocuments(),
    getHrData(),
    auth(),
  ]);

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Repositório de anexos por colaborador. Envie arquivos aqui ou no perfil."
      />
      <DocumentsTable
        items={documents}
        employees={data.employees.map((e) => ({ id: e.id, name: e.name }))}
        canWrite={canWriteHr(session?.user.permissions ?? [])}
      />
    </div>
  );
}
