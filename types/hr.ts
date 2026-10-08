export type EmployeeStatus = "ativo" | "afastado" | "desligado" | "ferias";

export type VacationStatus = "concluida" | "programada" | "solicitar" | "pendente" | "recusada";

export interface Department {
  id: string;
  name: string;
  managerName: string | null;
  directorName: string | null;
}

export interface Position {
  id: string;
  name: string;
  departmentId: string | null;
}

export interface Employee {
  id: string;
  name: string;
  cpf: string | null;
  birthDate: string | null;
  hireDate: string | null;
  contractType: string | null;
  positionId: string | null;
  positionName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  managerName: string | null;
  directorName: string | null;
  workScale: string | null;
  workSchedule: string | null;
  salary: number | null;
  mealAllowance: number | null;
  transportBenefit: string | null;
  status: EmployeeStatus;
  externalCode: string | null;
  hasHealthInsurance: boolean;
  notes: string | null;
}

export interface Vacation {
  id: string;
  employeeId: string | null;
  employeeName: string;
  departmentId: string | null;
  departmentName: string | null;
  acquisitionPeriod: string | null;
  deadlineDate: string | null;
  startDate: string | null;
  endDate: string | null;
  days: number | null;
  status: VacationStatus;
  value: number | null;
  paymentDate: string | null;
  dueDate: string | null;
  pecuniaryAllowance: boolean;
  notes: string | null;
  rhNotes: string | null;
  createdAt?: string | null;
}

export interface Termination {
  id: string;
  employeeId: string | null;
  employeeName: string;
  terminationType: string;
  terminationTypeLabel: string | null;
  noticeType: string | null;
  noticeStartDate: string | null;
  lastWorkDay: string | null;
  noticeEndDate: string | null;
  paymentDate: string | null;
  dueDate: string | null;
  value: number | null;
  grrfValue: number | null;
  grrfDueDate: string | null;
}

export interface Leave {
  id: string;
  employeeId: string | null;
  employeeName: string;
  days: number | null;
  startDate: string | null;
  endDate: string | null;
  cid: string | null;
}

export interface ProbationPeriod {
  id: string;
  employeeId: string | null;
  employeeName: string;
  hireDate: string | null;
  firstPeriodEnd: string | null;
  secondPeriodEnd: string | null;
}

export interface AsoExam {
  id: string;
  employeeId: string | null;
  employeeName: string;
  departmentName: string | null;
  admissionExamDate: string | null;
  admissionExamValidUntil: string | null;
  periodic1Date: string | null;
  periodic1ValidUntil: string | null;
  periodic2Date: string | null;
  periodic2ValidUntil: string | null;
  periodic3Date: string | null;
  periodic3ValidUntil: string | null;
}

export interface HealthInsurance {
  employeeId: string | null;
  name: string;
  cpf: string | null;
  provider: string;
}

/** Crédito em restaurante parceiro até liberar o vale alimentação */
export interface MealPartnerCredit {
  id: string;
  employeeId: string | null;
  employeeName: string;
  partnerName: string;
  year: number;
  monthLabel: string;
  monthNumber: number;
  orderDates: string;
  quantity: number;
  unitValue: number;
  consumptionValue: number;
  notes: string | null;
}

export interface MealPartnerDailySummary {
  id: string;
  partnerName: string;
  date: string;
  year: number;
  quantity: number;
  consumptionValue: number;
  deliveryFee: number | null;
  dayTotal: number;
}

/** Crédito mensal de lavanderia (R$ 120 ou proporcional) */
export interface LaundryCredit {
  id: string;
  employeeId: string | null;
  employeeName: string;
  cpf: string | null;
  year: number;
  monthLabel: string;
  monthNumber: number;
  amount: number;
  fullAmount: number;
  isProportional: boolean;
  notes: string | null;
}

/** Bonificação IFOOD mensal (campo Livre da planilha modelo) */
export interface IfoodBonus {
  id: string;
  employeeId: string | null;
  employeeName: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  costCenter: string | null;
  year: number;
  monthLabel: string;
  monthNumber: number;
  amount: number;
  mealPatAmount: number | null;
  ifoodEatAmount: number | null;
  notes: string | null;
}

/** Vale transporte mensal (planilha dedicada) */
export interface TransportCredit {
  id: string;
  employeeId: string | null;
  employeeName: string;
  year: number;
  monthLabel: string;
  monthNumber: number;
  departmentName: string | null;
  status: string | null;
  location: string | null;
  cardNumber: string | null;
  fare1: number | null;
  fare2: number | null;
  tripsPerDay: number | null;
  dailyValue: number | null;
  days: number | null;
  totalAmount: number;
  isProportional: boolean;
  balance: number | null;
  notes: string | null;
}

/** Controle mensal CAJU (alimentação, mobilidade, VT) */
export interface BenefitCredit {
  id: string;
  employeeId: string | null;
  employeeName: string;
  cpf: string | null;
  year: number;
  monthLabel: string;
  monthNumber: number;
  departmentName: string | null;
  workDays: number | null;
  workDaysNote: string | null;
  mealAmount: number | null;
  mobilityAmount: number | null;
  mobilityNote: string | null;
  transportAmount: number | null;
  isProportional: boolean;
  startDate: string | null;
  orderDate: string | null;
  notes: string | null;
}

export interface Manager {
  departmentId: string;
  departmentName: string;
  managerName: string | null;
  directorName: string | null;
}

export interface Birthday {
  employeeId: string | null;
  name: string;
  birthDate: string;
  contractType: string | null;
}

export interface TenureAnniversary {
  employeeId: string | null;
  name: string;
  positionName: string | null;
  hireDate: string | null;
  years: number | null;
  departmentName: string | null;
}

export interface HrSeedMeta {
  company: string;
  platform: string;
  sourceFiles: string[];
  generatedAt: string;
  counts: Record<string, number>;
}

export interface HrSeedData {
  meta: HrSeedMeta;
  departments: Department[];
  positions: Position[];
  employees: Employee[];
  vacations: Vacation[];
  terminations: Termination[];
  leaves: Leave[];
  probationPeriods: ProbationPeriod[];
  asoExams: AsoExam[];
  healthInsurance: HealthInsurance[];
  managers: Manager[];
  tenureAnniversaries: TenureAnniversary[];
  birthdays: Birthday[];
}

export interface DashboardStats {
  activeEmployees: number;
  hiredThisMonth: number;
  terminatedThisMonth: number;
  birthdaysThisMonth: number;
  upcomingVacations: number;
  pendingDocuments: number;
  onLeave: number;
  onVacation: number;
  byDepartment: { name: string; count: number; departmentId: string }[];
  hiringTrend: { month: string; hired: number; terminated: number }[];
  statusDistribution: { status: EmployeeStatus; label: string; count: number }[];
}
