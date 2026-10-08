"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { parseOptionalDate } from "@/lib/mappers";
import { emptyToNull, newId, parseNumber, type CrudActionState } from "@/lib/hr-write";
import { toDisplayCase } from "@/lib/utils";

export type LeaveActionState = CrudActionState;

async function resolveEmployee(employeeId: string | null, employeeName: string) {
  if (employeeId) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (emp) return emp;
  }
  const name = toDisplayCase(employeeName);
  return prisma.employee.findFirst({
    where: { name: { equals: name } },
  });
}

const schema = z.object({
  employeeId: z.string().optional().nullable(),
  employeeName: z.string().min(2, "Informe o colaborador"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  days: z.string().optional().nullable(),
  cid: z.string().optional().nullable(),
});

function revalidateLeave(employeeId?: string | null) {
  revalidatePath("/afastamentos");
  revalidatePath("/");
  if (employeeId) revalidatePath(`/colaboradores/${employeeId}`);
}

export async function createLeaveAction(
  _prev: LeaveActionState,
  formData: FormData,
): Promise<LeaveActionState> {
  try {
    await requirePermission("employees:create");
    const data = schema.parse({
      employeeId: emptyToNull(formData.get("employeeId")),
      employeeName: String(formData.get("employeeName") ?? "").trim(),
      startDate: emptyToNull(formData.get("startDate")),
      endDate: emptyToNull(formData.get("endDate")),
      days: emptyToNull(formData.get("days")),
      cid: emptyToNull(formData.get("cid")),
    });
    const emp = await resolveEmployee(data.employeeId ?? null, data.employeeName);
    await prisma.leave.create({
      data: {
        id: newId("leave"),
        employeeId: emp?.id ?? data.employeeId ?? null,
        employeeName: emp?.name ?? toDisplayCase(data.employeeName),
        startDate: parseOptionalDate(data.startDate),
        endDate: parseOptionalDate(data.endDate),
        days: parseNumber(data.days) != null ? Math.round(parseNumber(data.days)!) : null,
        cid: data.cid,
      },
    });
    revalidateLeave(emp?.id ?? data.employeeId);
    return { success: "Afastamento registrado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível salvar o afastamento." };
  }
}

export async function updateLeaveAction(
  _prev: LeaveActionState,
  formData: FormData,
): Promise<LeaveActionState> {
  try {
    await requirePermission("employees:update");
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Registro inválido." };
    const data = schema.parse({
      employeeId: emptyToNull(formData.get("employeeId")),
      employeeName: String(formData.get("employeeName") ?? "").trim(),
      startDate: emptyToNull(formData.get("startDate")),
      endDate: emptyToNull(formData.get("endDate")),
      days: emptyToNull(formData.get("days")),
      cid: emptyToNull(formData.get("cid")),
    });
    const emp = await resolveEmployee(data.employeeId ?? null, data.employeeName);
    await prisma.leave.update({
      where: { id },
      data: {
        employeeId: emp?.id ?? data.employeeId ?? null,
        employeeName: emp?.name ?? toDisplayCase(data.employeeName),
        startDate: parseOptionalDate(data.startDate),
        endDate: parseOptionalDate(data.endDate),
        days: parseNumber(data.days) != null ? Math.round(parseNumber(data.days)!) : null,
        cid: data.cid,
      },
    });
    revalidateLeave(emp?.id ?? data.employeeId);
    return { success: "Afastamento atualizado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível atualizar." };
  }
}

export async function deleteLeaveAction(formData: FormData): Promise<void> {
  await requirePermission("employees:delete");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const row = await prisma.leave.findUnique({ where: { id } });
  await prisma.leave.delete({ where: { id } });
  revalidateLeave(row?.employeeId);
}
