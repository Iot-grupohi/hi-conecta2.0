import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const employee = await prisma.employee.findFirst({
    where: { status: "ativo" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  if (!employee) {
    throw new Error("Nenhum colaborador ativo encontrado para vincular.");
  }

  const passwordHash = await bcrypt.hash("cola123", 10);
  const user = await prisma.user.upsert({
    where: { email: "colaborador@hiconecta.local" },
    update: {
      name: employee.name,
      role: "COLABORADOR",
      employeeId: employee.id,
      passwordHash,
      active: true,
    },
    create: {
      name: employee.name,
      email: "colaborador@hiconecta.local",
      passwordHash,
      role: "COLABORADOR",
      employeeId: employee.id,
      active: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employeeName: employee.name,
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
  .finally(() => prisma.$disconnect());
