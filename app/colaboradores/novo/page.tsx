import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmployeeForm } from "@/features/employees/employee-form";
import { auth } from "@/auth";
import { getDepartments, getPositions } from "@/lib/data";
import { hasPermission } from "@/lib/permissions";

export default async function NewEmployeePage() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "employees:create")) {
    redirect("/colaboradores");
  }

  const [departments, positions] = await Promise.all([getDepartments(), getPositions()]);

  return (
    <div>
      <PageHeader
        title="Novo colaborador"
        description="Cadastre um novo colaborador na base do Hi-Conecta RH."
      />
      <EmployeeForm
        mode="create"
        departments={departments}
        positions={positions}
        canViewSalary={hasPermission(session.user.role, "salary:read")}
      />
    </div>
  );
}
