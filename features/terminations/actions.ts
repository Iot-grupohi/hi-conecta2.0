"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { parseOptionalDate } from "@/lib/mappers";
import { emptyToNull, newId, parseNumber, type CrudActionState } from "@/lib/hr-write";
import { toDisplayCase } from "@/lib/utils";

export type TerminationActionState = CrudActionState;

const schema = z.object({
  employeeId: z.string().optional().nullable(),
  employeeName: z.string().min(2, "Informe o colaborador"),
  terminationType: z.string().min(1, "Informe o tipo"),
  terminationTypeLabel: z.string().optional().nullable(),
  noticeType: z.string().optional().nullable(),
  noticeStartDate: z.string().optional().nullable(),
  lastWorkDay: z.string().optional().nullable(),
  noticeEndDate: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  value: z.string().optional().nullable(),
  grrfValue: z.string().optional().nullable(),
  grrfDueDate: z.string().optional().nullable(),
});

function revalidateTermination(employeeId?: string | null) {
  revalidatePath("/desligamentos");
  revalidatePath("/");
  if (employeeId) revalidatePath(`/colaboradores/${employeeId}`);
}

export async function createTerminationAction(
  _prev: TerminationActionState,
  formData: FormData,
): Promise<TerminationActionState> {
  try {
    await requirePermission("employees:create");
    const data = schema.parse({
      employeeId: emptyToNull(formData.get("employeeId")),
      employeeName: String(formData.get("employeeName") ?? "").trim(),
      terminationType: String(formData.get("terminationType") ?? "").trim(),
      terminationTypeLabel: emptyToNull(formData.get("terminationTypeLabel")),
      noticeType: emptyToNull(formData.get("noticeType")),
      noticeStartDate: emptyToNull(formData.get("noticeStartDate")),
      lastWorkDay: emptyToNull(formData.get("lastWorkDay")),
      noticeEndDate: emptyToNull(formData.get("noticeEndDate")),
      paymentDate: emptyToNull(formData.get("paymentDate")),
      dueDate: emptyToNull(formData.get("dueDate")),
      value: emptyToNull(formData.get("value")),
      grrfValue: emptyToNull(formData.get("grrfValue")),
      grrfDueDate: emptyToNull(formData.get("grrfDueDate")),
    });
    let emp = data.employeeId
      ? await prisma.employee.findUnique({ where: { id: data.employeeId } })
      : null;
    if (!emp) {
      emp = await prisma.employee.findFirst({
        where: { name: { equals: toDisplayCase(data.employeeName) } },
      });
    }
    await prisma.termination.create({
      data: {
        id: newId("term"),
        employeeId: emp?.id ?? data.employeeId,
        employeeName: emp?.name ?? toDisplayCase(data.employeeName),
        terminationType: data.terminationType,
        terminationTypeLabel: data.terminationTypeLabel,
        noticeType: data.noticeType,
        noticeStartDate: parseOptionalDate(data.noticeStartDate),
        lastWorkDay: parseOptionalDate(data.lastWorkDay),
        noticeEndDate: parseOptionalDate(data.noticeEndDate),
        paymentDate: parseOptionalDate(data.paymentDate),
        dueDate: parseOptionalDate(data.dueDate),
        value: parseNumber(data.value),
        grrfValue: parseNumber(data.grrfValue),
        grrfDueDate: parseOptionalDate(data.grrfDueDate),
      },
    });
    if (emp) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { status: "desligado" },
      });
    }
    revalidateTermination(emp?.id ?? data.employeeId);
    revalidatePath("/colaboradores");
    return { success: "Desligamento registrado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível salvar o desligamento." };
  }
}

export async function updateTerminationAction(
  _prev: TerminationActionState,
  formData: FormData,
): Promise<TerminationActionState> {
  try {
    await requirePermission("employees:update");
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Registro inválido." };
    const data = schema.parse({
      employeeId: emptyToNull(formData.get("employeeId")),
      employeeName: String(formData.get("employeeName") ?? "").trim(),
      terminationType: String(formData.get("terminationType") ?? "").trim(),
      terminationTypeLabel: emptyToNull(formData.get("terminationTypeLabel")),
      noticeType: emptyToNull(formData.get("noticeType")),
      noticeStartDate: emptyToNull(formData.get("noticeStartDate")),
      lastWorkDay: emptyToNull(formData.get("lastWorkDay")),
      noticeEndDate: emptyToNull(formData.get("noticeEndDate")),
      paymentDate: emptyToNull(formData.get("paymentDate")),
      dueDate: emptyToNull(formData.get("dueDate")),
      value: emptyToNull(formData.get("value")),
      grrfValue: emptyToNull(formData.get("grrfValue")),
      grrfDueDate: emptyToNull(formData.get("grrfDueDate")),
    });
    await prisma.termination.update({
      where: { id },
      data: {
        employeeId: data.employeeId,
        employeeName: toDisplayCase(data.employeeName),
        terminationType: data.terminationType,
        terminationTypeLabel: data.terminationTypeLabel,
        noticeType: data.noticeType,
        noticeStartDate: parseOptionalDate(data.noticeStartDate),
        lastWorkDay: parseOptionalDate(data.lastWorkDay),
        noticeEndDate: parseOptionalDate(data.noticeEndDate),
        paymentDate: parseOptionalDate(data.paymentDate),
        dueDate: parseOptionalDate(data.dueDate),
        value: parseNumber(data.value),
        grrfValue: parseNumber(data.grrfValue),
        grrfDueDate: parseOptionalDate(data.grrfDueDate),
      },
    });
    revalidateTermination(data.employeeId);
    return { success: "Desligamento atualizado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível atualizar." };
  }
}

export async function deleteTerminationAction(formData: FormData): Promise<void> {
  await requirePermission("employees:delete");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const row = await prisma.termination.findUnique({ where: { id } });
  await prisma.termination.delete({ where: { id } });
  revalidateTermination(row?.employeeId);
}
