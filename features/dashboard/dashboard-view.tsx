"use client";

import { useMemo } from "react";
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
  ArrowRight,
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
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/hr/status-badge";
import { formatDate, getUpcomingVacations } from "@/lib/hr";
import { resolveDepartmentTag, resolvePositionTag } from "@/lib/tags";
import { cn } from "@/lib/utils";
import type { DashboardStats, EmployeeStatus, HrSeedData } from "@/types/hr";
import { TagBadge } from "@/components/hr/tag-badge";

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  ativo: "var(--color-success)",
  ferias: "var(--color-info)",
  afastado: "var(--color-warning)",
  desligado: "var(--color-danger)",
};

type ChartTooltipItem = {
  name?: string | number;
  value?: string | number;
  color?: string;
  payload?: { fill?: string };
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartTooltipItem[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-[var(--shadow-md)]">
      {label != null && label !== "" ? (
        <p className="mb-1.5 font-semibold text-[var(--color-heading)]">{label}</p>
      ) : null}
      <ul className="space-y-1">
        {payload.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: item.payload?.fill ?? item.color }}
              aria-hidden
            />
            <span className="flex-1 text-[var(--color-muted-foreground)]">{item.name}</span>
            <span className="font-semibold tabular-nums text-[var(--color-heading)]">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatShare(count: number, total: number) {
  if (!total) return "0%";
  const share = (count / total) * 100;
  return `${share > 0 && share < 1 ? "<1" : Math.round(share)}%`;
}

const axisTick = { fill: "var(--color-muted-foreground)", fontSize: 12 };

export function DashboardView({
  stats,
  data,
}: {
  stats: DashboardStats;
  data: HrSeedData;
}) {
  const upcoming = useMemo(() => getUpcomingVacations(data.vacations).slice(0, 6), [data.vacations]);
  const statusSlices = stats.statusDistribution.filter((entry) => entry.count > 0);
  const statusTotal = stats.statusDistribution.reduce((sum, entry) => sum + entry.count, 0);
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

  const maxDepartmentCount = stats.byDepartment[0]?.count || 1;

  return (
    <div>
      <PageHeader
        title="Dashboard de RH"
        description="Visão geral dos indicadores de pessoas com base nas planilhas Controles RH e ASO."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6">
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
              <BarChart data={stats.hiringTrend} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="hired" name="Admissões" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar
                  dataKey="terminated"
                  name="Desligamentos"
                  fill="var(--color-danger)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
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
          <CardContent>
            <div className="relative h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusSlices}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={62}
                    outerRadius={88}
                    minAngle={8}
                    stroke="var(--color-card)"
                    strokeWidth={2}
                  >
                    {statusSlices.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? "var(--color-muted-foreground)"}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums text-[var(--color-heading)]">
                  {statusTotal}
                </span>
                <span className="text-xs text-[var(--color-muted-foreground)]">colaboradores</span>
              </div>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {stats.statusDistribution.map((entry) => (
                <li key={entry.status} className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: STATUS_COLORS[entry.status] }}
                    aria-hidden
                  />
                  <span className="truncate text-[var(--color-muted-foreground)]">{entry.label}</span>
                  <span className="ml-auto font-semibold tabular-nums text-[var(--color-heading)]">
                    {entry.count}
                    <span className="ml-1 font-normal text-[var(--color-muted-foreground)]">
                      {formatShare(entry.count, statusTotal)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Indicadores por setor</CardTitle>
            <CardDescription>Headcount ativo (top 8) · clique para ver a equipe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 px-3">
            {stats.byDepartment.map((item) => (
              <Link
                key={item.departmentId}
                href={`/colaboradores?setor=${encodeURIComponent(item.departmentId)}`}
                className="block rounded-[var(--radius-md)] px-2 py-2 transition-colors hover:bg-[var(--color-muted)]"
              >
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  {item.departmentId === "sem" ? (
                    <Badge tone="warning">Sem setor definido</Badge>
                  ) : (
                    <TagBadge tag={resolveDepartmentTag(item.name)} />
                  )}
                  <span className="text-sm font-semibold tabular-nums text-[var(--color-heading)]">
                    {item.count}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-[var(--color-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${Math.max(4, (item.count / maxDepartmentCount) * 100)}%` }}
                  />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Férias próximas</CardTitle>
            <CardDescription>Programações nos próximos 45 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyListText>Nenhuma férias próxima.</EmptyListText>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {upcoming.map((item) => (
                  <PersonRow
                    key={item.id}
                    name={item.employeeName}
                    meta={
                      item.departmentName ? (
                        <TagBadge tag={resolveDepartmentTag(item.departmentName)} />
                      ) : null
                    }
                    aside={
                      <span className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
                        {formatDate(item.startDate, "dd/MM")} – {formatDate(item.endDate, "dd/MM")}
                      </span>
                    }
                  />
                ))}
              </ul>
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
          <CardContent className="max-h-[28rem] overflow-y-auto">
            {birthdays.length === 0 ? (
              <EmptyListText>Nenhum colaborador ativo faz aniversário neste mês.</EmptyListText>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {birthdays.map((employee) => (
                  <PersonRow
                    key={employee.id}
                    name={employee.name}
                    meta={
                      employee.departmentName ? (
                        <TagBadge tag={resolveDepartmentTag(employee.departmentName)} />
                      ) : null
                    }
                    aside={<Badge tone="info">{formatDate(employee.birthDate, "dd/MM")}</Badge>}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Últimas admissões</CardTitle>
            <CardDescription>Colaboradores mais recentes na base</CardDescription>
          </div>
          <Link
            href="/colaboradores"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-green-text)] hover:underline"
          >
            Ver todos
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="px-3">
          <ul className="divide-y divide-[var(--color-border)]">
            {recentHires.map((employee) => (
              <PersonRow
                key={employee.id}
                href={`/colaboradores/${employee.id}`}
                name={employee.name}
                meta={
                  <>
                    <TagBadge tag={resolvePositionTag(employee.positionName)} />
                    {employee.departmentName ? (
                      <TagBadge tag={resolveDepartmentTag(employee.departmentName)} />
                    ) : null}
                  </>
                }
                aside={
                  <>
                    <StatusBadge status={employee.status} />
                    <span className="hidden text-xs tabular-nums text-[var(--color-muted-foreground)] sm:inline">
                      {formatDate(employee.hireDate)}
                    </span>
                  </>
                }
              />
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function PersonRow({
  name,
  meta,
  aside,
  href,
}: {
  name: string;
  meta?: React.ReactNode;
  aside?: React.ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-heading)]">{name}</p>
        {meta ? <div className="mt-1 flex flex-wrap items-center gap-1.5">{meta}</div> : null}
      </div>
      {aside ? <div className="flex shrink-0 items-center gap-2">{aside}</div> : null}
    </>
  );
  const rowClass = "flex items-center gap-3 py-2.5";

  return (
    <li>
      {href ? (
        <Link
          href={href}
          className={cn(rowClass, "rounded-[var(--radius-md)] px-2 transition-colors hover:bg-[var(--color-muted)]")}
        >
          {content}
        </Link>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </li>
  );
}

function EmptyListText({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">{children}</p>;
}
