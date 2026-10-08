"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { emptyToNull, newId, type CrudActionState } from "@/lib/hr-write";
import { toDisplayCase } from "@/lib/utils";

export type PositionActionState = CrudActionState;

const schema = z.object({
  name: z.string().min(2, "Informe o nome do cargo"),
  departmentId: z.string().optional().nullable(),
});

export async function createPositionAction(
  _prev: PositionActionState,
  formData: FormData,
): Promise<PositionActionState> {
  try {
    await requirePermission("employees:create");
    const data = schema.parse({
      name: String(formData.get("name") ?? "").trim(),
      departmentId: emptyToNull(formData.get("departmentId")),
    });
    await prisma.position.create({
      data: {
        id: newId("pos"),
        name: toDisplayCase(data.name),
        departmentId: data.departmentId,
      },
    });
    revalidatePath("/cargos");
    revalidatePath("/colaboradores");
    return { success: "Cargo criado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível criar o cargo." };
  }
}

export async function updatePositionAction(
  _prev: PositionActionState,
  formData: FormData,
): Promise<PositionActionState> {
  try {
    await requirePermission("employees:update");
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Cargo inválido." };
    const data = schema.parse({
      name: String(formData.get("name") ?? "").trim(),
      departmentId: emptyToNull(formData.get("departmentId")),
    });
    await prisma.position.update({
      where: { id },
      data: {
        name: toDisplayCase(data.name),
        departmentId: data.departmentId,
      },
    });
    revalidatePath("/cargos");
    revalidatePath("/colaboradores");
    return { success: "Cargo atualizado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível atualizar o cargo." };
  }
}

export async function deletePositionAction(formData: FormData): Promise<void> {
  await requirePermission("employees:delete");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const linked = await prisma.employee.count({ where: { positionId: id } });
  if (linked > 0) {
    throw new Error("Não é possível excluir: há colaboradores vinculados.");
  }
  await prisma.position.delete({ where: { id } });
  revalidatePath("/cargos");
}
