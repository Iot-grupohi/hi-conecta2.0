"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { emptyToNull, type CrudActionState } from "@/lib/hr-write";

export type UserActionState = CrudActionState;

const ROLES: Role[] = ["ADMIN", "RH", "GESTOR", "VIEWER", "COLABORADOR"];

const createSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha com pelo menos 6 caracteres"),
  role: z.enum(["ADMIN", "RH", "GESTOR", "VIEWER", "COLABORADOR"]),
  employeeId: z.string().optional().nullable(),
  active: z.boolean(),
});

export async function createUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  try {
    await requirePermission("users:manage");
    const data = createSchema.parse({
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "VIEWER"),
      employeeId: emptyToNull(formData.get("employeeId")),
      active: formData.get("active") === "on",
    });
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return { error: "Já existe um usuário com este e-mail." };
    const passwordHash = await bcrypt.hash(data.password, 10);
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        employeeId: data.employeeId,
        active: data.active,
      },
    });
    revalidatePath("/usuarios");
    return { success: "Usuário criado." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Dados inválidos." };
    console.error(error);
    return { error: "Não foi possível criar o usuário." };
  }
}

export async function updateUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  try {
    await requirePermission("users:manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Usuário inválido." };
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const role = String(formData.get("role") ?? "VIEWER") as Role;
    const employeeId = emptyToNull(formData.get("employeeId"));
    const active = formData.get("active") === "on";
    const password = String(formData.get("password") ?? "");
    if (!name || !email) return { error: "Nome e e-mail são obrigatórios." };
    if (!ROLES.includes(role)) return { error: "Papel inválido." };

    const data: {
      name: string;
      email: string;
      role: Role;
      employeeId: string | null;
      active: boolean;
      passwordHash?: string;
    } = { name, email, role, employeeId, active };

    if (password) {
      if (password.length < 6) return { error: "Senha com pelo menos 6 caracteres." };
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({ where: { id }, data });
    revalidatePath("/usuarios");
    return { success: "Usuário atualizado." };
  } catch (error) {
    console.error(error);
    return { error: "Não foi possível atualizar o usuário." };
  }
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const session = await requirePermission("users:manage");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (session.user.id === id) {
    throw new Error("Você não pode excluir a própria conta.");
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/usuarios");
}
