import { PrismaClient, type EmployeeStatus, type VacationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

type SeedFile = {
  departments: Array<{
    id: string;
    name: string;
    managerName: string | null;
    directorName: string | null;
  }>;
  positions: Array<{
    id: string;
    name: string;
    departmentId: string | null;
  }>;
  employees: Array<{
    id: string;
    name: string;
    cpf: string | null;
    birthDate: string | null;
    hireDate: string | null;
    contractType: string | null;
    positionId: string | null;
    departmentId: string | null;
    managerName: string | null;
    directorName: string | null;
    workScale: string | null;
    workSchedule: string | null;
    salary: number | null;
    mealAllowance: number | null;
    transportBenefit: string | null;
    status: string;
    externalCode: string | null;
    hasHealthInsurance: boolean;
    notes: string | null;
  }>;
  vacations: Array<Record<string, unknown>>;
  terminations: Array<Record<string, unknown>>;
  leaves: Array<Record<string, unknown>>;
  probationPeriods: Array<Record<string, unknown>>;
  asoExams: Array<Record<string, unknown>>;
  healthInsurance: Array<Record<string, unknown>>;
};

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function main() {
  const seedPath = path.join(process.cwd(), "data", "seed.json");
  const seed = JSON.parse(readFileSync(seedPath, "utf8")) as SeedFile;

  console.log("Cleaning database...");
  await prisma.healthInsurance.deleteMany();
  await prisma.asoExam.deleteMany();
  await prisma.probationPeriod.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.termination.deleteMany();
  await prisma.vacation.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding users...");
  const users = [
    { name: "Admin Hi-Conecta", email: "admin@hiconecta.local", password: "admin123", role: "ADMIN" as const },
    { name: "Analista RH", email: "rh@hiconecta.local", password: "rh1234", role: "RH" as const },
    { name: "Gestor Operações", email: "gestor@hiconecta.local", password: "gestor123", role: "GESTOR" as const },
    { name: "Visualizador", email: "viewer@hiconecta.local", password: "viewer123", role: "VIEWER" as const },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        passwordHash: await bcrypt.hash(user.password, 10),
        role: user.role,
      },
    });
  }

  console.log("Seeding departments...");
  for (const department of seed.departments) {
    await prisma.department.create({ data: department });
  }

  console.log("Seeding positions...");
  const positionDept = new Map<string, string | null>();
  for (const position of seed.positions) {
    await prisma.position.create({
      data: {
        id: position.id,
        name: position.name,
        departmentId: position.departmentId,
      },
    });
    positionDept.set(position.id, position.departmentId);
  }

  console.log(`Seeding ${seed.employees.length} employees...`);
  for (const employee of seed.employees) {
    const departmentId =
      employee.departmentId ??
      (employee.positionId ? positionDept.get(employee.positionId) ?? null : null);

    await prisma.employee.create({
      data: {
        id: employee.id,
        name: employee.name,
        cpf: employee.cpf,
        birthDate: parseDate(employee.birthDate),
        hireDate: parseDate(employee.hireDate),
        contractType: employee.contractType,
        positionId: employee.positionId,
        departmentId,
        managerName: employee.managerName,
        directorName: employee.directorName,
        workScale: employee.workScale,
        workSchedule: employee.workSchedule,
        salary: employee.salary,
        mealAllowance: employee.mealAllowance,
        transportBenefit: employee.transportBenefit,
        status: employee.status as EmployeeStatus,
        externalCode: employee.externalCode,
        hasHealthInsurance: employee.hasHealthInsurance,
        notes: employee.notes,
      },
    });
  }

  console.log("Seeding collaborator portal user...");
  const demoEmployee =
    seed.employees.find((employee) => employee.status === "ativo" && employee.id) ??
    seed.employees[0];
  if (demoEmployee) {
    await prisma.user.create({
      data: {
        name: demoEmployee.name,
        email: "colaborador@hiconecta.local",
        passwordHash: await bcrypt.hash("cola123", 10),
        role: "COLABORADOR",
        employeeId: demoEmployee.id,
      },
    });
  }

  console.log("Seeding vacations...");
  for (const vacation of seed.vacations) {
    await prisma.vacation.create({
      data: {
        id: String(vacation.id),
        employeeId: (vacation.employeeId as string | null) ?? null,
        employeeName: String(vacation.employeeName),
        departmentId: (vacation.departmentId as string | null) ?? null,
        departmentName: (vacation.departmentName as string | null) ?? null,
        acquisitionPeriod: (vacation.acquisitionPeriod as string | null) ?? null,
        deadlineDate: parseDate(vacation.deadlineDate),
        startDate: parseDate(vacation.startDate),
        endDate: parseDate(vacation.endDate),
        days: (vacation.days as number | null) ?? null,
        status: (vacation.status as VacationStatus) ?? "pendente",
        value: (vacation.value as number | null) ?? null,
        paymentDate: parseDate(vacation.paymentDate),
        dueDate: parseDate(vacation.dueDate),
        pecuniaryAllowance: Boolean(vacation.pecuniaryAllowance),
      },
    });
  }

  console.log("Seeding terminations...");
  for (const item of seed.terminations) {
    await prisma.termination.create({
      data: {
        id: String(item.id),
        employeeId: (item.employeeId as string | null) ?? null,
        employeeName: String(item.employeeName),
        terminationType: String(item.terminationType),
        terminationTypeLabel: (item.terminationTypeLabel as string | null) ?? null,
        noticeType: (item.noticeType as string | null) ?? null,
        noticeStartDate: parseDate(item.noticeStartDate),
        lastWorkDay: parseDate(item.lastWorkDay),
        noticeEndDate: parseDate(item.noticeEndDate),
        paymentDate: parseDate(item.paymentDate),
        dueDate: parseDate(item.dueDate),
        value: (item.value as number | null) ?? null,
        grrfValue: (item.grrfValue as number | null) ?? null,
        grrfDueDate: parseDate(item.grrfDueDate),
      },
    });
  }

  console.log("Seeding leaves...");
  for (const item of seed.leaves) {
    await prisma.leave.create({
      data: {
        id: String(item.id),
        employeeId: (item.employeeId as string | null) ?? null,
        employeeName: String(item.employeeName),
        days: (item.days as number | null) ?? null,
        startDate: parseDate(item.startDate),
        endDate: parseDate(item.endDate),
        cid: (item.cid as string | null) ?? null,
      },
    });
  }

  console.log("Seeding probation...");
  for (const item of seed.probationPeriods) {
    await prisma.probationPeriod.create({
      data: {
        id: String(item.id),
        employeeId: (item.employeeId as string | null) ?? null,
        employeeName: String(item.employeeName),
        hireDate: parseDate(item.hireDate),
        firstPeriodEnd: parseDate(item.firstPeriodEnd),
        secondPeriodEnd: parseDate(item.secondPeriodEnd),
      },
    });
  }

  console.log("Seeding ASO...");
  for (const item of seed.asoExams) {
    await prisma.asoExam.create({
      data: {
        id: String(item.id),
        employeeId: (item.employeeId as string | null) ?? null,
        employeeName: String(item.employeeName),
        departmentName: (item.departmentName as string | null) ?? null,
        admissionExamDate: (item.admissionExamDate as string | null) ?? null,
        admissionExamValidUntil: (item.admissionExamValidUntil as string | null) ?? null,
        periodic1Date: (item.periodic1Date as string | null) ?? null,
        periodic1ValidUntil: (item.periodic1ValidUntil as string | null) ?? null,
        periodic2Date: (item.periodic2Date as string | null) ?? null,
        periodic2ValidUntil: (item.periodic2ValidUntil as string | null) ?? null,
        periodic3Date: (item.periodic3Date as string | null) ?? null,
        periodic3ValidUntil: (item.periodic3ValidUntil as string | null) ?? null,
      },
    });
  }

  console.log("Seeding insurance...");
  for (const item of seed.healthInsurance) {
    await prisma.healthInsurance.create({
      data: {
        employeeId: (item.employeeId as string | null) ?? null,
        name: String(item.name),
        cpf: (item.cpf as string | null) ?? null,
        provider: String(item.provider),
      },
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
