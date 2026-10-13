"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { EmployeeStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { parseOptionalDate } from "@/lib/mappers";
import { safeEmployeesReturnTo, toDisplayCase, toDisplayCaseOrNull } from "@/lib/utils";

const employeeSchema = z.object({
  name: z.string().min(3, "Informe o nome completo"),
  cpf: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  hireDate: z.string().optional().nullable(),
  contractType: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  managerName: z.string().optional().nullable(),
  directorName: z.string().optional().nullable(),
  workScale: z.string().optional().nullable(),
  workSchedule: z.string().optional().nullable(),
  salary: z.string().optional().nullable(),
  transportBenefit: z.string().optional().nullable(),
  status: z.enum(["ativo", "afastado", "desligado", "ferias"]),
  externalCode: z.string().optional().nullable(),
  hasHealthInsurance: z.coerce.boolean().optional(),
  notes: z.string().optional().nullable(),
});

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function formToPayload(formData: FormData) {
  return employeeSchema.parse({
    name: String(formData.get("name") ?? ""),
    cpf: emptyToNull(formData.get("cpf")),
    birthDate: emptyToNull(formData.get("birthDate")),
    hireDate: emptyToNull(formData.get("hireDate")),
    contractType: emptyToNull(formData.get("contractType")),
    positionId: emptyToNull(formData.get("positionId")),
    departmentId: emptyToNull(formData.get("departmentId")),
    managerName: emptyToNull(formData.get("managerName")),
    directorName: emptyToNull(formData.get("directorName")),
    workScale: emptyToNull(formData.get("workScale")),
    workSchedule: emptyToNull(formData.get("workSchedule")),
    salary: emptyToNull(formData.get("salary")),
    transportBenefit: emptyToNull(formData.get("transportBenefit")),
    status: String(formData.get("status") ?? "ativo"),
    externalCode: emptyToNull(formData.get("externalCode")),
    hasHealthInsurance: formData.get("hasHealthInsurance") === "on",
    notes: emptyToNull(formData.get("notes")),
  });
}

export type EmployeeActionState = {
  error?: string;
  success?: string;
};

export async function createEmployeeAction(
  _prev: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  try {
    const session = await requirePermission("employees:create");
    const canSetSalary = hasPermission(session.user.role as Role, "salary:read");
    const data = formToPayload(formData);

    const count = await prisma.employee.count();
    const id = `emp_${String(count + 1).padStart(4, "0")}_${Date.now().toString().slice(-4)}`;

    let managerName = data.managerName;
    let directorName = data.directorName;
    if (data.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
      managerName = managerName ?? department?.managerName ?? null;
      directorName = directorName ?? department?.directorName ?? null;
    }

    await prisma.employee.create({
      data: {
        id,
        name: toDisplayCase(data.name),
        cpf: data.cpf,
        birthDate: parseOptionalDate(data.birthDate),
        hireDate: parseOptionalDate(data.hireDate),
        contractType: data.contractType,
        positionId: data.positionId,
        departmentId: data.departmentId,
        managerName: toDisplayCaseOrNull(managerName),
        directorName: toDisplayCaseOrNull(directorName),
        workScale: toDisplayCaseOrNull(data.workScale),
        workSchedule: data.workSchedule,
        salary: canSetSalary ? parseNumber(data.salary) : null,
        transportBenefit: data.transportBenefit,
        status: data.status as EmployeeStatus,
        externalCode: data.externalCode,
        hasHealthInsurance: Boolean(data.hasHealthInsurance),
        notes: data.notes,
      },
    });

    revalidatePath("/colaboradores");
    revalidatePath("/");
    redirect(`/colaboradores/${id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { error: "Você não tem permissão para criar colaboradores." };
    }
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Dados inválidos." };
    }
    console.error(error);
    return { error: "Não foi possível criar o colaborador." };
  }
}

export async function updateEmployeeAction(
  _prev: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  try {
    const session = await requirePermission("employees:update");
    const canSetSalary = hasPermission(session.user.role as Role, "salary:read");
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Colaborador inválido." };

    const data = formToPayload(formData);

    let managerName = data.managerName;
    let directorName = data.directorName;
    if (data.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
      managerName = managerName ?? department?.managerName ?? null;
      directorName = directorName ?? department?.directorName ?? null;
    }

    await prisma.employee.update({
      where: { id },
      data: {
        name: toDisplayCase(data.name),
        cpf: data.cpf,
        birthDate: parseOptionalDate(data.birthDate),
        hireDate: parseOptionalDate(data.hireDate),
        contractType: data.contractType,
        positionId: data.positionId,
        departmentId: data.departmentId,
        managerName: toDisplayCaseOrNull(managerName),
        directorName: toDisplayCaseOrNull(directorName),
        workScale: toDisplayCaseOrNull(data.workScale),
        workSchedule: data.workSchedule,
        ...(canSetSalary ? { salary: parseNumber(data.salary) } : {}),
        transportBenefit: data.transportBenefit,
        status: data.status as EmployeeStatus,
        externalCode: data.externalCode,
        hasHealthInsurance: Boolean(data.hasHealthInsurance),
        notes: data.notes,
      },
    });

    revalidatePath("/colaboradores");
    revalidatePath(`/colaboradores/${id}`);
    revalidatePath("/");
    redirect(safeEmployeesReturnTo(emptyToNull(formData.get("returnTo"))));
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { error: "Você não tem permissão para editar colaboradores." };
    }
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Dados inválidos." };
    }
    console.error(error);
    return { error: "Não foi possível atualizar o colaborador." };
  }
}

export async function terminateEmployeeAction(formData: FormData): Promise<void> {
  try {
    await requirePermission("employees:delete");
    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await prisma.employee.update({
      where: { id },
      data: { status: "desligado" },
    });

    revalidatePath("/colaboradores");
    revalidatePath(`/colaboradores/${id}`);
    revalidatePath("/");
    redirect(safeEmployeesReturnTo(emptyToNull(formData.get("returnTo"))));
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
  }
}

export async function deleteEmployeeAction(formData: FormData): Promise<void> {
  try {
    await requirePermission("employees:delete");
    const id = String(formData.get("id") ?? "");
    if (!id) return;

    await prisma.$transaction([
      prisma.vacation.updateMany({ where: { employeeId: id }, data: { employeeId: null } }),
      prisma.termination.updateMany({ where: { employeeId: id }, data: { employeeId: null } }),
      prisma.leave.updateMany({ where: { employeeId: id }, data: { employeeId: null } }),
      prisma.probationPeriod.updateMany({ where: { employeeId: id }, data: { employeeId: null } }),
      prisma.asoExam.updateMany({ where: { employeeId: id }, data: { employeeId: null } }),
      prisma.healthInsurance.deleteMany({ where: { employeeId: id } }),
      prisma.employeeDocument.deleteMany({ where: { employeeId: id } }),
      prisma.employee.delete({ where: { id } }),
    ]);

    revalidatePath("/colaboradores");
    revalidatePath("/");
    redirect(safeEmployeesReturnTo(emptyToNull(formData.get("returnTo"))));
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
  }
}
