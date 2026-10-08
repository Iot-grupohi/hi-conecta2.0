import type { Role } from "@prisma/client";

export type Permission =
  | "employees:read"
  | "employees:create"
  | "employees:update"
  | "employees:delete"
  | "salary:read"
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
    "users:manage",
    "reports:read",
    "self:read",
  ],
  GESTOR: ["employees:read", "reports:read", "self:read"],
  VIEWER: ["employees:read", "reports:read"],
  COLABORADOR: ["self:read"],
};

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  RH: "RH / DP",
  GESTOR: "Gestor",
  VIEWER: "Visualizador",
  COLABORADOR: "Colaborador",
};
