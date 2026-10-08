import { auth } from "@/auth";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireSession();
  if (!hasPermission(session.user.role as Role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
