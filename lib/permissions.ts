import type { Role } from "@prisma/client";

export type Permission =
  | "employees:read"
  | "employees:create"
  | "employees:update"
  | "employees:delete"
  | "salary:read"
  | "benefits:read"
  | "users:manage"
  | "reports:read"
  | "settings:manage"
  | "self:read";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "employees:read",
    "employees:create",
    "employees:update",
    "employees:delete",
    "salary:read",
    "benefits:read",
    "users:manage",
    "reports:read",
    "settings:manage",
    "self:read",
  ],
  RH: [
    "employees:read",
    "employees:create",
    "employees:update",
    "employees:delete",
    "salary:read",
    "benefits:read",
    "users:manage",
    "reports:read",
    "self:read",
  ],
  GESTOR: ["employees:read", "benefits:read", "reports:read", "self:read"],
  VIEWER: ["employees:read", "reports:read"],
  COLABORADOR: ["self:read"],
};

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Permission required for an authenticated page. `null` = login is enough. */
export function requiredPermissionForPath(pathname: string): Permission | null {
  if (pathname.startsWith("/api/")) return null;
  if (pathname.startsWith("/meu-espaco")) return "self:read";
  if (pathname.startsWith("/usuarios")) return "users:manage";
  if (pathname.startsWith("/configuracoes")) return "settings:manage";
  if (pathname.startsWith("/relatorios")) return "reports:read";
  if (pathname.startsWith("/documentos")) return "employees:update";
  if (
    pathname === "/beneficios" ||
    pathname.startsWith("/beneficios/") ||
    pathname.startsWith("/credito-") ||
    pathname.startsWith("/bonificacao-ifood")
  ) {
    return "benefits:read";
  }
  return "employees:read";
}

export function canReadEmployeeDocument(input: {
  role: Role;
  viewerEmployeeId?: string | null;
  documentEmployeeId: string;
}): boolean {
  if (input.viewerEmployeeId && input.viewerEmployeeId === input.documentEmployeeId) {
    return true;
  }
  return hasPermission(input.role, "employees:update");
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  RH: "RH / DP",
  GESTOR: "Gestor",
  VIEWER: "Visualizador",
  COLABORADOR: "Colaborador",
};
