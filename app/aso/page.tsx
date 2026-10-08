import { PageHeader } from "@/components/ui/page-header";
import { AsoTable } from "@/features/aso/aso-table";
import { getHrData } from "@/lib/data";
import { auth } from "@/auth";
import { canWriteHr } from "@/lib/hr-write";

export default async function AsoPage() {
  const [data, session] = await Promise.all([getHrData(), auth()]);
  return (
    <div>
      <PageHeader
        title="Exames ocupacionais (ASO)"
        description="Controle admissionais e periódicos com filtros de pendência."
      />
      <AsoTable
        items={data.asoExams}
        employees={data.employees.map((e) => ({ id: e.id, name: e.name }))}
        canWrite={canWriteHr(session?.user.permissions ?? [])}
      />
    </div>
  );
}
