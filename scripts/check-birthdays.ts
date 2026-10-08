import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();
  const month = new Date().getMonth();
  const all = await p.employee.findMany({
    where: { birthDate: { not: null } },
    select: { name: true, status: true, birthDate: true },
  });
  const thisMonth = all.filter((e) => e.birthDate && e.birthDate.getUTCMonth() === month);
  const byStatus: Record<string, number> = {};
  for (const e of thisMonth) byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  console.log({
    month,
    totalThisMonth: thisMonth.length,
    byStatus,
    ativos: thisMonth.filter((e) => e.status === "ativo").map((e) => `${e.name} | ${e.birthDate?.toISOString().slice(5, 10)}`),
  });
  await p.$disconnect();
}

main();
