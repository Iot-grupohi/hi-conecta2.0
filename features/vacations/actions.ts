"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireSession } from "@/lib/auth-guard";
import { parseOptionalDate } from "@/lib/mappers";

export type VacationActionState = {
  error?: string;
  success?: string;
};

function calcBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const cursor = new Date(start);
  cursor.setHours(12, 0, 0, 0);
  const last = new Date(end);
  last.setHours(12, 0, 0, 0);
  while (cursor <= last) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

const requestSchema = z.object({
  startDate: z.string().min(1, "Informe a data de início"),
  endDate: z.string().min(1, "Informe a data de término"),
  notes: z.string().optional().nullable(),
});

export async function requestVacationAction(
  _prev: VacationActionState,
  formData: FormData,
): Promise<VacationActionState> {
  try {
    const session = await requireSession();
    const employeeId = session.user.employeeId;
    if (!employeeId) {
      return { error: "Sua conta não está vinculada a um colaborador." };
    }
    if (session.user.role !== "COLABORADOR" && !session.user.permissions.includes("self:read")) {
      return { error: "Sem permissão para solicitar férias." };
    }

    const parsed = requestSchema.parse({
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
      notes: String(formData.get("notes") ?? "").trim() || null,
    });

    const start = parseOptionalDate(parsed.startDate);
    const end = parseOptionalDate(parsed.endDate);
    if (!start || !end) return { error: "Datas inválidas." };
    if (end < start) return { error: "A data de término deve ser após o início." };

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true },
    });
    if (!employee) return { error: "Colaborador não encontrado." };

    const days = calcBusinessDays(start, end);
    if (days < 1) return { error: "Selecione um período com pelo menos 1 dia útil." };

    const id = `vac_req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    await prisma.vacation.create({
      data: {
        id,
        employeeId: employee.id,
        employeeName: employee.name,
        departmentId: employee.departmentId,
        departmentName: employee.department?.name ?? null,
        startDate: start,
        endDate: end,
        days,
        status: "pendente",
        notes: parsed.notes,
      },
    });

    revalidatePath("/meu-espaco");
    revalidatePath("/meu-espaco/ferias");
    revalidatePath("/ferias");
    revalidatePath("/");
    return { success: "Solicitação enviada ao RH. Acompanhe o status abaixo." };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { error: "Faça login novamente." };
    }
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Dados inválidos." };
    }
    console.error(error);
    return { error: "Não foi possível enviar a solicitação." };
  }
}

export async function approveVacationAction(formData: FormData): Promise<void> {
  await requirePermission("employees:update");
  const id = String(formData.get("id") ?? "");
  const rhNotes = String(formData.get("rhNotes") ?? "").trim() || null;
  if (!id) return;

  await prisma.vacation.update({
    where: { id },
    data: {
      status: "programada",
      rhNotes,
    },
  });

  revalidatePath("/ferias");
  revalidatePath("/meu-espaco");
  revalidatePath("/meu-espaco/ferias");
  revalidatePath("/");
}

export async function rejectVacationAction(formData: FormData): Promise<void> {
  await requirePermission("employees:update");
  const id = String(formData.get("id") ?? "");
  const rhNotes = String(formData.get("rhNotes") ?? "").trim() || null;
  if (!id) return;

  await prisma.vacation.update({
    where: { id },
    data: {
      status: "recusada",
      rhNotes: rhNotes ?? "Solicitação recusada pelo RH.",
    },
  });

  revalidatePath("/ferias");
  revalidatePath("/meu-espaco");
  revalidatePath("/meu-espaco/ferias");
  revalidatePath("/");
}

const rhVacationSchema = z.object({
  employeeId: z.string().optional().nullable(),
  employeeName: z.string().min(2, "Informe o colaborador"),
  startDate: z.string().min(1, "Informe o início"),
  endDate: z.string().min(1, "Informe o término"),
  status: z.enum(["concluida", "programada", "solicitar", "pendente", "recusada"]),
  notes: z.string().optional().nullable(),
  rhNotes: z.string().optional().nullable(),
  days: z.string().optional().nullable(),
});

function emptyToNullLocal(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function revalidateVacationPaths(employeeId?: string | null) {
  revalidatePath("/ferias");
  revalidatePath("/meu-espaco");
  revalidatePath("/meu-espaco/ferias");
  revalidatePath("/");
  if (employeeId) revalidatePath(`/colaboradores/${employeeId}`);
}

export async function createVacationRhAction(
  _prev: VacationActionState,
  formData: FormData,
): Promise<VacationActionState> {
  try {
    await requirePermission("employees:create");
    const data = rhVacationSchema.parse({
      employeeId: emptyToNullLocal(formData.get("employeeId")),
      employeeName: String(formData.get("employeeName") ?? "").trim(),
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
      status: String(formData.get("status") ?? "programada"),
      notes: emptyToNullLocal(formData.get("notes")),
      rhNotes: emptyToNullLocal(formData.get("rhNotes")),
      days: emptyToNullLocal(formData.get("days")),
    });
    const start = parseOptionalDate(data.startDate);
    const end = parseOptionalDate(data.endDate);
    if (!start || !end) return { error: "Datas inválidas." };
    if (end < start) return { error: "Término deve ser após o início." };

    const emp = data.employeeId
      ? await prisma.employee.findUnique({
          where: { id: data.employeeId },
          include: { department: true },
        })
      : null;

    const days =
      data.days && Number.isFinite(Number(data.days))
        ? Math.round(Number(data.days))
        : calcBusinessDays(start, end);

    await prisma.vacation.create({
      data: {
        id: `vac_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        employeeId: emp?.id ?? data.employeeId,
        employeeName: emp?.name ?? data.employeeName,
        departmentId: emp?.departmentId ?? null,
        departmentName: emp?.department?.name ?? null,
        startDate: start,
        endDate: end,
        days,
        status: data.status,
        notes: data.notes,
        rhNotes: data.rhNotes,
      },
    });
    revalidateVacationPaths(emp?.id ?? data.employeeId);
    return { success: "Férias registradas." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível salvar as férias." };
  }
}

export async function updateVacationRhAction(
  _prev: VacationActionState,
  formData: FormData,
): Promise<VacationActionState> {
  try {
    await requirePermission("employees:update");
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Registro inválido." };
    const data = rhVacationSchema.parse({
      employeeId: emptyToNullLocal(formData.get("employeeId")),
      employeeName: String(formData.get("employeeName") ?? "").trim(),
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
      status: String(formData.get("status") ?? "programada"),
      notes: emptyToNullLocal(formData.get("notes")),
      rhNotes: emptyToNullLocal(formData.get("rhNotes")),
      days: emptyToNullLocal(formData.get("days")),
    });
    const start = parseOptionalDate(data.startDate);
    const end = parseOptionalDate(data.endDate);
    if (!start || !end) return { error: "Datas inválidas." };

    const days =
      data.days && Number.isFinite(Number(data.days))
        ? Math.round(Number(data.days))
        : calcBusinessDays(start, end);

    await prisma.vacation.update({
      where: { id },
      data: {
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        startDate: start,
        endDate: end,
        days,
        status: data.status,
        notes: data.notes,
        rhNotes: data.rhNotes,
      },
    });
    revalidateVacationPaths(data.employeeId);
    return { success: "Férias atualizadas." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível atualizar." };
  }
}

export async function deleteVacationAction(formData: FormData): Promise<void> {
  await requirePermission("employees:delete");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const row = await prisma.vacation.findUnique({ where: { id } });
  await prisma.vacation.delete({ where: { id } });
  revalidateVacationPaths(row?.employeeId);
}
