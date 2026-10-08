import { UsersBoard } from "@/features/users/users-board";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "users:manage")) {
    redirect("/");
  }

  const [users, employees] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({
      where: { status: { not: "desligado" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <UsersBoard
      users={users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        employeeId: user.employeeId,
      }))}
      employees={employees}
      canManage
    />
  );
}
