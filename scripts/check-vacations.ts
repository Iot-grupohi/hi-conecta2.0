import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const recent = await prisma.vacation.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      id: true,
      employeeId: true,
      employeeName: true,
      status: true,
      startDate: true,
      endDate: true,
      days: true,
      notes: true,
      rhNotes: true,
      createdAt: true,
    },
  });
  const pending = await prisma.vacation.count({
    where: { status: { in: ["pendente", "solicitar"] } },
  });
  const user = await prisma.user.findUnique({
    where: { email: "colaborador@hiconecta.local" },
    select: { id: true, name: true, employeeId: true, role: true },
  });
  const portal = recent.filter((v) => v.id.startsWith("vac_req_"));
  console.log(JSON.stringify({ pending, user, portal, recent }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
