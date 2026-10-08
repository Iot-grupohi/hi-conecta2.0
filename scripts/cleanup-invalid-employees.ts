import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function shouldDelete(name: string) {
  const trimmed = name.trim().replace(/\s+/g, " ");
  const key = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (!trimmed) return true;
  if (key === "nome" || key === "name" || key === "teste") return true;
  if (key.includes("excluir") || key.includes("exclusao") || key.includes("excluir no mes")) {
    return true;
  }

  // Sem sobrenome: uma única palavra (sem espaço)
  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length < 2) return true;

  return false;
}

async function main() {
  const employees = await prisma.employee.findMany({
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
  });

  const toDelete = employees.filter((employee) => shouldDelete(employee.name));
  console.log(
    JSON.stringify(
      {
        total: employees.length,
        toDelete: toDelete.length,
        names: toDelete.map((e) => e.name),
      },
      null,
      2,
    ),
  );

  for (const employee of toDelete) {
    // Clear FKs that may block delete
    await prisma.vacation.updateMany({
      where: { employeeId: employee.id },
      data: { employeeId: null },
    });
    await prisma.termination.updateMany({
      where: { employeeId: employee.id },
      data: { employeeId: null },
    });
    await prisma.leave.updateMany({
      where: { employeeId: employee.id },
      data: { employeeId: null },
    });
    await prisma.probationPeriod.updateMany({
      where: { employeeId: employee.id },
      data: { employeeId: null },
    });
    await prisma.asoExam.updateMany({
      where: { employeeId: employee.id },
      data: { employeeId: null },
    });
    await prisma.healthInsurance.deleteMany({ where: { employeeId: employee.id } });
    await prisma.employeeDocument.deleteMany({ where: { employeeId: employee.id } });
    await prisma.employee.delete({ where: { id: employee.id } });
  }

  console.log(`Deleted ${toDelete.length} employees.`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
