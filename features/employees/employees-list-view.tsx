"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/hr/status-badge";
import { TagBadge } from "@/components/hr/tag-badge";
import { filterEmployees, formatDate, formatSalary } from "@/lib/hr";
import { resolveContractTag, resolveDepartmentTag, resolvePositionTag } from "@/lib/tags";
import { buildEmployeesListHref, cn } from "@/lib/utils";
import { DeleteEmployeeButton } from "@/features/employees/delete-employee-button";
import type { Department, Employee, EmployeeStatus, Position } from "@/types/hr";
import type { Permission } from "@/lib/permissions";
import { Card } from "@/components/ui/card";

const rowActionClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-heading)]";

export function EmployeesListView({
  employees,
  departments,
  positions,
  permissions,
  initialDepartmentId = "todos",
  initialPositionId = "todos",
  initialQuery = "",
  initialStatus = "todos",
}: {
  employees: Employee[];
  departments: Department[];
  positions: Position[];
  permissions: Permission[];
  initialDepartmentId?: string;
  initialPositionId?: string;
  initialQuery?: string;
  initialStatus?: string;
}) {
  const router = useRouter();
  const canCreate = permissions.includes("employees:create");
  const canUpdate = permissions.includes("employees:update");
  const canDelete = permissions.includes("employees:delete");
  const canViewSalary = permissions.includes("salary:read");
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<EmployeeStatus | "todos">(
    (initialStatus as EmployeeStatus | "todos") || "todos",
  );
  const [departmentId, setDepartmentId] = useState<string>(initialDepartmentId);
  const [positionId, setPositionId] = useState<string>(initialPositionId);
  const [sortBy, setSortBy] = useState<"name" | "hireDate" | "department" | "salary">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setDepartmentId(initialDepartmentId);
  }, [initialDepartmentId]);

  useEffect(() => {
    setPositionId(initialPositionId);
  }, [initialPositionId]);

  useEffect(() => {
    setStatus((initialStatus as EmployeeStatus | "todos") || "todos");
  }, [initialStatus]);

  const listHref = useMemo(
    () =>
      buildEmployeesListHref({
        q: query,
        setor: departmentId,
        cargo: positionId,
        status,
      }),
    [query, departmentId, positionId, status],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = `${window.location.pathname}${window.location.search}`;
      if (listHref !== current) {
        router.replace(listHref, { scroll: false });
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [listHref, router]);

  const positionName = useMemo(
    () => positions.find((position) => position.id === positionId)?.name ?? null,
    [positions, positionId],
  );

  const filtered = useMemo(
    () =>
      filterEmployees(employees, {
        query,
        status,
        departmentId,
        positionId,
        positionName,
        sortBy,
        sortDir,
      }),
    [employees, query, status, departmentId, positionId, positionName, sortBy, sortDir],
  );

  function exportCsv() {
    const headers = [
      "Nome",
      "CPF",
      "Status",
      "Cargo",
      "Setor",
      "Admissão",
      "Salário",
      "Contrato",
    ];
    const rows = filtered.map((employee) =>
      [
        employee.name,
        employee.cpf ?? "",
        employee.status,
        employee.positionName ?? "",
        employee.departmentName ?? "",
        employee.hireDate ?? "",
        canViewSalary ? (employee.salary ?? "") : "******",
        employee.contractType ?? "",
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "colaboradores-hi-conecta.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const editHref = (employeeId: string) =>
    `/colaboradores/${employeeId}/editar?returnTo=${encodeURIComponent(listHref)}`;

  return (
    <div>
      <PageHeader
        title="Colaboradores"
        description="Cadastro consolidado com busca, filtros e CRUD protegido por permissões."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            {canCreate ? (
              <Link href="/colaboradores/novo" className={buttonClasses()}>
                <Plus className="h-4 w-4" />
                Novo colaborador
              </Link>
            ) : null}
          </>
        }
      />

      <DataToolbar
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="Buscar por nome, CPF, cargo ou setor"
        filters={[
          {
            id: "status",
            label: "Filtrar por status",
            value: status,
            onChange: (value) => setStatus(value as EmployeeStatus | "todos"),
            options: [
              { value: "todos", label: "Todos os status" },
              { value: "ativo", label: "Ativo" },
              { value: "ferias", label: "Férias" },
              { value: "afastado", label: "Afastado" },
              { value: "desligado", label: "Desligado" },
            ],
          },
          {
            id: "setor",
            label: "Filtrar por departamento",
            value: departmentId,
            onChange: setDepartmentId,
            options: [
              { value: "todos", label: "Todos os setores" },
              { value: "sem", label: "Sem setor definido" },
              ...departments.map((department) => ({ value: department.id, label: department.name })),
            ],
          },
        ]}
        sortOptions={[
          { value: "name:asc", label: "Nome (A-Z)" },
          { value: "name:desc", label: "Nome (Z-A)" },
          { value: "hireDate:desc", label: "Admissão (mais recente)" },
          { value: "hireDate:asc", label: "Admissão (mais antiga)" },
          { value: "department:asc", label: "Setor (A-Z)" },
          ...(canViewSalary
            ? [
                { value: "salary:desc", label: "Salário (maior)" },
                { value: "salary:asc", label: "Salário (menor)" },
              ]
            : []),
        ]}
        sortValue={`${sortBy}:${sortDir}`}
        onSortChange={(value) => {
          const [nextSort, nextDir] = value.split(":") as [typeof sortBy, typeof sortDir];
          setSortBy(nextSort);
          setSortDir(nextDir);
        }}
        resultCount={filtered.length}
        totalCount={employees.length}
        summary={
          <>
            Exibindo {filtered.length} de {employees.length} colaboradores
            {positionId !== "todos" && positionName ? (
              <>
                {" "}
                · filtrado por cargo: <strong>{positionName}</strong>{" "}
                <button
                  type="button"
                  className="font-semibold text-[var(--color-green-text)] hover:underline"
                  onClick={() => setPositionId("todos")}
                >
                  Limpar
                </button>
              </>
            ) : null}
          </>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum colaborador encontrado"
          description="Ajuste os filtros ou limpe a busca para ver a lista completa."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus("todos");
                setDepartmentId("todos");
                setPositionId("todos");
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <>
        <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-sm)] md:hidden">
          {filtered.map((employee) => (
            <li key={employee.id} className="flex items-start gap-3 px-4 py-3">
              <Link
                href={`/colaboradores/${employee.id}?returnTo=${encodeURIComponent(listHref)}`}
                className="flex min-w-0 flex-1 items-start gap-3"
              >
                <Avatar name={employee.name} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium text-[var(--color-heading)]">
                      {employee.name}
                    </p>
                    <StatusBadge status={employee.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[var(--color-muted-foreground)]">
                    {[employee.positionName, employee.departmentName].filter(Boolean).join(" · ") ||
                      "Sem cargo definido"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <TagBadge tag={resolveContractTag(employee.contractType)} />
                    {employee.hireDate ? (
                      <span className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
                        Desde {formatDate(employee.hireDate)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
              {canUpdate ? (
                <Link
                  href={editHref(employee.id)}
                  className={cn(rowActionClass, "-mr-1 h-10 w-10")}
                  aria-label={`Editar ${employee.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
        <Card className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[15rem]">Colaborador</TableHead>
                <TableHead className="whitespace-nowrap">Contrato</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="min-w-[12rem]">Cargo</TableHead>
                <TableHead className="min-w-[11rem]">Setor</TableHead>
                <TableHead className="whitespace-nowrap">Admissão</TableHead>
                <TableHead className="whitespace-nowrap">Salário</TableHead>
                <TableHead className="w-[7.5rem] whitespace-nowrap text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Link
                      href={`/colaboradores/${employee.id}?returnTo=${encodeURIComponent(listHref)}`}
                      className="group flex items-center gap-3"
                    >
                      <Avatar name={employee.name} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-[var(--color-heading)] group-hover:underline">
                          {employee.name}
                        </span>
                        {employee.cpf ? (
                          <span className="block text-xs tabular-nums text-[var(--color-muted-foreground)]">
                            {employee.cpf}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <TagBadge tag={resolveContractTag(employee.contractType)} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge status={employee.status} />
                  </TableCell>
                  <TableCell>
                    <TagBadge tag={resolvePositionTag(employee.positionName)} />
                  </TableCell>
                  <TableCell>
                    {employee.departmentName ? (
                      <TagBadge tag={resolveDepartmentTag(employee.departmentName)} />
                    ) : (
                      <span className="text-xs text-[var(--color-muted-foreground)]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(employee.hireDate)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatSalary(employee.salary, canViewSalary)}
                  </TableCell>
                  <TableCell className="w-[7.5rem] whitespace-nowrap pr-2 text-right">
                    <div className="inline-flex flex-nowrap items-center justify-end gap-0.5">
                      <Link
                        href={`/colaboradores/${employee.id}?returnTo=${encodeURIComponent(listHref)}`}
                        className={rowActionClass}
                        aria-label={`Ver ${employee.name}`}
                        title="Ver"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {canUpdate ? (
                        <Link
                          href={editHref(employee.id)}
                          className={rowActionClass}
                          aria-label={`Editar ${employee.name}`}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      ) : null}
                      {canDelete ? (
                        <DeleteEmployeeButton
                          employeeId={employee.id}
                          employeeName={employee.name}
                          returnTo={listHref}
                          iconOnly
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        </>
      )}
    </div>
  );
}
