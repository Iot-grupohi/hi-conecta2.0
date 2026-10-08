/**
 * Marca como concluída todas as férias programadas cujo período já passou
 * (término < hoje; se não houver término, início < hoje).
 * Uso: npx tsx scripts/complete-past-vacations.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const programmed = await prisma.vacation.findMany({
    where: { status: "programada" },
    select: {
      id: true,
      employeeName: true,
      startDate: true,
      endDate: true,
    },
  });

  const past = programmed.filter((v) => {
    const end = v.endDate ?? v.startDate;
    if (!end) return false;
    const day = new Date(end);
    day.setHours(0, 0, 0, 0);
    return day < today;
  });

  const ids = past.map((v) => v.id);

  if (ids.length === 0) {
    console.log(
      JSON.stringify({
        today: today.toISOString().slice(0, 10),
        updated: 0,
        message: "Nenhuma férias programada anterior à data atual.",
      }),
    );
    return;
  }

  const result = await prisma.vacation.updateMany({
    where: { id: { in: ids }, status: "programada" },
    data: { status: "concluida" },
  });

  console.log(
    JSON.stringify(
      {
        today: today.toISOString().slice(0, 10),
        candidates: ids.length,
        updated: result.count,
        sample: past.slice(0, 10).map((v) => ({
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
