import { PageHeader } from "@/components/ui/page-header";
import { LeavesTable } from "@/features/leaves/leaves-table";
import { getHrData } from "@/lib/data";
import { auth } from "@/auth";
import { canWriteHr } from "@/lib/hr-write";

export default async function LeavesPage() {
  const [data, session] = await Promise.all([getHrData(), auth()]);
  return (
    <div>
      <PageHeader
        title="Afastamentos"
        description="Controle de afastamentos com busca e ordenação."
      />
      <LeavesTable
        items={data.leaves}
        employees={data.employees.map((e) => ({ id: e.id, name: e.name }))}
        canWrite={canWriteHr(session?.user.permissions ?? [])}
      />
    </div>
  );
}
