"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Shield,
  Users,
  UserMinus,
  UserPlus,
  IdCard,
  UserRound,
  UtensilsCrossed,
  Shirt,
  Bus,
  WalletCards,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark, BrandWordmark } from "@/components/brand/logo";
import type { Role } from "@prisma/client";
import type { Permission } from "@/lib/permissions";

const rhNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, permission: "employees:read" as Permission },
  { href: "/colaboradores", label: "Colaboradores", icon: Users, permission: "employees:read" as Permission },
  { href: "/departamentos", label: "Departamentos", icon: Building2, permission: "employees:read" as Permission },
  { href: "/cargos", label: "Cargos", icon: IdCard, permission: "employees:read" as Permission },
  { href: "/admissoes", label: "Admissões", icon: UserPlus, permission: "employees:read" as Permission },
  { href: "/desligamentos", label: "Desligamentos", icon: UserMinus, permission: "employees:read" as Permission },
  { href: "/ferias", label: "Férias", icon: CalendarDays, permission: "employees:read" as Permission },
  { href: "/afastamentos", label: "Afastamentos", icon: HeartPulse, permission: "employees:read" as Permission },
  { href: "/beneficios", label: "Benefícios", icon: BriefcaseBusiness, permission: "employees:read" as Permission },
  {
    href: "/credito-alimentacao",
    label: "Crédito refeição",
    icon: UtensilsCrossed,
    permission: "employees:read" as Permission,
  },
  {
    href: "/credito-lavanderia",
    label: "Crédito lavanderia",
    icon: Shirt,
    permission: "employees:read" as Permission,
  },
  {
    href: "/credito-beneficios",
    label: "Controle CAJU",
    icon: WalletCards,
    permission: "employees:read" as Permission,
  },
  {
    href: "/credito-vale-transporte",
    label: "Vale transporte",
    icon: Bus,
    permission: "employees:read" as Permission,
  },
  {
    href: "/bonificacao-ifood",
    label: "Bonificação IFOOD",
    icon: Gift,
    permission: "employees:read" as Permission,
  },
  { href: "/aso", label: "Exames (ASO)", icon: ClipboardList, permission: "employees:read" as Permission },
  { href: "/usuarios", label: "Usuários", icon: Shield, permission: "users:manage" as Permission },
];

const collaboratorNavItems = [
  { href: "/meu-espaco", label: "Início", icon: LayoutDashboard, exact: true },
  { href: "/meu-espaco/dados", label: "Meus dados", icon: UserRound },
  { href: "/meu-espaco/ferias", label: "Férias", icon: CalendarDays },
  { href: "/meu-espaco/beneficios", label: "Benefícios", icon: BriefcaseBusiness },
  { href: "/meu-espaco/aso", label: "Exames (ASO)", icon: ClipboardList },
  { href: "/meu-espaco/documentos", label: "Documentos", icon: FileText },
];

export function Sidebar({
  onNavigate,
  role,
  permissions = [],
}: {
  onNavigate?: () => void;
  role?: Role | null;
  permissions?: Permission[];
}) {
  const pathname = usePathname();
  const items =
    role === "COLABORADOR"
      ? collaboratorNavItems
      : rhNavItems.filter((item) => permissions.includes(item.permission));

  return (
    <aside className="relative flex h-full w-64 flex-col overflow-hidden border-r border-white/10 bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)]">
      <div
        className="pointer-events-none absolute -left-16 top-10 h-40 w-40 rounded-full bg-[rgba(0,217,49,0.18)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 bottom-24 h-36 w-36 rounded-full bg-[rgba(0,24,200,0.28)] blur-3xl"
        aria-hidden
      />

      <div className="relative border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <BrandMark />
          <BrandWordmark light />
        </div>
        {role === "COLABORADOR" ? (
          <p className="mt-3 text-[10px] font-bold tracking-[0.16em] text-[var(--color-green)]">
            Meu espaço
          </p>
        ) : null}
      </div>

      <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const exact = "exact" in item && item.exact;
          const active = exact
            ? pathname === item.href
            : item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-pill)] px-3 py-2.5 text-xs font-bold tracking-wide transition-all duration-300",
                active
                  ? "bg-[var(--color-green)] text-[var(--color-navy)] shadow-[0_0_24px_-8px_rgba(0,217,49,0.7)]"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-white/10 px-4 py-4">
        <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-green)]">
          Transformamos tecnologia
        </p>
        <p className="mt-1 text-xs font-medium text-white/70">em eficiência para o seu negócio</p>
      </div>
    </aside>
  );
}
