"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { Role } from "@prisma/client";
import type { Permission } from "@/lib/permissions";

export type ShellUser = {
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
  employeeId?: string | null;
};

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: ShellUser | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="flex min-h-screen">
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
          <Sidebar role={user?.role} permissions={user?.permissions ?? []} />
        </div>

        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              className="absolute inset-0 bg-black/40"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
              <Sidebar
                onNavigate={() => setOpen(false)}
                role={user?.role}
                permissions={user?.permissions ?? []}
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
          <Topbar onMenuClick={() => setOpen(true)} user={user} />
          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
