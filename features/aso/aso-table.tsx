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
import { TagBadge } from "@/components/hr/tag-badge";
import { FormDialog, FormDialogFooter } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/hr";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";
import { resolveAsoValueTag, resolveDepartmentTag } from "@/lib/tags";
import {
  createAsoAction,
  deleteAsoAction,
  updateAsoAction,
  type AsoActionState,
} from "@/features/aso/actions";
import { EmployeePicker, Field, fieldClass, type EmployeeOption } from "@/features/hr/form-fields";
import type { AsoExam } from "@/types/hr";

function renderExam(value: string | null) {
  const pendingTag = resolveAsoValueTag(value);
  if (pendingTag && (pendingTag.key === "pendente" || pendingTag.key === "nao_informado")) {
    return <TagBadge tag={pendingTag} />;
  }
  if (!value) return <TagBadge tag={{ key: "nao_informado", label: "NÃO INFORMADO", tone: "neutral" }} />;
  return formatDate(value);
}

export function AsoTable({
  items,
  employees = [],
  canWrite = false,
}: {
  items: AsoExam[];
  employees?: EmployeeOption[];
  canWrite?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [sortValue, setSortValue] = useState("name:asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AsoExam | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const [state, action, pending] = useActionState<AsoActionState, FormData>(
    async (prev, formData) =>
      formData.get("id") ? updateAsoAction(prev, formData) : createAsoAction(prev, formData),
    {},
  );

  useCloseOnSuccess(pending, state.success, () => {
    setFormOpen(false);
    setEditing(null);
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items.filter((item) => {
      const pending =
        !item.admissionExamDate ||
        item.admissionExamDate === "pendente" ||
        item.periodic1Date === "pendente";
      if (statusFilter === "pendente" && !pending) return false;
      if (statusFilter === "ok" && pending) return false;
      if (!q) return true;
      return [item.employeeName, item.departmentName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    const [, sortDir] = sortValue.split(":") as ["name", "asc" | "desc"];
    const dir = sortDir === "desc" ? -1 : 1;
    rows = [...rows].sort(
      (a, b) => a.employeeName.localeCompare(b.employeeName, "pt-BR") * dir,
    );
    return rows;
  }, [items, query, statusFilter, sortValue]);

  return (
    <div>
      {canWrite ? (
        <div className="mb-4 flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setEmployeeId("");
              setEmployeeName("");
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      ) : null}
      <DataToolbar
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="Buscar colaborador ou departamento..."
        filters={[
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "todos", label: "Todos" },
              { value: "pendente", label: "Com pendência" },
              { value: "ok", label: "Sem pendência" },
            ],
          },
        ]}
        sortOptions={[
          { value: "name:asc", label: "Nome (A-Z)" },
          { value: "name:desc", label: "Nome (Z-A)" },
        ]}
        sortValue={sortValue}
        onSortChange={setSortValue}
        resultCount={filtered.length}
        totalCount={items.length}
      />
      {filtered.length === 0 ? (
        <EmptyState title="Nenhum exame encontrado" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>ASO Admissional</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>1º Periódico</TableHead>
                <TableHead>Validade 1º</TableHead>
                {canWrite ? <TableHead className="text-right">Ações</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.employeeName}</TableCell>
                  <TableCell>
                    <TagBadge tag={resolveDepartmentTag(exam.departmentName)} />
                  </TableCell>
                  <TableCell>{renderExam(exam.admissionExamDate)}</TableCell>
                  <TableCell>{renderExam(exam.admissionExamValidUntil)}</TableCell>
                  <TableCell>{renderExam(exam.periodic1Date)}</TableCell>
                  <TableCell>{renderExam(exam.periodic1ValidUntil)}</TableCell>
                  {canWrite ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(exam);
                            setEmployeeId(exam.employeeId ?? "");
                            setEmployeeName(exam.employeeName);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--color-danger)]"
                          onClick={() => setDeleteId(exam.id)}
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
        title={editing ? "Editar ASO" : "Novo ASO"}
        onClose={() => !pending && setFormOpen(false)}
        pending={pending}
        footer={
          <FormDialogFooter formId="aso-form" onCancel={() => setFormOpen(false)} pending={pending} />
        }
      >
        <form id="aso-form" action={action} className="space-y-3">
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
          <Field label="Departamento">
            <input
              name="departmentName"
              defaultValue={editing?.departmentName ?? ""}
              className={fieldClass}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Admissional">
              <input
                name="admissionExamDate"
                defaultValue={editing?.admissionExamDate ?? ""}
                className={fieldClass}
                placeholder="AAAA-MM-DD ou pendente"
              />
            </Field>
            <Field label="Validade admissional">
              <input
                name="admissionExamValidUntil"
                defaultValue={editing?.admissionExamValidUntil ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="1º periódico">
              <input
                name="periodic1Date"
                defaultValue={editing?.periodic1Date ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="Validade 1º">
              <input
                name="periodic1ValidUntil"
                defaultValue={editing?.periodic1ValidUntil ?? ""}
                className={fieldClass}
              />
            </Field>
          </div>
          {state.error ? (
            <p className="text-xs font-semibold text-[var(--color-danger)]">{state.error}</p>
          ) : null}
        </form>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir ASO?"
        confirmLabel="Excluir"
        tone="danger"
        pending={pendingDelete}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          const fd = new FormData();
          fd.set("id", deleteId);
          startDelete(async () => {
            await deleteAsoAction(fd);
            setDeleteId(null);
          });
        }}
      />
    </div>
  );
}
