import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // DONO / sócio sem setor -> Expansão
  const owners = await prisma.employee.findMany({
    where: {
      departmentId: null,
      OR: [
        { contractType: { contains: "DONO" } },
        { contractType: { contains: "Dono" } },
        { contractType: { contains: "SÓCIO" } },
        { contractType: { contains: "Sócio" } },
        { contractType: { contains: "SOCIO" } },
      ],
    },
  });

  for (const employee of owners) {
    await prisma.employee.update({
      where: { id: employee.id },
      data: { departmentId: "dep_002" },
    });
  }

  const remainingActive = await prisma.employee.findMany({
    where: { departmentId: null, status: { not: "desligado" } },
    select: { id: true, name: true, contractType: true },
  });

  // Placeholder / invalid rows without cargo stay without setor
  console.log(
    JSON.stringify(
      {
        ownersLinked: owners.length,
        remainingActiveWithoutDept: remainingActive.length,
        remainingActive,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
