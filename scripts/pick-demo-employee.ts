import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const withHistory = await prisma.employee.findFirst({
    where: {
      status: "ativo",
      vacations: { some: {} },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const any = await prisma.employee.findFirst({
    where: { status: "ativo" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  console.log(JSON.stringify({ withHistory, any }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
