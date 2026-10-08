import { notFound } from "next/navigation";
import { EmployeeDetailView } from "@/features/employees/employee-detail-view";
import { getEmployeeById, getEmployeeHistory } from "@/lib/data";
import { auth } from "@/auth";
import { safeEmployeesReturnTo } from "@/lib/utils";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo: returnToParam } = await searchParams;
  const [employee, history, session] = await Promise.all([
    getEmployeeById(id),
    getEmployeeHistory(id),
    auth(),
  ]);
  if (!employee) notFound();

  return (
    <EmployeeDetailView
      employee={employee}
      history={history}
      permissions={session?.user.permissions ?? []}
      returnTo={safeEmployeesReturnTo(returnToParam)}
    />
  );
}
