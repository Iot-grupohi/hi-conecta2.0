import {
  format,
  getMonth,
  getYear,
  getDay,
  eachDayOfInterval,
  isWithinInterval,
  parseISO,
  startOfMonth,
  endOfMonth,
  addDays,
  isValid,
  max as maxDate,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  AsoExam,
  DashboardStats,
  Employee,
  EmployeeStatus,
  HrSeedData,
  Vacation,
} from "@/types/hr";

export function parseDate(value: string | null | undefined): Date | null {
  if (!value || value === "pendente") return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

export function formatDate(value: string | null | undefined, pattern = "dd/MM/yyyy"): string {
  const date = parseDate(value);
  if (!date) return "—";
  return format(date, pattern, { locale: ptBR });
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Masks salary unless the viewer has salary:read permission. */
export function formatSalary(
  value: number | null | undefined,
  canViewSalary = false,
): string {
  if (!canViewSalary) return "R$ ••••••";
  if (value == null || Number.isNaN(value)) return "—";
  return formatCurrency(value);
}

/** Dias da semana trabalhados conforme a escala (0=dom … 6=sáb). */
export function workWeekdaysFromScale(workScale: string | null | undefined): number[] {
  const scale = (workScale ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/6\s*[x×]\s*1/.test(scale) || /sab/.test(scale)) {
    return [1, 2, 3, 4, 5, 6];
  }
  // segunda a sexta, 6x2 e demais → dias úteis padrão
  return [1, 2, 3, 4, 5];
}

/** Conta dias trabalhados no intervalo conforme a escala. */
export function countWorkDays(
  from: Date,
  to: Date,
  workScale: string | null | undefined,
): number {
  if (from > to) return 0;
  const weekdays = new Set(workWeekdaysFromScale(workScale));
  return eachDayOfInterval({ start: from, end: to }).filter((day) =>
    weekdays.has(getDay(day)),
  ).length;
}

/**
 * Alimentação do mês da admissão: valor diário × dias trabalhados
 * do dia da admissão até o fim daquele mês (proporcional se entrar no meio).
 */
export function monthlyMealForHire(employee: {
  mealAllowance: number | null;
  hireDate: string | null;
  workScale: string | null;
}): { daily: number; days: number; amount: number; monthLabel: string } | null {
  const daily = employee.mealAllowance;
  const hire = parseDate(employee.hireDate);
  if (daily == null || Number.isNaN(daily) || !hire) return null;

  const monthStart = startOfMonth(hire);
  const monthEnd = endOfMonth(hire);
  const from = maxDate([hire, monthStart]);
  const days = countWorkDays(from, monthEnd, employee.workScale);
  const amount = Math.round(daily * days * 100) / 100;

  return {
    daily,
    days,
    amount,
    monthLabel: format(hire, "MMMM/yyyy", { locale: ptBR }),
  };
}

export function formatCpf(cpf: string | null | undefined): string {
  if (!cpf) return "—";
  return cpf;
}

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  ativo: "ATIVO",
  afastado: "AFASTADO",
  desligado: "DESLIGADO",
  ferias: "FÉRIAS",
};

export function getEmployeeAge(birthDate: string | null, reference = new Date()): number | null {
  const date = parseDate(birthDate);
  if (!date) return null;
  let age = reference.getFullYear() - date.getFullYear();
  const m = reference.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && reference.getDate() < date.getDate())) age -= 1;
  return age;
}

export function getTenureYears(hireDate: string | null, reference = new Date()): number | null {
  const date = parseDate(hireDate);
  if (!date) return null;
  const years = (reference.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, Math.floor(years * 10) / 10);
}

function isPendingAsoValue(value: string | null | undefined): boolean {
  if (!value) return true;
  return value === "pendente";
}

export function countPendingDocuments(asoExams: AsoExam[]): number {
  return asoExams.filter((exam) => {
    return (
      isPendingAsoValue(exam.admissionExamDate) ||
      isPendingAsoValue(exam.periodic1Date) ||
      (exam.admissionExamValidUntil &&
        exam.admissionExamValidUntil !== "pendente" &&
        parseDate(exam.admissionExamValidUntil) !== null &&
        (parseDate(exam.admissionExamValidUntil) as Date) < new Date())
    );
  }).length;
}

/** Férias cujo período inclui a data de referência (em gozo). */
export function isVacationInProgress(vacation: Vacation, reference = new Date()): boolean {
  if (vacation.status !== "programada" && vacation.status !== "concluida") return false;
  const start = parseDate(vacation.startDate);
  const end = parseDate(vacation.endDate) ?? start;
  if (!start || !end) return false;
  const day = new Date(reference);
  day.setHours(12, 0, 0, 0);
  const from = new Date(start);
  from.setHours(0, 0, 0, 0);
  const to = new Date(end);
  to.setHours(23, 59, 59, 999);
  return day >= from && day <= to;
}

export function getVacationsInProgress(vacations: Vacation[], reference = new Date()): Vacation[] {
  return vacations
    .filter((vacation) => isVacationInProgress(vacation, reference))
    .sort((a, b) => (a.endDate ?? "").localeCompare(b.endDate ?? ""));
}

export function getUpcomingVacations(vacations: Vacation[], withinDays = 45): Vacation[] {
  const now = new Date();
  const limit = addDays(now, withinDays);
  return vacations.filter((vacation) => {
    if (vacation.status !== "programada") return false;
    if (isVacationInProgress(vacation, now)) return false;
    const start = parseDate(vacation.startDate);
    if (!start) return false;
    return start >= now && start <= limit;
  });
}

export function buildDashboardStats(data: HrSeedData, reference = new Date()): DashboardStats {
  const monthStart = startOfMonth(reference);
  const monthEnd = endOfMonth(reference);
  const currentMonth = getMonth(reference);
  const currentYear = getYear(reference);

  const activeEmployees = data.employees.filter((e) => e.status !== "desligado").length;
  const onLeave = data.employees.filter((e) => e.status === "afastado").length;
  const onVacation = data.employees.filter((e) => e.status === "ferias").length;

  const hiredThisMonth = data.employees.filter((employee) => {
    const hire = parseDate(employee.hireDate);
    if (!hire) return false;
    return isWithinInterval(hire, { start: monthStart, end: monthEnd });
  }).length;

  const terminatedThisMonth = data.terminations.filter((termination) => {
    const day = parseDate(termination.lastWorkDay);
    if (!day) return false;
    return isWithinInterval(day, { start: monthStart, end: monthEnd });
  }).length;

  const birthdaysThisMonth = data.employees.filter((employee) => {
    if (employee.status !== "ativo") return false;
    const birth = parseDate(employee.birthDate);
    if (!birth) return false;
    return getMonth(birth) === currentMonth;
  }).length;

  const upcomingVacations = getUpcomingVacations(data.vacations).length;
  const pendingDocuments = countPendingDocuments(data.asoExams);

  const departmentMap = new Map<string, { name: string; count: number; departmentId: string }>();
  data.employees
    .filter((employee) => employee.status !== "desligado")
    .forEach((employee) => {
      const departmentId = employee.departmentId ?? "sem";
      const name = employee.departmentName?.trim() || "Sem setor definido";
      const current = departmentMap.get(departmentId);
      if (current) {
        current.count += 1;
      } else {
        departmentMap.set(departmentId, { name, count: 1, departmentId });
      }
    });

  const byDepartment = Array.from(departmentMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const trendMap = new Map<string, { hired: number; terminated: number }>();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const key = format(d, "yyyy-MM");
    trendMap.set(key, { hired: 0, terminated: 0 });
  }

  data.employees.forEach((employee) => {
    const hire = parseDate(employee.hireDate);
    if (!hire) return;
    const key = format(hire, "yyyy-MM");
    const bucket = trendMap.get(key);
    if (bucket) bucket.hired += 1;
  });

  data.terminations.forEach((termination) => {
    const day = parseDate(termination.lastWorkDay);
    if (!day) return;
    const key = format(day, "yyyy-MM");
    const bucket = trendMap.get(key);
    if (bucket) bucket.terminated += 1;
  });

  const hiringTrend = Array.from(trendMap.entries()).map(([month, values]) => ({
    month: format(parseISO(`${month}-01`), "MMM/yy", { locale: ptBR }),
    hired: values.hired,
    terminated: values.terminated,
  }));

  const statusOrder: EmployeeStatus[] = ["ativo", "ferias", "afastado", "desligado"];
  const statusDistribution = statusOrder.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: data.employees.filter((employee) => employee.status === status).length,
  }));

  return {
    activeEmployees,
    hiredThisMonth,
    terminatedThisMonth,
    birthdaysThisMonth,
    upcomingVacations,
    pendingDocuments,
    onLeave,
    onVacation,
    byDepartment,
    hiringTrend,
    statusDistribution,
  };
}

export function filterEmployees(
  employees: Employee[],
  options: {
    query?: string;
    status?: EmployeeStatus | "todos";
    departmentId?: string | "todos";
    positionId?: string | "todos";
    positionName?: string | null;
    sortBy?: "name" | "hireDate" | "department" | "salary";
    sortDir?: "asc" | "desc";
  },
): Employee[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  let result = employees.filter((employee) => {
    if (options.status && options.status !== "todos" && employee.status !== options.status) {
      return false;
    }
    if (
      options.departmentId &&
      options.departmentId !== "todos"
    ) {
      if (options.departmentId === "sem") {
        if (employee.departmentId) return false;
      } else if (employee.departmentId !== options.departmentId) {
        return false;
      }
    }
    if (options.positionId && options.positionId !== "todos") {
      const byId = employee.positionId === options.positionId;
      const byName =
        !employee.positionId &&
        Boolean(options.positionName) &&
        (employee.positionName ?? "").toLowerCase() === options.positionName!.toLowerCase();
      if (!byId && !byName) return false;
    }
    if (!query) return true;
    const haystack = [
      employee.name,
      employee.cpf,
      employee.positionName,
      employee.departmentName,
      employee.contractType,
      employee.externalCode,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  const dir = options.sortDir === "desc" ? -1 : 1;
  const sortBy = options.sortBy ?? "name";

  result = [...result].sort((a, b) => {
    if (sortBy === "hireDate") {
      const aDate = parseDate(a.hireDate)?.getTime() ?? 0;
      const bDate = parseDate(b.hireDate)?.getTime() ?? 0;
      return (aDate - bDate) * dir;
    }
    if (sortBy === "salary") {
      return ((a.salary ?? 0) - (b.salary ?? 0)) * dir;
    }
    if (sortBy === "department") {
      return (a.departmentName ?? "").localeCompare(b.departmentName ?? "", "pt-BR") * dir;
    }
    return a.name.localeCompare(b.name, "pt-BR") * dir;
  });

  return result;
}

export function getEmployeeHistory(data: HrSeedData, employeeId: string) {
  return {
    vacations: data.vacations.filter((item) => item.employeeId === employeeId),
    terminations: data.terminations.filter((item) => item.employeeId === employeeId),
    leaves: data.leaves.filter((item) => item.employeeId === employeeId),
    probation: data.probationPeriods.filter((item) => item.employeeId === employeeId),
    aso: data.asoExams.filter((item) => item.employeeId === employeeId),
    insurance: data.healthInsurance.filter((item) => item.employeeId === employeeId),
  };
}
