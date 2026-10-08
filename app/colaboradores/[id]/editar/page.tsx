import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmployeeForm } from "@/features/employees/employee-form";
import { auth } from "@/auth";
import { getDepartments, getEmployeeById, getPositions } from "@/lib/data";
import { hasPermission } from "@/lib/permissions";
import { safeEmployeesReturnTo } from "@/lib/utils";

export default async function EditEmployeePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo: returnToParam } = await searchParams;
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "employees:update")) {
    redirect("/colaboradores");
  }

  const [employee, departments, positions] = await Promise.all([
    getEmployeeById(id),
    getDepartments(),
    getPositions(),
  ]);

  if (!employee) notFound();

  const returnTo = safeEmployeesReturnTo(returnToParam);

  return (
    <div>
      <PageHeader
        title="Editar colaborador"
        description={`Atualizando cadastro de ${employee.name}`}
      />
      <EmployeeForm
        mode="edit"
        employee={employee}
        departments={departments}
        positions={positions}
        canViewSalary={hasPermission(session.user.role, "salary:read")}
        returnTo={returnTo}
      />
    </div>
  );
}
