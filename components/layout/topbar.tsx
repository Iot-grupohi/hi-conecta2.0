"use client";

import { Menu, Moon, Sun, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/layout/global-search";
import { logoutAction } from "@/app/login/actions";
import { ROLE_LABELS } from "@/lib/permissions";
import type { ShellUser } from "@/components/layout/app-shell";

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
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl">
      <div
        className="h-1 w-full"
        style={{ background: "var(--gradient-brand)" }}
        aria-hidden
      />
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <GlobalSearch />

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleTheme} aria-label="Alternar tema">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span className="hidden sm:inline">{theme === "light" ? "Escuro" : "Claro"}</span>
          </Button>

          {user ? (
            <div className="hidden items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-green-soft)] text-xs font-extrabold text-[var(--color-navy)]">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-[var(--color-heading)]">{user.name}</p>
                <p className="text-[10px] font-semibold text-[var(--color-muted-foreground)]">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
            </div>
          ) : null}

          <form action={logoutAction}>
            <Button variant="ghost" size="sm" type="submit" aria-label="Sair">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
