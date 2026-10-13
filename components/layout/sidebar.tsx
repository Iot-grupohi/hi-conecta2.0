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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark, BrandWordmark } from "@/components/brand/logo";
import type { Role } from "@prisma/client";
import { hasPermission, type Permission } from "@/lib/permissions";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: Permission;
  exact?: boolean;
};

type NavGroup = {
  title?: string;
  items: NavItem[];
};

const rhNavGroups: NavGroup[] = [
  {
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard, permission: "employees:read", exact: true }],
  },
  {
    title: "Pessoas",
    items: [
      { href: "/colaboradores", label: "Colaboradores", icon: Users, permission: "employees:read" },
      { href: "/departamentos", label: "Departamentos", icon: Building2, permission: "employees:read" },
      { href: "/cargos", label: "Cargos", icon: IdCard, permission: "employees:read" },
    ],
  },
  {
    title: "Movimentações",
    items: [
      { href: "/admissoes", label: "Admissões", icon: UserPlus, permission: "employees:read" },
      { href: "/desligamentos", label: "Desligamentos", icon: UserMinus, permission: "employees:read" },
      { href: "/ferias", label: "Férias", icon: CalendarDays, permission: "employees:read" },
      { href: "/afastamentos", label: "Afastamentos", icon: HeartPulse, permission: "employees:read" },
    ],
  },
  {
    title: "Benefícios",
    items: [
      { href: "/beneficios", label: "Visão geral", icon: BriefcaseBusiness, permission: "benefits:read" },
      { href: "/credito-alimentacao", label: "Crédito refeição", icon: UtensilsCrossed, permission: "benefits:read" },
      { href: "/credito-lavanderia", label: "Crédito lavanderia", icon: Shirt, permission: "benefits:read" },
      { href: "/credito-beneficios", label: "Controle CAJU", icon: WalletCards, permission: "benefits:read" },
      { href: "/credito-vale-transporte", label: "Vale transporte", icon: Bus, permission: "benefits:read" },
      { href: "/bonificacao-ifood", label: "Bonificação iFood", icon: Gift, permission: "benefits:read" },
    ],
  },
  {
    title: "Saúde e documentos",
    items: [
      { href: "/aso", label: "Exames (ASO)", icon: ClipboardList, permission: "employees:read" },
      { href: "/documentos", label: "Documentos", icon: FileText, permission: "employees:update" },
    ],
  },
  {
    title: "Administração",
    items: [{ href: "/usuarios", label: "Usuários", icon: Shield, permission: "users:manage" }],
  },
];

const collaboratorNavGroups: NavGroup[] = [
  {
    items: [
      { href: "/meu-espaco", label: "Início", icon: LayoutDashboard, exact: true },
      { href: "/meu-espaco/dados", label: "Meus dados", icon: UserRound },
      { href: "/meu-espaco/ferias", label: "Férias", icon: CalendarDays },
      { href: "/meu-espaco/beneficios", label: "Benefícios", icon: BriefcaseBusiness },
      { href: "/meu-espaco/aso", label: "Exames (ASO)", icon: ClipboardList },
      { href: "/meu-espaco/documentos", label: "Documentos", icon: FileText },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function Sidebar({
  onNavigate,
  role,
}: {
  onNavigate?: () => void;
  role?: Role | null;
}) {
  const pathname = usePathname();
  const groups =
    role === "COLABORADOR"
      ? collaboratorNavGroups
      : rhNavGroups
          .map((group) => ({
            ...group,
            items: group.items.filter(
              (item) => role && (!item.permission || hasPermission(role, item.permission)),
            ),
          }))
          .filter((group) => group.items.length > 0);

  return (
    <aside className="flex h-full w-full flex-col border-r border-white/[0.06] bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)]">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-5">
        <BrandMark size="sm" />
        <BrandWordmark light />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
        {role === "COLABORADOR" ? (
          <p className="px-3 text-[11px] font-semibold text-[var(--color-green)]">Meu espaço</p>
        ) : null}
        {groups.map((group, index) => (
          <div key={group.title ?? index}>
            {group.title ? (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                {group.title}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-[13px] font-medium transition-colors duration-150",
                        active
                          ? "bg-white/[0.08] text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-[var(--color-green)] before:content-['']"
                          : "text-white/65 hover:bg-white/[0.05] hover:text-white",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-[var(--color-green)]" : "text-white/50",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
