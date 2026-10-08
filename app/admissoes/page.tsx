import { PageHeader } from "@/components/ui/page-header";
import { AdmissionsTable } from "@/features/admissions/admissions-table";
import { auth } from "@/auth";
import { getHrData } from "@/lib/data";

export default async function AdmissionsPage() {
  const [data, session] = await Promise.all([getHrData(), auth()]);
  const canViewSalary = session?.user.permissions.includes("salary:read") ?? false;
  const admissions = [...data.employees].filter((employee) => employee.hireDate);

  return (
    <div>
      <PageHeader
        title="Admissões"
        description="Contratações com cálculo de custo admissional (salário + alimentação do mês) e totais."
      />
      <AdmissionsTable items={admissions} canViewSalary={canViewSalary} />
    </div>
  );
}
