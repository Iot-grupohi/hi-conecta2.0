import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEmployeeById, getEmployeeHistory } from "@/lib/data";

export async function requireMyEmployee() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const employeeId = session.user.employeeId;
  if (!employeeId) {
    return { session, employee: null, history: null } as const;
  }

  const [employee, history] = await Promise.all([
    getEmployeeById(employeeId),
    getEmployeeHistory(employeeId),
  ]);

  return { session, employee, history } as const;
}
