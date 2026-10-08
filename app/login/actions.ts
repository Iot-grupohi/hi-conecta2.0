"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");
  const defaultDest = email.startsWith("colaborador@") ? "/meu-espaco" : "/";
  const redirectTo =
    callbackUrl && callbackUrl !== "/" ? callbackUrl : defaultDest;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
