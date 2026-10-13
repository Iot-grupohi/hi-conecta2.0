"use client";

import { ChevronDown, LogOut, Menu, Moon, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/layout/global-search";
import { logoutAction } from "@/app/login/actions";
import { ROLE_LABELS, hasPermission } from "@/lib/permissions";
import type { ShellUser } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";

export function Topbar({
  onMenuClick,
  user,
}: {
  onMenuClick?: () => void;
  user: ShellUser | null;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("hi-conecta-theme");
    const preferred =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(preferred);
    document.documentElement.setAttribute("data-theme", preferred);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("hi-conecta-theme", next);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          className="w-8 px-0 lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {user && hasPermission(user.role, "employees:read") ? <GlobalSearch /> : null}

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-9 px-0"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
            title={theme === "light" ? "Tema escuro" : "Tema claro"}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {user ? <UserMenu user={user} /> : null}
        </div>
      </div>
    </header>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const profileHref =
    user.role === "COLABORADOR"
      ? "/meu-espaco/dados"
      : user.employeeId
        ? `/colaboradores/${user.employeeId}`
        : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-[var(--radius-pill)] py-1 pl-1 pr-2 transition-colors duration-150 hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      >
        <Avatar name={user.name} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[10rem] truncate text-[13px] font-semibold text-[var(--color-heading)]">
            {user.name}
          </span>
          <span className="block text-[11px] text-[var(--color-muted-foreground)]">
            {ROLE_LABELS[user.role]}
          </span>
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-[var(--color-muted-foreground)] sm:block" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-md)]"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-[var(--color-heading)]">{user.name}</p>
            <p className="truncate text-xs text-[var(--color-muted-foreground)]">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-[var(--color-border)]" />
          {profileHref ? (
            <Link
              href={profileHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            >
              <UserRound className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              Meu perfil
            </Link>
          ) : null}
          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-[var(--color-danger-text)] hover:bg-[var(--color-danger-soft)]"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
