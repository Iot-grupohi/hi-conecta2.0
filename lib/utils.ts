import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Monta a URL da lista de colaboradores com os filtros ativos. */
export function buildEmployeesListHref(filters: {
  q?: string;
  setor?: string;
  cargo?: string;
  status?: string;
}): string {
  const params = new URLSearchParams();
  const q = filters.q?.trim();
  if (q) params.set("q", q);
  if (filters.setor && filters.setor !== "todos") params.set("setor", filters.setor);
  if (filters.cargo && filters.cargo !== "todos") params.set("cargo", filters.cargo);
  if (filters.status && filters.status !== "todos") params.set("status", filters.status);
  const qs = params.toString();
  return qs ? `/colaboradores?${qs}` : "/colaboradores";
}

/** Só aceita retorno interno para a lista de colaboradores. */
export function safeEmployeesReturnTo(value: string | null | undefined): string {
  const fallback = "/colaboradores";
  if (!value) return fallback;
  if (!value.startsWith("/colaboradores")) return fallback;
  if (value.startsWith("//") || value.includes("://")) return fallback;
  return value;
}

const ACRONYMS = new Set([
  "CLT",
  "PJ",
  "PIX",
  "ASO",
  "RG",
  "CPF",
  "CS",
  "NRP",
  "NRS",
  "NPF",
  "QSGI",
  "P&D",
  "VT",
  "TI",
  "CEO",
  "CTO",
  "CFO",
  "CRO",
  "RH",
  "HI",
]);

const LOWER_PARTICLES = new Set(["da", "das", "de", "del", "do", "dos", "e", "em", "na", "nas", "no", "nos", "para", "por"]);

/** Primeira maiúscula em cada palavra; preserva siglas e partículas (da, de, do…). */
export function toDisplayCase(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  return trimmed
    .split(/(\s+|—|\/)/)
    .map((part, index) => {
      if (!part || /^\s+$/.test(part) || part === "—" || part === "/") return part;
      const upper = part.toLocaleUpperCase("pt-BR");
      if (ACRONYMS.has(upper)) return upper;
      if (/^\d/.test(part) || /^[0-9]+[xX][0-9]+$/.test(part)) return upper;
      const lower = part.toLocaleLowerCase("pt-BR");
      if (index > 0 && LOWER_PARTICLES.has(lower)) return lower;
      return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    })
    .join("");
}

export function toDisplayCaseOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const next = toDisplayCase(value);
  return next || null;
}
