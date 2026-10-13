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
import { CostStat } from "@/components/hr/cost-stat";
import { TagBadge } from "@/components/hr/tag-badge";
import { FormDialog, FormDialogFooter } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency, formatDate } from "@/lib/hr";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";
import { resolveNoticeTag, resolveTerminationTag } from "@/lib/tags";
import {
  createTerminationAction,
  deleteTerminationAction,
  updateTerminationAction,
  type TerminationActionState,
} from "@/features/terminations/actions";
import { EmployeePicker, Field, fieldClass, type EmployeeOption } from "@/features/hr/form-fields";
import type { Termination } from "@/types/hr";

export function TerminationsTable({
  items,
  employees = [],
  canWrite = false,
}: {
  items: Termination[];
  employees?: EmployeeOption[];
  canWrite?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [noticeFilter, setNoticeFilter] = useState("todos");
  const [sortValue, setSortValue] = useState("lastWorkDay:desc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Termination | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const [state, action, pending] = useActionState<TerminationActionState, FormData>(
    async (prev, formData) =>
      formData.get("id")
        ? updateTerminationAction(prev, formData)
        : createTerminationAction(prev, formData),
    {},
  );

  useCloseOnSuccess(pending, state.success, () => {
    setFormOpen(false);
    setEditing(null);
  });

  const enriched = useMemo(
    () =>
      items.map((item) => {
        const typeTag = resolveTerminationTag(item.terminationType, item.terminationTypeLabel);
        const noticeTag = resolveNoticeTag(item.noticeType);
        return { ...item, typeTag, noticeTag };
      }),
    [items],
  );

  const typeOptions = useMemo(() => {
    const map = new Map<string, string>();
    enriched.forEach((item) => map.set(item.typeTag.key, item.typeTag.label));
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = enriched.filter((item) => {
      if (typeFilter !== "todos" && item.typeTag.key !== typeFilter) return false;
      if (noticeFilter !== "todos" && item.noticeTag.key !== noticeFilter) return false;
      if (!q) return true;
      return [item.employeeName, item.typeTag.label, item.noticeTag.label]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    const [sortBy, sortDir] = sortValue.split(":") as [
      "name" | "lastWorkDay" | "value" | "total",
      "asc" | "desc",
    ];
    const dir = sortDir === "desc" ? -1 : 1;
    rows = [...rows].sort((a, b) => {
      if (sortBy === "value") return ((a.value ?? 0) - (b.value ?? 0)) * dir;
      if (sortBy === "total") {
        return (terminationTotal(a) - terminationTotal(b)) * dir;
      }
      if (sortBy === "lastWorkDay") {
        return ((a.lastWorkDay ?? "").localeCompare(b.lastWorkDay ?? "") || 0) * dir;
      }
      return a.employeeName.localeCompare(b.employeeName, "pt-BR") * dir;
    });
    return rows;
  }, [enriched, query, typeFilter, noticeFilter, sortValue]);

  const costs = useMemo(() => {
    const rescission = filtered.reduce((sum, item) => sum + (item.value ?? 0), 0);
    const grrf = filtered.reduce((sum, item) => sum + (item.grrfValue ?? 0), 0);
    return {
      rescission,
      grrf,
      total: rescission + grrf,
      count: filtered.length,
    };
  }, [filtered]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Custo demissional = valor da rescisão + GRRF
        </p>
        {canWrite ? (
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
        ) : null}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <CostStat label="Desligamentos" value={String(costs.count)} hint="Na lista filtrada" />
        <CostStat
          label="Total rescisões"
          value={formatCurrency(costs.rescission)}
          hint="Soma do valor de rescisão"
        />
        <CostStat
          label="Total GRRF"
          value={formatCurrency(costs.grrf)}
          hint="Guia de Recolhimento Rescisório"
        />
        <CostStat
          label="Custo demissional total"
          value={formatCurrency(costs.total)}
          hint="Rescisão + GRRF"
          emphasize
        />
      </div>

      <DataToolbar
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="Buscar colaborador ou tipo..."
        filters={[
          {
            id: "type",
            label: "Tipo",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [{ value: "todos", label: "Todos os tipos" }, ...typeOptions],
          },
          {
            id: "notice",
            label: "Aviso",
            value: noticeFilter,
            onChange: setNoticeFilter,
            options: [
              { value: "todos", label: "Todos os avisos" },
              { value: "indenizado", label: "Aviso indenizado" },
              { value: "trabalhado", label: "Aviso trabalhado" },
              { value: "nao_informado", label: "Sem aviso" },
            ],
          },
        ]}
        sortOptions={[
          { value: "lastWorkDay:desc", label: "Último dia (recente)" },
          { value: "lastWorkDay:asc", label: "Último dia (antigo)" },
          { value: "name:asc", label: "Nome (A-Z)" },
          { value: "name:desc", label: "Nome (Z-A)" },
          { value: "total:desc", label: "Custo total (maior)" },
          { value: "total:asc", label: "Custo total (menor)" },
          { value: "value:desc", label: "Rescisão (maior)" },
          { value: "value:asc", label: "Rescisão (menor)" },
        ]}
        sortValue={sortValue}
        onSortChange={setSortValue}
        resultCount={filtered.length}
        totalCount={items.length}
      />

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum desligamento encontrado" description="Ajuste os filtros ou a busca." />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Aviso</TableHead>
                <TableHead>Último dia</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Rescisão</TableHead>
                <TableHead className="text-right">GRRF</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {canWrite ? <TableHead className="text-right">Ações</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const total = terminationTotal(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.employeeName}</TableCell>
                    <TableCell>
                      <TagBadge tag={item.typeTag} />
                    </TableCell>
                    <TableCell>
                      <TagBadge tag={item.noticeTag} />
                    </TableCell>
                    <TableCell>{formatDate(item.lastWorkDay)}</TableCell>
                    <TableCell>{formatDate(item.paymentDate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.value)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.grrfValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="tabular-nums font-semibold text-[var(--color-heading)]">
                        {formatCurrency(total)}
                      </div>
                      <p className="mt-0.5 text-[10px] text-[var(--color-muted-foreground)]">
                        {formatCurrency(item.value)} + {formatCurrency(item.grrfValue)}
                      </p>
                    </TableCell>
                    {canWrite ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(item);
                              setEmployeeId(item.employeeId ?? "");
                              setEmployeeName(item.employeeName);
                              setFormOpen(true);
                            }}
                          >
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
                );
              })}
              <TableRow className="bg-[var(--color-muted)]/40">
                <TableCell colSpan={5} className="text-sm font-semibold text-[var(--color-heading)]">
                  Totais ({costs.count} desligamento{costs.count === 1 ? "" : "s"})
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums">
                  {formatCurrency(costs.rescission)}
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums">
                  {formatCurrency(costs.grrf)}
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums text-[var(--color-heading)]">
                  {formatCurrency(costs.total)}
                </TableCell>
                {canWrite ? <TableCell /> : null}
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      )}

      <FormDialog
        open={formOpen}
        title={editing ? "Editar desligamento" : "Novo desligamento"}
        onClose={() => !pending && setFormOpen(false)}
        pending={pending}
        footer={
          <FormDialogFooter
            formId="termination-form"
            onCancel={() => setFormOpen(false)}
            pending={pending}
          />
        }
      >
        <form id="termination-form" action={action} className="space-y-3">
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
          <Field label="Tipo">
            <input
              name="terminationType"
              required
              defaultValue={editing?.terminationType ?? ""}
              className={fieldClass}
              placeholder="ex.: sem_justa_causa"
            />
          </Field>
          <Field label="Rótulo do tipo">
            <input
              name="terminationTypeLabel"
              defaultValue={editing?.terminationTypeLabel ?? ""}
              className={fieldClass}
            />
          </Field>
          <Field label="Aviso">
            <select name="noticeType" defaultValue={editing?.noticeType ?? ""} className={fieldClass}>
              <option value="">Não informado</option>
              <option value="indenizado">Indenizado</option>
              <option value="trabalhado">Trabalhado</option>
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Último dia">
              <input
                type="date"
                name="lastWorkDay"
                defaultValue={editing?.lastWorkDay?.slice(0, 10) ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="Pagamento">
              <input
                type="date"
                name="paymentDate"
                defaultValue={editing?.paymentDate?.slice(0, 10) ?? ""}
                className={fieldClass}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Valor da rescisão">
              <input name="value" defaultValue={editing?.value ?? ""} className={fieldClass} />
            </Field>
            <Field label="GRRF">
              <input
                name="grrfValue"
                defaultValue={editing?.grrfValue ?? ""}
                className={fieldClass}
              />
            </Field>
          </div>
          {editing ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Total demissional:{" "}
              <span className="font-semibold text-[var(--color-heading)]">
                {formatCurrency(terminationTotal(editing))}
              </span>{" "}
              (rescisão + GRRF)
            </p>
          ) : null}
          {state.error ? (
            <p className="text-xs font-semibold text-[var(--color-danger)]">{state.error}</p>
          ) : null}
        </form>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir desligamento?"
        confirmLabel="Excluir"
        tone="danger"
        pending={pendingDelete}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          const fd = new FormData();
          fd.set("id", deleteId);
          startDelete(async () => {
            await deleteTerminationAction(fd);
            setDeleteId(null);
          });
        }}
      />
    </div>
  );
}

function terminationTotal(item: Pick<Termination, "value" | "grrfValue">) {
  return (item.value ?? 0) + (item.grrfValue ?? 0);
}
