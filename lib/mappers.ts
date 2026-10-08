import type {
  AsoExam,
  Department,
  Employee,
  HealthInsurance,
  Leave,
  ProbationPeriod,
  Termination,
  Vacation,
} from "@prisma/client";
import type {
  AsoExam as AsoExamDto,
  Department as DepartmentDto,
  Employee as EmployeeDto,
  EmployeeStatus,
  HealthInsurance as HealthInsuranceDto,
  Leave as LeaveDto,
  ProbationPeriod as ProbationDto,
  Termination as TerminationDto,
  Vacation as VacationDto,
  VacationStatus,
} from "@/types/hr";
import { toDisplayCase, toDisplayCaseOrNull } from "@/lib/utils";

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function mapEmployee(
  employee: Employee & {
    position?: { name: string } | null;
    department?: { name: string; managerName: string | null; directorName: string | null } | null;
  },
): EmployeeDto {
  return {
    id: employee.id,
    name: toDisplayCase(employee.name),
    cpf: employee.cpf,
    birthDate: toIso(employee.birthDate),
    hireDate: toIso(employee.hireDate),
    contractType: toDisplayCaseOrNull(employee.contractType),
    positionId: employee.positionId,
    positionName: toDisplayCaseOrNull(employee.position?.name ?? null),
    departmentId: employee.departmentId,
    departmentName: toDisplayCaseOrNull(employee.department?.name ?? null),
    managerName: toDisplayCaseOrNull(
      employee.managerName ?? employee.department?.managerName ?? null,
    ),
    directorName: toDisplayCaseOrNull(
      employee.directorName ?? employee.department?.directorName ?? null,
    ),
    workScale: toDisplayCaseOrNull(employee.workScale),
    workSchedule: employee.workSchedule,
    salary: employee.salary,
    mealAllowance: employee.mealAllowance,
    transportBenefit: toDisplayCaseOrNull(employee.transportBenefit),
    status: employee.status as EmployeeStatus,
    externalCode: employee.externalCode,
    hasHealthInsurance: employee.hasHealthInsurance,
    notes: employee.notes,
  };
}

export function mapDepartment(department: Department): DepartmentDto {
  return {
    id: department.id,
    name: toDisplayCase(department.name),
    managerName: toDisplayCaseOrNull(department.managerName),
    directorName: toDisplayCaseOrNull(department.directorName),
  };
}

export function mapVacation(vacation: Vacation): VacationDto {
  return {
    id: vacation.id,
    employeeId: vacation.employeeId,
    employeeName: toDisplayCase(vacation.employeeName),
    departmentId: vacation.departmentId,
    departmentName: toDisplayCaseOrNull(vacation.departmentName),
    acquisitionPeriod: vacation.acquisitionPeriod,
    deadlineDate: toIso(vacation.deadlineDate),
    startDate: toIso(vacation.startDate),
    endDate: toIso(vacation.endDate),
    days: vacation.days,
    status: vacation.status as VacationStatus,
    value: vacation.value,
    paymentDate: toIso(vacation.paymentDate),
    dueDate: toIso(vacation.dueDate),
    pecuniaryAllowance: vacation.pecuniaryAllowance,
    notes: vacation.notes,
    rhNotes: vacation.rhNotes,
    createdAt: vacation.createdAt?.toISOString?.() ?? null,
  };
}

export function mapTermination(item: Termination): TerminationDto {
  return {
    id: item.id,
    employeeId: item.employeeId,
    employeeName: toDisplayCase(item.employeeName),
    terminationType: item.terminationType,
    terminationTypeLabel: toDisplayCaseOrNull(item.terminationTypeLabel),
    noticeType: toDisplayCaseOrNull(item.noticeType),
    noticeStartDate: toIso(item.noticeStartDate),
    lastWorkDay: toIso(item.lastWorkDay),
    noticeEndDate: toIso(item.noticeEndDate),
    paymentDate: toIso(item.paymentDate),
    dueDate: toIso(item.dueDate),
    value: item.value,
    grrfValue: item.grrfValue,
    grrfDueDate: toIso(item.grrfDueDate),
  };
}

export function mapLeave(item: Leave): LeaveDto {
  return {
    id: item.id,
    employeeId: item.employeeId,
    employeeName: toDisplayCase(item.employeeName),
    days: item.days,
    startDate: toIso(item.startDate),
    endDate: toIso(item.endDate),
    cid: item.cid,
  };
}

export function mapProbation(item: ProbationPeriod): ProbationDto {
  return {
    id: item.id,
    employeeId: item.employeeId,
    employeeName: toDisplayCase(item.employeeName),
    hireDate: toIso(item.hireDate),
    firstPeriodEnd: toIso(item.firstPeriodEnd),
    secondPeriodEnd: toIso(item.secondPeriodEnd),
  };
}

export function mapAso(item: AsoExam): AsoExamDto {
  return {
    id: item.id,
    employeeId: item.employeeId,
    employeeName: toDisplayCase(item.employeeName),
    departmentName: toDisplayCaseOrNull(item.departmentName),
    admissionExamDate: item.admissionExamDate,
    admissionExamValidUntil: item.admissionExamValidUntil,
    periodic1Date: item.periodic1Date,
    periodic1ValidUntil: item.periodic1ValidUntil,
    periodic2Date: item.periodic2Date,
    periodic2ValidUntil: item.periodic2ValidUntil,
    periodic3Date: item.periodic3Date,
    periodic3ValidUntil: item.periodic3ValidUntil,
  };
}

export function mapInsurance(item: HealthInsurance): HealthInsuranceDto {
  return {
    employeeId: item.employeeId,
    name: toDisplayCase(item.name),
    cpf: item.cpf,
    provider: toDisplayCase(item.provider),
  };
}

export function parseOptionalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
