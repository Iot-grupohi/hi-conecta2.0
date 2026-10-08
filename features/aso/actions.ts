"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { emptyToNull, newId, type CrudActionState } from "@/lib/hr-write";
import { toDisplayCase, toDisplayCaseOrNull } from "@/lib/utils";

export type AsoActionState = CrudActionState;

const schema = z.object({
  employeeId: z.string().optional().nullable(),
  employeeName: z.string().min(2, "Informe o colaborador"),
  departmentName: z.string().optional().nullable(),
  admissionExamDate: z.string().optional().nullable(),
  admissionExamValidUntil: z.string().optional().nullable(),
  periodic1Date: z.string().optional().nullable(),
  periodic1ValidUntil: z.string().optional().nullable(),
  periodic2Date: z.string().optional().nullable(),
  periodic2ValidUntil: z.string().optional().nullable(),
  periodic3Date: z.string().optional().nullable(),
  periodic3ValidUntil: z.string().optional().nullable(),
});

function revalidateAso(employeeId?: string | null) {
  revalidatePath("/aso");
  if (employeeId) {
    revalidatePath(`/colaboradores/${employeeId}`);
    revalidatePath("/meu-espaco/aso");
  }
}

export async function createAsoAction(
  _prev: AsoActionState,
  formData: FormData,
): Promise<AsoActionState> {
  try {
    await requirePermission("employees:create");
    const data = schema.parse({
      employeeId: emptyToNull(formData.get("employeeId")),
      employeeName: String(formData.get("employeeName") ?? "").trim(),
      departmentName: emptyToNull(formData.get("departmentName")),
      admissionExamDate: emptyToNull(formData.get("admissionExamDate")),
      admissionExamValidUntil: emptyToNull(formData.get("admissionExamValidUntil")),
      periodic1Date: emptyToNull(formData.get("periodic1Date")),
      periodic1ValidUntil: emptyToNull(formData.get("periodic1ValidUntil")),
      periodic2Date: emptyToNull(formData.get("periodic2Date")),
      periodic2ValidUntil: emptyToNull(formData.get("periodic2ValidUntil")),
      periodic3Date: emptyToNull(formData.get("periodic3Date")),
      periodic3ValidUntil: emptyToNull(formData.get("periodic3ValidUntil")),
    });
    let emp = data.employeeId
      ? await prisma.employee.findUnique({ where: { id: data.employeeId } })
      : null;
    await prisma.asoExam.create({
      data: {
        id: newId("aso"),
        employeeId: emp?.id ?? data.employeeId,
        employeeName: emp?.name ?? toDisplayCase(data.employeeName),
        departmentName: toDisplayCaseOrNull(data.departmentName),
        admissionExamDate: data.admissionExamDate,
        admissionExamValidUntil: data.admissionExamValidUntil,
        periodic1Date: data.periodic1Date,
        periodic1ValidUntil: data.periodic1ValidUntil,
        periodic2Date: data.periodic2Date,
        periodic2ValidUntil: data.periodic2ValidUntil,
        periodic3Date: data.periodic3Date,
        periodic3ValidUntil: data.periodic3ValidUntil,
      },
    });
    revalidateAso(emp?.id ?? data.employeeId);
    return { success: "ASO registrado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível salvar o ASO." };
  }
}

export async function updateAsoAction(
  _prev: AsoActionState,
  formData: FormData,
): Promise<AsoActionState> {
  try {
    await requirePermission("employees:update");
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Registro inválido." };
    const data = schema.parse({
      employeeId: emptyToNull(formData.get("employeeId")),
      employeeName: String(formData.get("employeeName") ?? "").trim(),
      departmentName: emptyToNull(formData.get("departmentName")),
      admissionExamDate: emptyToNull(formData.get("admissionExamDate")),
      admissionExamValidUntil: emptyToNull(formData.get("admissionExamValidUntil")),
      periodic1Date: emptyToNull(formData.get("periodic1Date")),
      periodic1ValidUntil: emptyToNull(formData.get("periodic1ValidUntil")),
      periodic2Date: emptyToNull(formData.get("periodic2Date")),
      periodic2ValidUntil: emptyToNull(formData.get("periodic2ValidUntil")),
      periodic3Date: emptyToNull(formData.get("periodic3Date")),
      periodic3ValidUntil: emptyToNull(formData.get("periodic3ValidUntil")),
    });
    await prisma.asoExam.update({
      where: { id },
      data: {
        employeeId: data.employeeId,
        employeeName: toDisplayCase(data.employeeName),
        departmentName: toDisplayCaseOrNull(data.departmentName),
        admissionExamDate: data.admissionExamDate,
        admissionExamValidUntil: data.admissionExamValidUntil,
        periodic1Date: data.periodic1Date,
        periodic1ValidUntil: data.periodic1ValidUntil,
        periodic2Date: data.periodic2Date,
        periodic2ValidUntil: data.periodic2ValidUntil,
        periodic3Date: data.periodic3Date,
        periodic3ValidUntil: data.periodic3ValidUntil,
      },
    });
    revalidateAso(data.employeeId);
    return { success: "ASO atualizado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível atualizar." };
  }
}

export async function deleteAsoAction(formData: FormData): Promise<void> {
  await requirePermission("employees:delete");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const row = await prisma.asoExam.findUnique({ where: { id } });
  await prisma.asoExam.delete({ where: { id } });
  revalidateAso(row?.employeeId);
}
