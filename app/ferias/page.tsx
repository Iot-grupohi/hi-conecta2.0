import { VacationsBoard } from "@/features/vacations/vacations-board";
import { getHrData } from "@/lib/data";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { canWriteHr } from "@/lib/hr-write";

export default async function VacationsPage() {
  const [data, session] = await Promise.all([getHrData(), auth()]);
  const canApprove = Boolean(
    session?.user && hasPermission(session.user.role, "employees:update"),
  );
  const permissions = session?.user.permissions ?? [];

  return (
    <VacationsBoard
      items={data.vacations}
      canApprove={canApprove}
      canWrite={canWriteHr(permissions)}
      employees={data.employees.map((e) => ({ id: e.id, name: e.name }))}
    />
  );
}
