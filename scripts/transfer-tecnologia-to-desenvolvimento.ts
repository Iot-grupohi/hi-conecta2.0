import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const source = await prisma.department.findFirst({ where: { name: "Tecnologia" } });
  const target = await prisma.department.findFirst({ where: { name: "Desenvolvimento" } });

  if (!source) throw new Error('Departamento "Tecnologia" não encontrado.');
  if (!target) throw new Error('Departamento "Desenvolvimento" não encontrado.');

  const employees = await prisma.employee.findMany({
    where: { departmentId: source.id },
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
  });

  const empResult = await prisma.employee.updateMany({
    where: { departmentId: source.id },
    data: { departmentId: target.id },
  });

  const [vacations, aso, benefits, transport] = await Promise.all([
    prisma.vacation.updateMany({
      where: {
        OR: [{ departmentId: source.id }, { departmentName: "Tecnologia" }],
      },
      data: { departmentId: target.id, departmentName: target.name },
    }),
    prisma.asoExam.updateMany({
      where: { departmentName: "Tecnologia" },
      data: { departmentName: target.name },
    }),
    prisma.benefitCredit.updateMany({
      where: { departmentName: "Tecnologia" },
      data: { departmentName: target.name },
    }),
    prisma.transportCredit.updateMany({
      where: { departmentName: "Tecnologia" },
      data: { departmentName: target.name },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        from: { id: source.id, name: source.name },
        to: { id: target.id, name: target.name },
        employeesMoved: empResult.count,
        employees,
        related: {
          vacations: vacations.count,
          aso: aso.count,
          benefits: benefits.count,
          transport: transport.count,
        },
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
  .finally(() => prisma["$disconnect"]());
