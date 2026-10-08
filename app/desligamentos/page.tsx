import { PageHeader } from "@/components/ui/page-header";
import { TerminationsTable } from "@/features/terminations/terminations-table";
import { getHrData } from "@/lib/data";
import { auth } from "@/auth";
import { canWriteHr } from "@/lib/hr-write";

export default async function TerminationsPage() {
  const [data, session] = await Promise.all([getHrData(), auth()]);

  return (
    <div>
      <PageHeader
        title="Desligamentos"
        description="Rescisões com cálculo de custo demissional (valor da rescisão + GRRF) e totais."
      />
      <TerminationsTable
        items={data.terminations}
        employees={data.employees.map((e) => ({ id: e.id, name: e.name }))}
        canWrite={canWriteHr(session?.user.permissions ?? [])}
      />
    </div>
  );
}
