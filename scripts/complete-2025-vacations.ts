/**
 * Marca como concluída todas as férias programadas com período em 2025.
 * Uso: npx tsx scripts/complete-2025-vacations.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const programmed = await prisma.vacation.findMany({
    where: { status: "programada" },
    select: {
      id: true,
      employeeName: true,
      startDate: true,
      endDate: true,
      createdAt: true,
    },
  });

  const ids = programmed
    .filter((v) => {
      const years = [v.startDate, v.endDate, v.createdAt]
        .filter(Boolean)
        .map((d) => (d as Date).getFullYear());
      return years.includes(2025);
    })
    .map((v) => v.id);

  if (ids.length === 0) {
    console.log(JSON.stringify({ updated: 0, message: "Nenhuma férias programada de 2025." }));
    return;
  }

  const result = await prisma.vacation.updateMany({
    where: { id: { in: ids }, status: "programada" },
    data: { status: "concluida" },
  });

  console.log(
    JSON.stringify(
      {
        candidates: ids.length,
        updated: result.count,
        sample: programmed
          .filter((v) => ids.includes(v.id))
          .slice(0, 8)
          .map((v) => ({
            name: v.employeeName,
            start: v.startDate?.toISOString().slice(0, 10) ?? null,
            end: v.endDate?.toISOString().slice(0, 10) ?? null,
          })),
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
