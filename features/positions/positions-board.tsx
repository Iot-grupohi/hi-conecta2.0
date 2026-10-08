"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TagBadge } from "@/components/hr/tag-badge";
import { FormDialog, FormDialogFooter } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";
import { resolvePositionFamilyTag, resolvePositionTag } from "@/lib/tags";
import {
  createPositionAction,
  deletePositionAction,
  updatePositionAction,
  type PositionActionState,
} from "@/features/positions/actions";
import { Field, fieldClass } from "@/features/hr/form-fields";
import type { Department, Employee, Position } from "@/types/hr";

export function PositionsBoard({
  positions,
  employees,
  departments = [],
  canWrite = false,
}: {
  positions: Position[];
  employees: Employee[];
  departments?: Department[];
  canWrite?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [familyFilter, setFamilyFilter] = useState("todos");
  const [sortValue, setSortValue] = useState("count:desc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const [state, action, pending] = useActionState<PositionActionState, FormData>(
    async (prev, formData) =>
      formData.get("id")
        ? updatePositionAction(prev, formData)
        : createPositionAction(prev, formData),
    {},
  );

  useCloseOnSuccess(pending, state.success, () => {
    setFormOpen(false);
    setEditing(null);
  });

  const rows = useMemo(() => {
    const active = employees.filter((employee) => employee.status !== "desligado");
    return positions.map((position) => {
      const linked = active.filter((employee) => employee.positionId === position.id);
      const byName = active.filter(
        (employee) =>
          !employee.positionId &&
          (employee.positionName ?? "").toLowerCase() === position.name.toLowerCase(),
      );
      const count = linked.length + byName.length;
      const tag = resolvePositionTag(position.name);
      const family = resolvePositionFamilyTag(position.name);
      return { ...position, count, tag, family };
    });
  }, [positions, employees]);

  const families = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => map.set(row.family.key, row.family.label));
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows.filter((row) => {
      if (familyFilter !== "todos" && row.family.key !== familyFilter) return false;
      if (!q) return true;
      return row.name.toLowerCase().includes(q) || row.tag.label.toLowerCase().includes(q);
    });

    const [sortBy, sortDir] = sortValue.split(":") as ["name" | "count", "asc" | "desc"];
    const dir = sortDir === "desc" ? -1 : 1;
    list = [...list].sort((a, b) => {
      if (sortBy === "count") return (a.count - b.count) * dir;
      return a.tag.label.localeCompare(b.tag.label, "pt-BR") * dir;
    });
    return list;
  }, [rows, query, familyFilter, sortValue]);

  return (
    <div>
      <PageHeader
        title="Cargos"
        description="Cargos padronizados com tags por família (analista, coordenação, gerência e outros)."
        actions={
          canWrite ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          ) : null
        }
      />

      <DataToolbar
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="Buscar cargo..."
        filters={[
          {
            id: "family",
            label: "Família",
            value: familyFilter,
            onChange: setFamilyFilter,
            options: [{ value: "todos", label: "Todas as famílias" }, ...families],
          },
        ]}
        sortOptions={[
          { value: "count:desc", label: "Mais colaboradores" },
          { value: "count:asc", label: "Menos colaboradores" },
          { value: "name:asc", label: "Nome (A-Z)" },
        ]}
        sortValue={sortValue}
        onSortChange={setSortValue}
        resultCount={filtered.length}
        totalCount={rows.length}
      />

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum cargo encontrado" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo</TableHead>
                <TableHead>Família</TableHead>
                <TableHead>Colaboradores ativos</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <TagBadge tag={row.tag} />
                  </TableCell>
                  <TableCell>
                    <TagBadge tag={row.family} />
                  </TableCell>
                  <TableCell>{row.count}</TableCell>
                  <TableCell className="w-[7.5rem] whitespace-nowrap pr-2 text-right">
                    <div className="inline-flex flex-nowrap items-center justify-end gap-0.5">
                      {canWrite ? (
                        <>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                            aria-label={`Editar ${row.name}`}
                            title="Editar"
                            onClick={() => {
                              setEditing(row);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-danger)] hover:bg-[var(--color-muted)]"
                            aria-label={`Excluir ${row.name}`}
                            title="Excluir"
                            onClick={() => setDeleteId(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : null}
                      <Link
                        href={`/colaboradores?cargo=${encodeURIComponent(row.id)}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                        aria-label={`Ver colaboradores de ${row.name}`}
                        title="Ver colaboradores"
                      >
                        <Users className="h-4 w-4" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <FormDialog
        open={formOpen}
        title={editing ? "Editar cargo" : "Novo cargo"}
        onClose={() => {
          if (!pending) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
        pending={pending}
        footer={
          <FormDialogFooter
            formId="position-form"
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            pending={pending}
          />
        }
      >
        <form id="position-form" action={action} className="space-y-3">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <Field label="Nome">
            <input name="name" required defaultValue={editing?.name ?? ""} className={fieldClass} />
          </Field>
          <Field label="Departamento (opcional)">
            <select name="departmentId" defaultValue={editing?.departmentId ?? ""} className={fieldClass}>
              <option value="">Sem vínculo</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </Field>
          {state.error ? (
            <p className="text-xs font-semibold text-[var(--color-danger)]">{state.error}</p>
          ) : null}
        </form>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir cargo?"
        description="Só é permitido se não houver colaboradores vinculados."
        confirmLabel="Excluir"
        tone="danger"
        pending={pendingDelete}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          const fd = new FormData();
          fd.set("id", deleteId);
          startDelete(async () => {
            try {
              await deletePositionAction(fd);
              setDeleteId(null);
            } catch (error) {
              alert(error instanceof Error ? error.message : "Falha ao excluir.");
              setDeleteId(null);
            }
          });
        }}
      />
    </div>
  );
}
