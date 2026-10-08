"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataToolbar } from "@/components/ui/data-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormDialog, FormDialogFooter } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/hr";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";
import {
  createLeaveAction,
  deleteLeaveAction,
  updateLeaveAction,
  type LeaveActionState,
} from "@/features/leaves/actions";
import { EmployeePicker, Field, fieldClass, type EmployeeOption } from "@/features/hr/form-fields";
import type { Leave } from "@/types/hr";

export function LeavesTable({
  items,
  employees = [],
  canWrite = false,
}: {
  items: Leave[];
  employees?: EmployeeOption[];
  canWrite?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sortValue, setSortValue] = useState("startDate:desc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Leave | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const [state, action, pending] = useActionState<LeaveActionState, FormData>(
    async (prev, formData) =>
      formData.get("id") ? updateLeaveAction(prev, formData) : createLeaveAction(prev, formData),
    {},
  );

  useCloseOnSuccess(pending, state.success, () => {
    setFormOpen(false);
    setEditing(null);
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items.filter((item) => {
      if (!q) return true;
      return [item.employeeName, item.cid].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
    const [sortBy, sortDir] = sortValue.split(":") as ["name" | "startDate" | "days", "asc" | "desc"];
    const dir = sortDir === "desc" ? -1 : 1;
    rows = [...rows].sort((a, b) => {
      if (sortBy === "days") return ((a.days ?? 0) - (b.days ?? 0)) * dir;
      if (sortBy === "startDate") {
        return ((a.startDate ?? "").localeCompare(b.startDate ?? "") || 0) * dir;
      }
      return a.employeeName.localeCompare(b.employeeName, "pt-BR") * dir;
    });
    return rows;
  }, [items, query, sortValue]);

  function openCreate() {
    setEditing(null);
    setEmployeeId("");
    setEmployeeName("");
    setFormOpen(true);
  }

  function openEdit(item: Leave) {
    setEditing(item);
    setEmployeeId(item.employeeId ?? "");
    setEmployeeName(item.employeeName);
    setFormOpen(true);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        {canWrite ? (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        ) : null}
      </div>
      <DataToolbar
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="Buscar colaborador ou CID..."
        sortOptions={[
          { value: "startDate:desc", label: "Início (recente)" },
          { value: "startDate:asc", label: "Início (antigo)" },
          { value: "name:asc", label: "Nome (A-Z)" },
          { value: "days:desc", label: "Dias (maior)" },
        ]}
        sortValue={sortValue}
        onSortChange={setSortValue}
        resultCount={filtered.length}
        totalCount={items.length}
      />
      {filtered.length === 0 ? (
        <EmptyState title="Nenhum afastamento encontrado" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Término</TableHead>
                <TableHead>Dias</TableHead>
                <TableHead>CID</TableHead>
                {canWrite ? <TableHead className="text-right">Ações</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.employeeName}</TableCell>
                  <TableCell>{formatDate(item.startDate)}</TableCell>
                  <TableCell>{formatDate(item.endDate)}</TableCell>
                  <TableCell>{item.days ?? "—"}</TableCell>
                  <TableCell>{item.cid ?? "—"}</TableCell>
                  {canWrite ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--color-danger)]"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <FormDialog
        open={formOpen}
        title={editing ? "Editar afastamento" : "Novo afastamento"}
        onClose={() => !pending && setFormOpen(false)}
        pending={pending}
        footer={
          <FormDialogFooter
            formId="leave-form"
            onCancel={() => setFormOpen(false)}
            pending={pending}
          />
        }
      >
        <form id="leave-form" action={action} className="space-y-3">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <EmployeePicker
            employees={employees}
            employeeId={employeeId}
            employeeName={employeeName}
            onChange={(next) => {
              setEmployeeId(next.employeeId);
              setEmployeeName(next.employeeName);
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Início">
              <input
                type="date"
                name="startDate"
                defaultValue={editing?.startDate?.slice(0, 10) ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="Término">
              <input
                type="date"
                name="endDate"
                defaultValue={editing?.endDate?.slice(0, 10) ?? ""}
                className={fieldClass}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Dias">
              <input
                name="days"
                defaultValue={editing?.days ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="CID">
              <input name="cid" defaultValue={editing?.cid ?? ""} className={fieldClass} />
            </Field>
          </div>
          {state.error ? (
            <p className="text-xs font-semibold text-[var(--color-danger)]">{state.error}</p>
          ) : null}
        </form>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir afastamento?"
        confirmLabel="Excluir"
        tone="danger"
        pending={pendingDelete}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          const fd = new FormData();
          fd.set("id", deleteId);
          startDelete(async () => {
            await deleteLeaveAction(fd);
            setDeleteId(null);
          });
        }}
      />
    </div>
  );
}
