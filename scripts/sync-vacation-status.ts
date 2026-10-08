/**
 * Sincroniza status do colaborador com férias em gozo (hoje entre início e fim).
 * - Em gozo → status "ferias"
 * - Quem estava "ferias" sem período atual → volta para "ativo"
 *
 * Uso: npx tsx scripts/sync-vacation-status.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const vacations = await prisma.vacation.findMany({
    where: { status: { in: ["programada", "concluida"] } },
    select: { employeeId: true, startDate: true, endDate: true, employeeName: true },
  });

  const onVacationIds = new Set<string>();
  for (const v of vacations) {
    if (!v.employeeId || !v.startDate) continue;
    const start = new Date(v.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(v.endDate ?? v.startDate);
    end.setHours(23, 59, 59, 999);
    if (today >= start && today <= end) onVacationIds.add(v.employeeId);
  }

  const setFerias = await prisma.employee.updateMany({
    where: {
      id: { in: Array.from(onVacationIds) },
      status: { not: "desligado" },
    },
    data: { status: "ferias" },
  });

  const restoreAtivo = await prisma.employee.updateMany({
    where: {
      status: "ferias",
      ...(onVacationIds.size > 0 ? { id: { notIn: Array.from(onVacationIds) } } : {}),
    },
    data: { status: "ativo" },
  });

  console.log(
    JSON.stringify(
      {
        today: today.toISOString().slice(0, 10),
        inProgressEmployees: onVacationIds.size,
        setToFerias: setFerias.count,
        restoredToAtivo: restoreAtivo.count,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
