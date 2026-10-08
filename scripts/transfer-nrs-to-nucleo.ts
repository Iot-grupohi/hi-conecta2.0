/**
 * Transfere colaboradores do departamento NRS para
 * Núcleo de Relacionamento e Suporte.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const source = await prisma.department.findFirst({ where: { name: "NRS" } });
  const target = await prisma.department.findFirst({
    where: { name: "Núcleo de Relacionamento e Suporte" },
  });

  if (!source) throw new Error("Departamento NRS não encontrado.");
  if (!target) throw new Error("Departamento Núcleo de Relacionamento e Suporte não encontrado.");

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
        OR: [{ departmentId: source.id }, { departmentName: "NRS" }],
      },
      data: { departmentId: target.id, departmentName: target.name },
    }),
    prisma.asoExam.updateMany({
      where: { departmentName: "NRS" },
      data: { departmentName: target.name },
    }),
    prisma.benefitCredit.updateMany({
      where: { departmentName: "NRS" },
      data: { departmentName: target.name },
    }),
    prisma.transportCredit.updateMany({
      where: { departmentName: "NRS" },
      data: { departmentName: target.name },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        from: { id: source.id, name: source.name },
        to: { id: target.id, name: target.name },
        employeesMoved: empResult.count,
        employees: employees.map((e) => ({ id: e.id, name: e.name, status: e.status })),
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
