"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import {
  emptyToNull,
  MONTH_LABELS,
  newId,
  parseNumber,
  type CrudActionState,
} from "@/lib/hr-write";
import { toDisplayCase } from "@/lib/utils";

export type CreditActionState = CrudActionState;

async function resolveEmployee(employeeId: string | null, employeeName: string) {
  if (employeeId) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (emp) return emp;
  }
  return prisma.employee.findFirst({
    where: { name: { equals: toDisplayCase(employeeName) } },
  });
}

function monthFields(formData: FormData) {
  const monthNumber = Number(String(formData.get("monthNumber") ?? "0"));
  const year = Number(String(formData.get("year") ?? new Date().getFullYear()));
  if (!monthNumber || monthNumber < 1 || monthNumber > 12) {
    throw new z.ZodError([{ code: "custom", message: "Mês inválido", path: ["monthNumber"] }]);
  }
  if (!year || year < 2000) {
    throw new z.ZodError([{ code: "custom", message: "Ano inválido", path: ["year"] }]);
  }
  return {
    monthNumber,
    year,
    monthLabel: MONTH_LABELS[monthNumber] ?? String(monthNumber),
  };
}

/* —— Lavanderia —— */
export async function upsertLaundryCreditAction(
  _prev: CreditActionState,
  formData: FormData,
): Promise<CreditActionState> {
  try {
    await requirePermission("employees:update");
    const id = emptyToNull(formData.get("id"));
    const employeeId = emptyToNull(formData.get("employeeId"));
    const employeeName = String(formData.get("employeeName") ?? "").trim();
    if (!employeeName) return { error: "Informe o colaborador." };
    const amount = parseNumber(emptyToNull(formData.get("amount")));
    if (amount == null) return { error: "Informe o valor." };
    const fullAmount = parseNumber(emptyToNull(formData.get("fullAmount"))) ?? 120;
    const isProportional = formData.get("isProportional") === "on";
    const { monthNumber, year, monthLabel } = monthFields(formData);
    const emp = await resolveEmployee(employeeId, employeeName);
    const payload = {
      employeeId: emp?.id ?? employeeId,
      employeeName: emp?.name ?? toDisplayCase(employeeName),
      cpf: emp?.cpf ?? emptyToNull(formData.get("cpf")),
      year,
      monthLabel,
      monthNumber,
      amount,
      fullAmount,
      isProportional,
      notes: emptyToNull(formData.get("notes")),
    };
    if (id) {
      await prisma.laundryCredit.update({ where: { id }, data: payload });
    } else {
      await prisma.laundryCredit.create({ data: { id: newId("lau"), ...payload } });
    }
    revalidatePath("/credito-lavanderia");
    if (payload.employeeId) revalidatePath(`/colaboradores/${payload.employeeId}`);
    return { success: id ? "Crédito atualizado." : "Crédito criado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível salvar." };
  }
}

export async function deleteLaundryCreditAction(formData: FormData): Promise<void> {
  await requirePermission("employees:delete");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const row = await prisma.laundryCredit.findUnique({ where: { id } });
  await prisma.laundryCredit.delete({ where: { id } });
  revalidatePath("/credito-lavanderia");
  if (row?.employeeId) revalidatePath(`/colaboradores/${row.employeeId}`);
}

/* —— Vale transporte —— */
export async function upsertTransportCreditAction(
  _prev: CreditActionState,
  formData: FormData,
): Promise<CreditActionState> {
  try {
    await requirePermission("employees:update");
    const id = emptyToNull(formData.get("id"));
    const employeeId = emptyToNull(formData.get("employeeId"));
    const employeeName = String(formData.get("employeeName") ?? "").trim();
    if (!employeeName) return { error: "Informe o colaborador." };
    const totalAmount = parseNumber(emptyToNull(formData.get("totalAmount")));
    if (totalAmount == null) return { error: "Informe o total." };
    const { monthNumber, year, monthLabel } = monthFields(formData);
    const emp = await resolveEmployee(employeeId, employeeName);
    const payload = {
      employeeId: emp?.id ?? employeeId,
      employeeName: emp?.name ?? toDisplayCase(employeeName),
      year,
      monthLabel,
      monthNumber,
      departmentName: emptyToNull(formData.get("departmentName")),
      status: emptyToNull(formData.get("status")),
      location: emptyToNull(formData.get("location")),
      cardNumber: emptyToNull(formData.get("cardNumber")),
      fare1: parseNumber(emptyToNull(formData.get("fare1"))),
      fare2: parseNumber(emptyToNull(formData.get("fare2"))),
      tripsPerDay: parseNumber(emptyToNull(formData.get("tripsPerDay"))),
      dailyValue: parseNumber(emptyToNull(formData.get("dailyValue"))),
      days: parseNumber(emptyToNull(formData.get("days"))),
      totalAmount,
      isProportional: formData.get("isProportional") === "on",
      balance: parseNumber(emptyToNull(formData.get("balance"))),
      notes: emptyToNull(formData.get("notes")),
    };
    if (id) {
      await prisma.transportCredit.update({ where: { id }, data: payload });
    } else {
      await prisma.transportCredit.create({ data: { id: newId("vt"), ...payload } });
    }
    revalidatePath("/credito-vale-transporte");
    if (payload.employeeId) revalidatePath(`/colaboradores/${payload.employeeId}`);
    return { success: id ? "Crédito atualizado." : "Crédito criado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível salvar." };
  }
}

export async function deleteTransportCreditAction(formData: FormData): Promise<void> {
  await requirePermission("employees:delete");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const row = await prisma.transportCredit.findUnique({ where: { id } });
  await prisma.transportCredit.delete({ where: { id } });
  revalidatePath("/credito-vale-transporte");
  if (row?.employeeId) revalidatePath(`/colaboradores/${row.employeeId}`);
}

/* —— CAJU —— */
export async function upsertBenefitCreditAction(
  _prev: CreditActionState,
  formData: FormData,
): Promise<CreditActionState> {
  try {
    await requirePermission("employees:update");
    const id = emptyToNull(formData.get("id"));
    const employeeId = emptyToNull(formData.get("employeeId"));
    const employeeName = String(formData.get("employeeName") ?? "").trim();
    if (!employeeName) return { error: "Informe o colaborador." };
    const { monthNumber, year, monthLabel } = monthFields(formData);
    const emp = await resolveEmployee(employeeId, employeeName);
    const payload = {
      employeeId: emp?.id ?? employeeId,
      employeeName: emp?.name ?? toDisplayCase(employeeName),
      cpf: emp?.cpf ?? emptyToNull(formData.get("cpf")),
      year,
      monthLabel,
      monthNumber,
      departmentName: emptyToNull(formData.get("departmentName")),
      workDays: parseNumber(emptyToNull(formData.get("workDays"))),
      workDaysNote: emptyToNull(formData.get("workDaysNote")),
      mealAmount: parseNumber(emptyToNull(formData.get("mealAmount"))),
      mobilityAmount: parseNumber(emptyToNull(formData.get("mobilityAmount"))),
      mobilityNote: emptyToNull(formData.get("mobilityNote")),
      transportAmount: parseNumber(emptyToNull(formData.get("transportAmount"))),
      isProportional: formData.get("isProportional") === "on",
      notes: emptyToNull(formData.get("notes")),
    };
    if (id) {
      await prisma.benefitCredit.update({ where: { id }, data: payload });
    } else {
      await prisma.benefitCredit.create({ data: { id: newId("caju"), ...payload } });
    }
    revalidatePath("/credito-beneficios");
    if (payload.employeeId) revalidatePath(`/colaboradores/${payload.employeeId}`);
    return { success: id ? "Lançamento atualizado." : "Lançamento criado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível salvar." };
  }
}

export async function deleteBenefitCreditAction(formData: FormData): Promise<void> {
  await requirePermission("employees:delete");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const row = await prisma.benefitCredit.findUnique({ where: { id } });
  await prisma.benefitCredit.delete({ where: { id } });
  revalidatePath("/credito-beneficios");
  if (row?.employeeId) revalidatePath(`/colaboradores/${row.employeeId}`);
}

/* —— Refeição parceiro —— */
export async function upsertMealPartnerCreditAction(
  _prev: CreditActionState,
  formData: FormData,
): Promise<CreditActionState> {
  try {
    await requirePermission("employees:update");
    const id = emptyToNull(formData.get("id"));
    const employeeId = emptyToNull(formData.get("employeeId"));
    const employeeName = String(formData.get("employeeName") ?? "").trim();
    if (!employeeName) return { error: "Informe o colaborador." };
    const quantity = parseNumber(emptyToNull(formData.get("quantity")));
    const consumptionValue = parseNumber(emptyToNull(formData.get("consumptionValue")));
    if (quantity == null || consumptionValue == null) {
      return { error: "Informe quantidade e valor." };
    }
    const { monthNumber, year, monthLabel } = monthFields(formData);
    const emp = await resolveEmployee(employeeId, employeeName);
    const payload = {
      employeeId: emp?.id ?? employeeId,
      employeeName: emp?.name ?? toDisplayCase(employeeName),
      partnerName: emptyToNull(formData.get("partnerName")) ?? "Paraíba Grill",
      year,
      monthLabel,
      monthNumber,
      orderDates: emptyToNull(formData.get("orderDates")) ?? "",
      quantity,
      unitValue: parseNumber(emptyToNull(formData.get("unitValue"))) ?? 0,
      consumptionValue,
      notes: emptyToNull(formData.get("notes")),
    };
    if (id) {
      await prisma.mealPartnerCredit.update({ where: { id }, data: payload });
    } else {
      await prisma.mealPartnerCredit.create({ data: { id: newId("meal"), ...payload } });
    }
    revalidatePath("/credito-alimentacao");
    if (payload.employeeId) revalidatePath(`/colaboradores/${payload.employeeId}`);
    return { success: id ? "Crédito atualizado." : "Crédito criado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível salvar." };
  }
}

export async function deleteMealPartnerCreditAction(formData: FormData): Promise<void> {
  await requirePermission("employees:delete");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const row = await prisma.mealPartnerCredit.findUnique({ where: { id } });
  await prisma.mealPartnerCredit.delete({ where: { id } });
  revalidatePath("/credito-alimentacao");
  if (row?.employeeId) revalidatePath(`/colaboradores/${row.employeeId}`);
}

/* —— Bonificação IFOOD —— */
export async function upsertIfoodBonusAction(
  _prev: CreditActionState,
  formData: FormData,
): Promise<CreditActionState> {
  try {
    await requirePermission("employees:update");
    const id = emptyToNull(formData.get("id"));
    const employeeId = emptyToNull(formData.get("employeeId"));
    const employeeName = String(formData.get("employeeName") ?? "").trim();
    if (!employeeName) return { error: "Informe o colaborador." };
    const amount = parseNumber(emptyToNull(formData.get("amount")));
    if (amount == null) return { error: "Informe o valor." };
    const { monthNumber, year, monthLabel } = monthFields(formData);
    const emp = await resolveEmployee(employeeId, employeeName);
    const payload = {
      employeeId: emp?.id ?? employeeId,
      employeeName: emp?.name ?? toDisplayCase(employeeName),
      cpf: emp?.cpf ?? emptyToNull(formData.get("cpf")),
      email: emptyToNull(formData.get("email")),
      phone: emptyToNull(formData.get("phone")),
      costCenter: emptyToNull(formData.get("costCenter")),
      year,
      monthLabel,
      monthNumber,
      amount,
      mealPatAmount: parseNumber(emptyToNull(formData.get("mealPatAmount"))),
      ifoodEatAmount: parseNumber(emptyToNull(formData.get("ifoodEatAmount"))),
      notes: emptyToNull(formData.get("notes")),
    };
    if (id) {
      await prisma.ifoodBonus.update({ where: { id }, data: payload });
    } else {
      await prisma.ifoodBonus.create({ data: { id: newId("ifo"), ...payload } });
    }
    revalidatePath("/bonificacao-ifood");
    if (payload.employeeId) revalidatePath(`/colaboradores/${payload.employeeId}`);
    return { success: id ? "Bonificação atualizada." : "Bonificação criada." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível salvar." };
  }
}

export async function deleteIfoodBonusAction(formData: FormData): Promise<void> {
  await requirePermission("employees:delete");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const row = await prisma.ifoodBonus.findUnique({ where: { id } });
  await prisma.ifoodBonus.delete({ where: { id } });
  revalidatePath("/bonificacao-ifood");
  if (row?.employeeId) revalidatePath(`/colaboradores/${row.employeeId}`);
}
