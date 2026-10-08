import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const positions = await prisma.position.findMany({
    where: {
      OR: [
        { name: { contains: "Oerador" } },
        { name: { contains: "Lavanderia" } },
        { name: { contains: "Perfomance" } },
        { name: { contains: "RELK" } },
        { name: { contains: "BUSSINESS" } },
        { name: { contains: "Tecnico" } },
      ],
    },
    select: { id: true, name: true },
  });
  const departments = await prisma.department.findMany({
    where: {
      OR: [{ name: { contains: "Perfomance" } }, { name: { contains: "Tecnico" } }],
    },
    select: { id: true, name: true },
  });
  console.log({ positions, departments });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
