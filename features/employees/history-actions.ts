"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { parseOptionalDate } from "@/lib/mappers";
import { emptyToNull, newId, type CrudActionState } from "@/lib/hr-write";
import { toDisplayCase } from "@/lib/utils";

export type HistoryActionState = CrudActionState;

export async function upsertProbationAction(
  _prev: HistoryActionState,
  formData: FormData,
): Promise<HistoryActionState> {
  try {
    await requirePermission("employees:update");
    const id = emptyToNull(formData.get("id"));
    const employeeId = emptyToNull(formData.get("employeeId"));
    const employeeName = String(formData.get("employeeName") ?? "").trim();
    if (!employeeName) return { error: "Informe o colaborador." };
    const payload = {
      employeeId,
      employeeName: toDisplayCase(employeeName),
      hireDate: parseOptionalDate(emptyToNull(formData.get("hireDate"))),
      firstPeriodEnd: parseOptionalDate(emptyToNull(formData.get("firstPeriodEnd"))),
      secondPeriodEnd: parseOptionalDate(emptyToNull(formData.get("secondPeriodEnd"))),
    };
    if (id) {
      await prisma.probationPeriod.update({ where: { id }, data: payload });
    } else {
      await prisma.probationPeriod.create({ data: { id: newId("prob"), ...payload } });
    }
    if (employeeId) revalidatePath(`/colaboradores/${employeeId}`);
    return { success: "Período salvo." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível salvar." };
  }
}

export async function deleteProbationAction(formData: FormData): Promise<void> {
  await requirePermission("employees:delete");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const row = await prisma.probationPeriod.findUnique({ where: { id } });
  await prisma.probationPeriod.delete({ where: { id } });
  if (row?.employeeId) revalidatePath(`/colaboradores/${row.employeeId}`);
}

export async function upsertInsuranceAction(
  _prev: HistoryActionState,
  formData: FormData,
): Promise<HistoryActionState> {
  try {
    await requirePermission("employees:update");
    const id = emptyToNull(formData.get("id"));
    const employeeId = emptyToNull(formData.get("employeeId"));
    const name = String(formData.get("name") ?? "").trim();
    const provider = String(formData.get("provider") ?? "").trim();
    if (!name || !provider) return { error: "Informe nome e operadora." };
    const payload = {
      employeeId,
      name: toDisplayCase(name),
      cpf: emptyToNull(formData.get("cpf")),
      provider,
    };
    if (id) {
      await prisma.healthInsurance.update({ where: { id }, data: payload });
    } else {
      await prisma.healthInsurance.create({ data: payload });
    }
    if (employeeId) {
      await prisma.employee.update({
        where: { id: employeeId },
        data: { hasHealthInsurance: true },
      });
      revalidatePath(`/colaboradores/${employeeId}`);
    }
    revalidatePath("/beneficios");
    return { success: "Plano salvo." };
  } catch (error) {
    console.error(error);
    return { error: "Não foi possível salvar." };
  }
}

export async function deleteInsuranceAction(formData: FormData): Promise<void> {
  await requirePermission("employees:delete");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const row = await prisma.healthInsurance.findUnique({ where: { id } });
  await prisma.healthInsurance.delete({ where: { id } });
  if (row?.employeeId) revalidatePath(`/colaboradores/${row.employeeId}`);
  revalidatePath("/beneficios");
}
