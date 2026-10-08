import type { Permission } from "@/lib/permissions";

export function canWriteHr(permissions: Permission[]): boolean {
  return permissions.includes("employees:update");
}

export function canCreateHr(permissions: Permission[]): boolean {
  return permissions.includes("employees:create");
}

export function canDeleteHr(permissions: Permission[]): boolean {
  return permissions.includes("employees:delete");
}

export type CrudActionState = {
  error?: string;
  success?: string;
};

export function emptyToNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

export function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const MONTH_LABELS: Record<number, string> = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro",
};
