import { EmployeesListView } from "@/features/employees/employees-list-view";
import { getHrData } from "@/lib/data";
import { auth } from "@/auth";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ cargo?: string; setor?: string; q?: string; status?: string }>;
}) {
  const [data, session, params] = await Promise.all([getHrData(), auth(), searchParams]);
  return (
    <EmployeesListView
      employees={data.employees}
      departments={data.departments}
      positions={data.positions}
      permissions={session?.user.permissions ?? []}
      initialDepartmentId={params.setor ?? "todos"}
      initialPositionId={params.cargo ?? "todos"}
      initialQuery={params.q ?? ""}
      initialStatus={params.status ?? "todos"}
    />
  );
}
