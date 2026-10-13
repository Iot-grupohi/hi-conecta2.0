"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/hr/status-badge";
import { TagBadge } from "@/components/hr/tag-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { FormDialog, FormDialogFooter } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { resolveDepartmentTag, resolvePositionTag } from "@/lib/tags";
import {
  createDepartmentAction,
  deleteDepartmentAction,
  updateDepartmentAction,
  type DepartmentActionState,
} from "@/features/departments/actions";
import { Field, fieldClass } from "@/features/hr/form-fields";
import type { Department, Employee } from "@/types/hr";

function normalizeName(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HI";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function DepartmentsBoard({
  departments,
  employees,
  canWrite = false,
}: {
  departments: Department[];
  employees: Employee[];
  canWrite?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortValue, setSortValue] = useState("count:desc");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [state, action, pending] = useActionState<DepartmentActionState, FormData>(
    async (prev, formData) => {
      const result = formData.get("id")
        ? await updateDepartmentAction(prev, formData)
        : await createDepartmentAction(prev, formData);
      if (result.success) {
        setFormOpen(false);
        setEditing(null);
        setFormKey((key) => key + 1);
      }
      return result;
    },
    {},
  );
  const [deleteState, deleteAction, pendingDelete] = useActionState<
    DepartmentActionState,
    FormData
  >(async (prev, formData) => {
    const result = await deleteDepartmentAction(prev, formData);
    if (result.success) {
      setDeleteId(null);
      setDeleteError(null);
    } else if (result.error) {
      setDeleteError(result.error);
    }
    return result;
  }, {});

  const employeesByDepartment = useMemo(() => {
    const map = new Map<string, Employee[]>();
    const activeEmployees = employees.filter((employee) => employee.status !== "desligado");

    for (const department of departments) {
      const byId = activeEmployees.filter((employee) => employee.departmentId === department.id);
      const byName = activeEmployees.filter(
        (employee) =>
          !employee.departmentId &&
          normalizeName(employee.departmentName) === normalizeName(department.name),
      );
      const merged = [...byId, ...byName].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      map.set(department.id, merged);
    }

    return map;
  }, [departments, employees]);

  const rows = useMemo(() => {
    return departments.map((department) => {
      const list = employeesByDepartment.get(department.id) ?? [];
      return {
        department,
        employees: list,
        count: list.length,
        tag: resolveDepartmentTag(department.name),
      };
    });
  }, [departments, employeesByDepartment]);

  const visibleRows = useMemo(() => rows.filter((row) => row.count > 0), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = visibleRows.filter((row) => {
      if (!q) return true;
      return (
        row.department.name.toLowerCase().includes(q) ||
        (row.department.managerName ?? "").toLowerCase().includes(q) ||
        (row.department.directorName ?? "").toLowerCase().includes(q) ||
        row.tag.label.toLowerCase().includes(q)
      );
    });

    const [sortBy, sortDir] = sortValue.split(":") as ["name" | "count", "asc" | "desc"];
    const dir = sortDir === "desc" ? -1 : 1;
    list = [...list].sort((a, b) => {
      if (sortBy === "count") return (a.count - b.count) * dir;
      return a.department.name.localeCompare(b.department.name, "pt-BR") * dir;
    });
    return list;
  }, [visibleRows, query, sortValue]);

  const totalHeadcount = useMemo(
    () => visibleRows.reduce((sum, row) => sum + row.count, 0),
    [visibleRows],
  );
  const withManager = useMemo(
    () => rows.filter((row) => Boolean(row.department.managerName)).length,
    [rows],
  );

  function selectDepartment(id: string) {
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    if (next) {
      requestAnimationFrame(() => {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departamentos"
        description="Visão por setor com headcount, liderança e equipe ativa."
        actions={
          canWrite ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormKey((key) => key + 1);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
        <SummaryStat label="Setores" value={visibleRows.length} hint="Com colaboradores ativos" />
        <SummaryStat label="Colaboradores ativos" value={totalHeadcount} hint="Alocados nos setores" />
        <SummaryStat label="Com gestor" value={withManager} hint="Setores com liderança definida" />
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-sm)]">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <Input
              className="pl-9"
              placeholder="Buscar setor, gestor ou diretor..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar departamentos"
            />
          </div>
          <Select
            value={sortValue}
            onChange={(event) => setSortValue(event.target.value)}
            aria-label="Ordenar setores"
          >
            <option value="count:desc">Mais colaboradores</option>
            <option value="count:asc">Menos colaboradores</option>
            <option value="name:asc">Nome (A-Z)</option>
            <option value="name:desc">Nome (Z-A)</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum setor encontrado"
          description="Ajuste a busca para ver os departamentos disponíveis."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => {
            const open = selectedId === row.department.id;
            return (
              <div
                key={row.department.id}
                ref={open ? panelRef : undefined}
                className={cn(
                  "overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-card)] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-200",
                  open
                    ? "border-[rgba(0,217,49,0.45)] sm:col-span-2 xl:col-span-3"
                    : "border-[var(--color-border)] hover:border-[var(--color-input-border-hover)]",
                )}
              >
                <button
                  type="button"
                  onClick={() => selectDepartment(row.department.id)}
                  aria-expanded={open}
                  className="group w-full p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-info-soft)] text-xs font-semibold text-[var(--color-info-text)]">
                      {initials(row.department.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <TagBadge tag={row.tag} />
                        <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-[var(--color-heading)]">
                          <Users className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                          {row.count}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold text-[var(--color-heading)]">
                        {row.department.name}
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "mt-4 grid gap-2 text-xs text-[var(--color-muted-foreground)]",
                      open && "md:grid-cols-2",
                    )}
                  >
                    <p className="flex items-center gap-2">
                      <UserRound className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        <span className="font-medium text-[var(--color-foreground)]">Gestor:</span>{" "}
                        {row.department.managerName ?? "Não informado"}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        <span className="font-medium text-[var(--color-foreground)]">Diretor:</span>{" "}
                        {row.department.directorName ?? "Não informado"}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[var(--color-green-text)]">
                    <span>{open ? "Recolher equipe" : "Ver equipe"}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        open && "rotate-180",
                      )}
                    />
                  </div>
                </button>

                {canWrite ? (
                  <div className="flex gap-2 border-t border-[var(--color-border)] px-4 py-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(row.department);
                        setFormKey((key) => key + 1);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[var(--color-danger)]"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteId(row.department.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </Button>
                  </div>
                ) : null}

                {open ? (
                  <div className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/35 px-4 py-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]">
                      <Users className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                      Equipe ({row.count})
                    </div>

                    {row.count === 0 ? (
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        Nenhum colaborador ativo neste setor.
                      </p>
                    ) : (
                      <div className="grid max-h-[28rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                        {row.employees.map((employee) => (
                          <Link
                            key={employee.id}
                            href={`/colaboradores/${employee.id}`}
                            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 transition-colors duration-150 hover:border-[var(--color-input-border-hover)]"
                          >
                            <Avatar name={employee.name} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[var(--color-heading)]">
                                {employee.name}
                              </p>
                              <div className="mt-1">
                                <TagBadge tag={resolvePositionTag(employee.positionName)} />
                              </div>
                            </div>
                            <StatusBadge status={employee.status} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <FormDialog
        open={formOpen}
        title={editing ? "Editar departamento" : "Novo departamento"}
        onClose={() => {
          if (!pending) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
        pending={pending}
        footer={
          <FormDialogFooter
            formId="department-form"
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            pending={pending}
          />
        }
      >
        <form key={formKey} id="department-form" action={action} className="space-y-3">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <Field label="Nome">
            <input
              name="name"
              required
              defaultValue={editing?.name ?? ""}
              className={fieldClass}
            />
          </Field>
          <Field label="Gestor">
            <input
              name="managerName"
              defaultValue={editing?.managerName ?? ""}
              className={fieldClass}
            />
          </Field>
          <Field label="Diretor">
            <input
              name="directorName"
              defaultValue={editing?.directorName ?? ""}
              className={fieldClass}
            />
          </Field>
          {state.error ? (
            <p className="text-xs font-semibold text-[var(--color-danger)]">{state.error}</p>
          ) : null}
        </form>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir departamento?"
        description={
          deleteError ??
          deleteState.error ??
          "Só é bloqueado se houver colaboradores ativos. Desligados, cargos e férias serão desassociados."
        }
        confirmLabel="Excluir"
        tone="danger"
        pending={pendingDelete}
        onCancel={() => {
          setDeleteId(null);
          setDeleteError(null);
        }}
        onConfirm={() => {
          if (!deleteId || pendingDelete) return;
          const fd = new FormData();
          fd.set("id", deleteId);
          deleteAction(fd);
        }}
      />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)]">
      <p className="text-[13px] font-medium text-[var(--color-muted-foreground)]">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-[var(--color-heading)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hint}</p>
    </div>
  );
}
