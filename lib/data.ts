import { prisma } from "@/lib/prisma";
import {
  mapAso,
  mapDepartment,
  mapEmployee,
  mapInsurance,
  mapLeave,
  mapProbation,
  mapTermination,
  mapVacation,
} from "@/lib/mappers";
import { toDisplayCase } from "@/lib/utils";
import type { Employee, HrSeedData } from "@/types/hr";

const employeeInclude = {
  position: true,
  department: true,
} as const;

export async function getHrData(): Promise<HrSeedData> {
  const [
    departments,
    positions,
    employees,
    vacations,
    terminations,
    leaves,
    probationPeriods,
    asoExams,
    healthInsurance,
  ] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.position.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({
      include: employeeInclude,
      orderBy: { name: "asc" },
    }),
    prisma.vacation.findMany({ orderBy: [{ createdAt: "desc" }, { startDate: "desc" }] }),
    prisma.termination.findMany({ orderBy: { lastWorkDay: "desc" } }),
    prisma.leave.findMany({ orderBy: { startDate: "desc" } }),
    prisma.probationPeriod.findMany({ orderBy: { hireDate: "desc" } }),
    prisma.asoExam.findMany({ orderBy: { employeeName: "asc" } }),
    prisma.healthInsurance.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    meta: {
      company: "IKLI Tecnologia Ltda",
      platform: "Hi-Conecta RH",
      sourceFiles: ["prisma sqlite seed"],
      generatedAt: new Date().toISOString(),
      counts: {
        employees: employees.length,
        departments: departments.length,
        positions: positions.length,
        vacations: vacations.length,
        terminations: terminations.length,
        leaves: leaves.length,
        probation: probationPeriods.length,
        asoExams: asoExams.length,
        insurance: healthInsurance.length,
      },
    },
    departments: departments.map(mapDepartment),
    positions: positions.map((position) => ({
      id: position.id,
      name: toDisplayCase(position.name),
      departmentId: position.departmentId,
    })),
    employees: employees.map(mapEmployee),
    vacations: vacations.map(mapVacation),
    terminations: terminations.map(mapTermination),
    leaves: leaves.map(mapLeave),
    probationPeriods: probationPeriods.map(mapProbation),
    asoExams: asoExams.map(mapAso),
    healthInsurance: healthInsurance.map(mapInsurance),
    managers: departments.map((department) => ({
      departmentId: department.id,
      departmentName: department.name,
      managerName: department.managerName,
      directorName: department.directorName,
    })),
    tenureAnniversaries: [],
    birthdays: employees
      .filter((employee) => employee.birthDate)
      .map((employee) => ({
        employeeId: employee.id,
        name: employee.name,
        birthDate: employee.birthDate!.toISOString().slice(0, 10),
        contractType: employee.contractType,
      })),
  };
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: employeeInclude,
  });
  return employee ? mapEmployee(employee) : null;
}

export async function getDepartments() {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  return departments.map(mapDepartment);
}

export async function getPositions() {
  return prisma.position.findMany({ orderBy: { name: "asc" } });
}

export async function getEmployeeHistory(employeeId: string) {
  const [
    vacations,
    terminations,
    leaves,
    probation,
    aso,
    insurance,
    documents,
    mealPartnerCredits,
    laundryCredits,
    benefitCredits,
    transportCredits,
  ] = await Promise.all([
    prisma.vacation.findMany({
      where: { employeeId },
      orderBy: [{ createdAt: "desc" }, { startDate: "desc" }],
    }),
    prisma.termination.findMany({ where: { employeeId }, orderBy: { lastWorkDay: "desc" } }),
    prisma.leave.findMany({ where: { employeeId }, orderBy: { startDate: "desc" } }),
    prisma.probationPeriod.findMany({ where: { employeeId }, orderBy: { hireDate: "desc" } }),
    prisma.asoExam.findMany({ where: { employeeId } }),
    prisma.healthInsurance.findMany({ where: { employeeId } }),
    prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mealPartnerCredit.findMany({
      where: { employeeId },
      orderBy: [{ year: "desc" }, { monthNumber: "desc" }],
    }),
    prisma.laundryCredit.findMany({
      where: { employeeId },
      orderBy: [{ year: "desc" }, { monthNumber: "desc" }],
    }),
    prisma.benefitCredit.findMany({
      where: { employeeId },
      orderBy: [{ year: "desc" }, { monthNumber: "desc" }],
    }),
    prisma.transportCredit.findMany({
      where: { employeeId },
      orderBy: [{ year: "desc" }, { monthNumber: "desc" }],
    }),
  ]);

  return {
    vacations: vacations.map(mapVacation),
    terminations: terminations.map(mapTermination),
    leaves: leaves.map(mapLeave),
    probation: probation.map(mapProbation),
    aso: aso.map(mapAso),
    insurance: insurance.map(mapInsurance),
    mealPartnerCredits: mealPartnerCredits.map((item) => ({
      id: item.id,
      employeeId: item.employeeId,
      employeeName: toDisplayCase(item.employeeName),
      partnerName: item.partnerName,
      year: item.year,
      monthLabel: item.monthLabel,
      monthNumber: item.monthNumber,
      orderDates: item.orderDates,
      quantity: item.quantity,
      unitValue: item.unitValue,
      consumptionValue: item.consumptionValue,
      notes: item.notes,
    })),
    laundryCredits: laundryCredits.map((item) => ({
      id: item.id,
      employeeId: item.employeeId,
      employeeName: toDisplayCase(item.employeeName),
      cpf: item.cpf,
      year: item.year,
      monthLabel: item.monthLabel,
      monthNumber: item.monthNumber,
      amount: item.amount,
      fullAmount: item.fullAmount,
      isProportional: item.isProportional,
      notes: item.notes,
    })),
    benefitCredits: benefitCredits.map((item) => ({
      id: item.id,
      employeeId: item.employeeId,
      employeeName: toDisplayCase(item.employeeName),
      cpf: item.cpf,
      year: item.year,
      monthLabel: item.monthLabel,
      monthNumber: item.monthNumber,
      departmentName: item.departmentName ? toDisplayCase(item.departmentName) : null,
      workDays: item.workDays,
      workDaysNote: item.workDaysNote,
      mealAmount: item.mealAmount,
      mobilityAmount: item.mobilityAmount,
      mobilityNote: item.mobilityNote,
      transportAmount: item.transportAmount,
      isProportional: item.isProportional,
      startDate: item.startDate?.toISOString().slice(0, 10) ?? null,
      orderDate: item.orderDate?.toISOString().slice(0, 10) ?? null,
      notes: item.notes,
    })),
    transportCredits: transportCredits.map((item) => ({
      id: item.id,
      employeeId: item.employeeId,
      employeeName: toDisplayCase(item.employeeName),
      year: item.year,
      monthLabel: item.monthLabel,
      monthNumber: item.monthNumber,
      departmentName: item.departmentName ? toDisplayCase(item.departmentName) : null,
      status: item.status,
      location: item.location,
      cardNumber: item.cardNumber,
      fare1: item.fare1,
      fare2: item.fare2,
      tripsPerDay: item.tripsPerDay,
      dailyValue: item.dailyValue,
      days: item.days,
      totalAmount: item.totalAmount,
      isProportional: item.isProportional,
      balance: item.balance,
      notes: item.notes,
    })),
    documents: documents.map((document) => ({
      id: document.id,
      title: document.title,
      documentType: document.documentType,
      fileName: document.fileName,
      fileSize: document.fileSize,
      notes: document.notes,
      uploadedBy: document.uploadedBy,
      createdAt: document.createdAt.toISOString(),
    })),
  };
}

export async function getMealPartnerCredits() {
  const [credits, daily] = await Promise.all([
    prisma.mealPartnerCredit.findMany({
      orderBy: [{ year: "desc" }, { monthNumber: "desc" }, { employeeName: "asc" }],
    }),
    prisma.mealPartnerDailySummary.findMany({
      orderBy: { date: "desc" },
    }),
  ]);

  return {
    credits: credits.map((item) => ({
      id: item.id,
      employeeId: item.employeeId,
      employeeName: toDisplayCase(item.employeeName),
      partnerName: item.partnerName,
      year: item.year,
      monthLabel: item.monthLabel,
      monthNumber: item.monthNumber,
      orderDates: item.orderDates,
      quantity: item.quantity,
      unitValue: item.unitValue,
      consumptionValue: item.consumptionValue,
      notes: item.notes,
    })),
    daily: daily.map((item) => ({
      id: item.id,
      partnerName: item.partnerName,
      date: item.date.toISOString().slice(0, 10),
      year: item.year,
      quantity: item.quantity,
      consumptionValue: item.consumptionValue,
      deliveryFee: item.deliveryFee,
      dayTotal: item.dayTotal,
    })),
  };
}

export async function getLaundryCredits() {
  const credits = await prisma.laundryCredit.findMany({
    orderBy: [{ year: "desc" }, { monthNumber: "desc" }, { employeeName: "asc" }],
  });

  return credits.map((item) => ({
    id: item.id,
    employeeId: item.employeeId,
    employeeName: toDisplayCase(item.employeeName),
    cpf: item.cpf,
    year: item.year,
    monthLabel: item.monthLabel,
    monthNumber: item.monthNumber,
    amount: item.amount,
    fullAmount: item.fullAmount,
    isProportional: item.isProportional,
    notes: item.notes,
  }));
}

export async function getIfoodBonuses() {
  const credits = await prisma.ifoodBonus.findMany({
    orderBy: [{ year: "desc" }, { monthNumber: "desc" }, { employeeName: "asc" }],
  });

  return credits.map((item) => ({
    id: item.id,
    employeeId: item.employeeId,
    employeeName: toDisplayCase(item.employeeName),
    cpf: item.cpf,
    email: item.email,
    phone: item.phone,
    costCenter: item.costCenter ? toDisplayCase(item.costCenter) : null,
    year: item.year,
    monthLabel: item.monthLabel,
    monthNumber: item.monthNumber,
    amount: item.amount,
    mealPatAmount: item.mealPatAmount,
    ifoodEatAmount: item.ifoodEatAmount,
    notes: item.notes,
  }));
}

export async function getBenefitCredits() {
  const credits = await prisma.benefitCredit.findMany({
    orderBy: [{ year: "desc" }, { monthNumber: "desc" }, { employeeName: "asc" }],
  });

  return credits.map((item) => ({
    id: item.id,
    employeeId: item.employeeId,
    employeeName: toDisplayCase(item.employeeName),
    cpf: item.cpf,
    year: item.year,
    monthLabel: item.monthLabel,
    monthNumber: item.monthNumber,
    departmentName: item.departmentName ? toDisplayCase(item.departmentName) : null,
    workDays: item.workDays,
    workDaysNote: item.workDaysNote,
    mealAmount: item.mealAmount,
    mobilityAmount: item.mobilityAmount,
    mobilityNote: item.mobilityNote,
    transportAmount: item.transportAmount,
    isProportional: item.isProportional,
    startDate: item.startDate?.toISOString().slice(0, 10) ?? null,
    orderDate: item.orderDate?.toISOString().slice(0, 10) ?? null,
    notes: item.notes,
  }));
}

export async function getTransportCredits() {
  const credits = await prisma.transportCredit.findMany({
    orderBy: [{ year: "desc" }, { monthNumber: "desc" }, { employeeName: "asc" }],
  });

  return credits.map((item) => ({
    id: item.id,
    employeeId: item.employeeId,
    employeeName: toDisplayCase(item.employeeName),
    year: item.year,
    monthLabel: item.monthLabel,
    monthNumber: item.monthNumber,
    departmentName: item.departmentName ? toDisplayCase(item.departmentName) : null,
    status: item.status,
    location: item.location,
    cardNumber: item.cardNumber,
    fare1: item.fare1,
    fare2: item.fare2,
    tripsPerDay: item.tripsPerDay,
    dailyValue: item.dailyValue,
    days: item.days,
    totalAmount: item.totalAmount,
    isProportional: item.isProportional,
    balance: item.balance,
    notes: item.notes,
  }));
}

export async function getAllDocuments() {
  const documents = await prisma.employeeDocument.findMany({
    include: { employee: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return documents.map((document) => ({
    id: document.id,
    title: document.title,
    documentType: document.documentType,
    fileName: document.fileName,
    fileSize: document.fileSize,
    notes: document.notes,
    uploadedBy: document.uploadedBy,
    createdAt: document.createdAt.toISOString(),
    employeeId: document.employeeId,
    employeeName: document.employee.name,
  }));
}
