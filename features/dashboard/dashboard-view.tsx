"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  CalendarDays,
  FileWarning,
  PartyPopper,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/hr/status-badge";
import { formatDate, getUpcomingVacations } from "@/lib/hr";
import { resolveDepartmentTag, resolvePositionTag } from "@/lib/tags";
import type { DashboardStats, Employee, HrSeedData } from "@/types/hr";
import { TagBadge } from "@/components/hr/tag-badge";

const PIE_COLORS = ["#00D931", "#000070", "#0018c8", "#64748b"];

export function DashboardView({
  stats,
  data,
}: {
  stats: DashboardStats;
  data: HrSeedData;
}) {
  const upcoming = useMemo(() => getUpcomingVacations(data.vacations).slice(0, 6), [data.vacations]);
  const birthdays = useMemo(() => {
    const month = new Date().getMonth();
    return data.employees
      .filter((employee) => {
        if (employee.status !== "ativo" || !employee.birthDate) return false;
        return new Date(`${employee.birthDate}T12:00:00`).getMonth() === month;
      })
      .sort((a, b) => {
        const da = a.birthDate ? new Date(`${a.birthDate}T12:00:00`).getDate() : 0;
        const db = b.birthDate ? new Date(`${b.birthDate}T12:00:00`).getDate() : 0;
        return da - db;
      });
  }, [data.employees]);

  const recentHires = useMemo(() => {
    return [...data.employees]
      .filter((employee) => employee.hireDate)
      .sort((a, b) => (b.hireDate ?? "").localeCompare(a.hireDate ?? ""))
      .slice(0, 5);
  }, [data.employees]);

  return (
    <div>
      <PageHeader
        title="Dashboard de RH"
        description="Visão geral dos indicadores de pessoas com base nas planilhas Controles RH e ASO."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Colaboradores ativos"
          value={stats.activeEmployees}
          hint={`${stats.onVacation} em férias · ${stats.onLeave} afastados`}
          icon={<Users className="h-4 w-4" />}
          tone="default"
        />
        <StatCard
          label="Admitidos no mês"
          value={stats.hiredThisMonth}
          icon={<UserPlus className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label="Desligados no mês"
          value={stats.terminatedThisMonth}
          icon={<UserMinus className="h-4 w-4" />}
          tone="danger"
        />
        <StatCard
          label="Aniversariantes"
          value={stats.birthdaysThisMonth}
          icon={<PartyPopper className="h-4 w-4" />}
          tone="info"
        />
        <StatCard
          label="Férias próximas"
          value={stats.upcomingVacations}
          hint="Próximos 45 dias"
          icon={<CalendarDays className="h-4 w-4" />}
          tone="warning"
        />
        <StatCard
          label="Docs / ASO pendentes"
          value={stats.pendingDocuments}
          icon={<FileWarning className="h-4 w-4" />}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Evolução de admissões e desligamentos</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.hiringTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Legend />
                <Bar dataKey="hired" name="Admissões" fill="#00D931" radius={[6, 6, 0, 0]} />
                <Bar
                  dataKey="terminated"
                  name="Desligamentos"
                  fill="#dc2626"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por status</CardTitle>
            <CardDescription>Base consolidada de colaboradores</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusDistribution}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {stats.statusDistribution.map((entry, index) => (
                    <Cell key={entry.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Indicadores por setor</CardTitle>
            <CardDescription>Headcount ativo (top 8)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.byDepartment.map((item) => (
              <Link
                key={item.departmentId}
                href={`/colaboradores?setor=${encodeURIComponent(item.departmentId)}`}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] p-1 transition-colors hover:bg-[var(--color-muted)]/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    {item.departmentId === "sem" ? (
                      <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-[rgba(180,83,9,0.16)] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-[var(--color-warning)]">
                        Sem setor definido
                      </span>
                    ) : (
                      <TagBadge tag={resolveDepartmentTag(item.name)} />
                    )}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)]"
                      style={{
                        width: `${Math.max(
                          8,
                          (item.count / (stats.byDepartment[0]?.count || 1)) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="inline-flex min-w-7 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-green)] px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--color-navy)] shadow-[0_0_18px_-6px_rgba(0,217,49,0.7)]">
                  {item.count}
                </span>
              </Link>
            ))}
            <p className="pt-1 text-xs text-[var(--color-muted-foreground)]">
              Clique em um setor para ver os colaboradores.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Férias próximas</CardTitle>
            <CardDescription>Programações nos próximos 45 dias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">Nenhuma férias próxima.</p>
            ) : (
              upcoming.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
                >
                  <p className="text-sm font-medium">{item.employeeName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {item.departmentName ? (
                      <TagBadge tag={resolveDepartmentTag(item.departmentName)} />
                    ) : null}
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {formatDate(item.startDate)} a {formatDate(item.endDate)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aniversariantes do mês</CardTitle>
            <CardDescription>
              {birthdays.length} colaborador{birthdays.length === 1 ? "" : "es"} ativo
              {birthdays.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[28rem] space-y-3 overflow-y-auto">
            {birthdays.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Nenhum colaborador ativo faz aniversário neste mês.
              </p>
            ) : (
              birthdays.map((employee) => (
                <BirthdayRow key={employee.id} employee={employee} />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Últimas admissões</CardTitle>
            <CardDescription>Colaboradores mais recentes na base</CardDescription>
          </div>
          <Link href="/colaboradores" className="text-sm font-medium text-[var(--color-primary)]">
            Ver todos
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentHires.map((employee) => (
            <Link
              key={employee.id}
              href={`/colaboradores/${employee.id}`}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-muted)]/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{employee.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <TagBadge tag={resolvePositionTag(employee.positionName)} />
                  {employee.departmentName ? (
                    <TagBadge tag={resolveDepartmentTag(employee.departmentName)} />
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={employee.status} />
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {formatDate(employee.hireDate)}
                </span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function BirthdayRow({ employee }: { employee: Employee }) {
  const [mounted] = useState(true);
  if (!mounted) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{employee.name}</p>
        {employee.departmentName ? (
          <div className="mt-1">
            <TagBadge tag={resolveDepartmentTag(employee.departmentName)} />
          </div>
        ) : null}
      </div>
      <Badge tone="info">{formatDate(employee.birthDate, "dd/MM")}</Badge>
    </div>
  );
}
