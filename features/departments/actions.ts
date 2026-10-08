"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { emptyToNull, newId, type CrudActionState } from "@/lib/hr-write";
import { toDisplayCase, toDisplayCaseOrNull } from "@/lib/utils";

export type DepartmentActionState = CrudActionState;

const schema = z.object({
  name: z.string().min(2, "Informe o nome do departamento"),
  managerName: z.string().optional().nullable(),
  directorName: z.string().optional().nullable(),
});

export async function createDepartmentAction(
  _prev: DepartmentActionState,
  formData: FormData,
): Promise<DepartmentActionState> {
  try {
    await requirePermission("employees:create");
    const data = schema.parse({
      name: String(formData.get("name") ?? "").trim(),
      managerName: emptyToNull(formData.get("managerName")),
      directorName: emptyToNull(formData.get("directorName")),
    });
    const name = toDisplayCase(data.name);
    const exists = await prisma.department.findFirst({ where: { name: { equals: name } } });
    if (exists) return { error: "Já existe um departamento com esse nome." };

    await prisma.department.create({
      data: {
        id: newId("dep"),
        name,
        managerName: toDisplayCaseOrNull(data.managerName),
        directorName: toDisplayCaseOrNull(data.directorName),
      },
    });
    revalidatePath("/departamentos");
    revalidatePath("/colaboradores");
    return { success: "Departamento criado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível criar o departamento." };
  }
}

export async function updateDepartmentAction(
  _prev: DepartmentActionState,
  formData: FormData,
): Promise<DepartmentActionState> {
  try {
    await requirePermission("employees:update");
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Departamento inválido." };
    const data = schema.parse({
      name: String(formData.get("name") ?? "").trim(),
      managerName: emptyToNull(formData.get("managerName")),
      directorName: emptyToNull(formData.get("directorName")),
    });
    await prisma.department.update({
      where: { id },
      data: {
        name: toDisplayCase(data.name),
        managerName: toDisplayCaseOrNull(data.managerName),
        directorName: toDisplayCaseOrNull(data.directorName),
      },
    });
    revalidatePath("/departamentos");
    revalidatePath("/colaboradores");
    return { success: "Departamento atualizado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível atualizar o departamento." };
  }
}

export async function deleteDepartmentAction(
  _prev: DepartmentActionState,
  formData: FormData,
): Promise<DepartmentActionState> {
  try {
    await requirePermission("employees:delete");
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Departamento inválido." };

    // O card de departamentos conta só ativos — bloqueia só se ainda houver ativos.
    const activeLinked = await prisma.employee.count({
      where: { departmentId: id, status: { not: "desligado" } },
    });
    if (activeLinked > 0) {
      return {
        error: `Não é possível excluir: há ${activeLinked} colaborador(es) ativo(s) vinculado(s). Transfira-os antes.`,
      };
    }

    // Desvincula desligados, cargos e férias para não bloquear a exclusão por FK.
    await prisma.employee.updateMany({
      where: { departmentId: id },
      data: { departmentId: null },
    });
    await prisma.position.updateMany({
      where: { departmentId: id },
      data: { departmentId: null },
    });
    await prisma.vacation.updateMany({
      where: { departmentId: id },
      data: { departmentId: null },
    });

    await prisma.department.delete({ where: { id } });
    revalidatePath("/departamentos");
    revalidatePath("/cargos");
    revalidatePath("/ferias");
    return { success: "Departamento excluído." };
  } catch (error) {
    console.error(error);
    return { error: "Não foi possível excluir o departamento." };
  }
}
