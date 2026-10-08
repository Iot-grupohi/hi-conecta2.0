import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const activeNoDept = await prisma.employee.count({
    where: { departmentId: null, status: { not: "desligado" } },
  });
  const totalNoDept = await prisma.employee.count({ where: { departmentId: null } });
  const byDept = await prisma.employee.groupBy({
    by: ["departmentId"],
    where: { status: { not: "desligado" } },
    _count: true,
    orderBy: { _count: { departmentId: "desc" } },
    take: 10,
  });
  console.log({ activeNoDept, totalNoDept, top: byDept });
  await prisma.$disconnect();
}

main();
