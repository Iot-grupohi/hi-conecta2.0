"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, Pencil, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
import { buildEmployeesListHref } from "@/lib/utils";
import { DeleteEmployeeButton } from "@/features/employees/delete-employee-button";
import type { Department, Employee, EmployeeStatus, Position } from "@/types/hr";
import type { Permission } from "@/lib/permissions";
import { Card } from "@/components/ui/card";

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
              <Link
                href="/colaboradores/novo"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]"
              >
                <Plus className="h-4 w-4" />
                Novo colaborador
              </Link>
            ) : null}
          </>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <Input
              className="pl-9"
              placeholder="Buscar por nome, CPF, cargo ou setor"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar colaboradores"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as EmployeeStatus | "todos")}
            aria-label="Filtrar por status"
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="ferias">Férias</option>
            <option value="afastado">Afastado</option>
            <option value="desligado">Desligado</option>
          </Select>
          <Select
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            aria-label="Filtrar por departamento"
          >
            <option value="todos">Todos os setores</option>
            <option value="sem">Sem setor definido</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
          <Select
            value={`${sortBy}:${sortDir}`}
            onChange={(event) => {
              const [nextSort, nextDir] = event.target.value.split(":") as [
                typeof sortBy,
                typeof sortDir,
              ];
              setSortBy(nextSort);
              setSortDir(nextDir);
            }}
            aria-label="Ordenar colaboradores"
          >
            <option value="name:asc">Nome (A-Z)</option>
            <option value="name:desc">Nome (Z-A)</option>
            <option value="hireDate:desc">Admissão (mais recente)</option>
            <option value="hireDate:asc">Admissão (mais antiga)</option>
            <option value="department:asc">Setor (A-Z)</option>
            <option value="salary:desc">Salário (maior)</option>
            <option value="salary:asc">Salário (menor)</option>
          </Select>
        </div>
        <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
          Exibindo {filtered.length} de {employees.length} colaboradores
          {positionId !== "todos" && positionName ? (
            <>
              {" "}
              · filtrado por cargo: <strong>{positionName}</strong>
              {" "}
              <button
                type="button"
                className="font-bold text-[var(--color-green)] hover:underline"
                onClick={() => setPositionId("todos")}
              >
                Limpar
              </button>
            </>
          ) : null}
        </p>
      </Card>

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
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[10rem]">Colaborador</TableHead>
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
                    <span className="font-medium">{employee.name}</span>
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
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                        aria-label={`Ver ${employee.name}`}
                        title="Ver"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {canUpdate ? (
                        <Link
                          href={editHref(employee.id)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
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
      )}
    </div>
  );
}
