"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  approveVacationAction,
  createVacationRhAction,
  deleteVacationAction,
  rejectVacationAction,
  updateVacationRhAction,
  type VacationActionState,
} from "@/features/vacations/actions";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormDialog, FormDialogFooter } from "@/components/ui/form-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { TagBadge } from "@/components/hr/tag-badge";
import { formatDate, isVacationInProgress } from "@/lib/hr";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";
import { resolveVacationStatusTag } from "@/lib/tags";
import { EmployeePicker, Field, fieldClass, type EmployeeOption } from "@/features/hr/form-fields";
import type { Vacation } from "@/types/hr";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

type View = "aprovar" | "em_gozo" | "programadas" | "historico";

function isPortalRequest(item: Vacation) {
  return item.id.startsWith("vac_req_") || Boolean(item.notes);
}

function vacationRecency(item: Vacation) {
  return item.createdAt ?? item.startDate ?? item.deadlineDate ?? item.paymentDate ?? "";
}

/** Mais recente primeiro (pedido / data). */
function sortByNewest(a: Vacation, b: Vacation) {
  return vacationRecency(b).localeCompare(vacationRecency(a));
}

function matchesQuery(item: Vacation, q: string) {
  if (!q) return true;
  return [item.employeeName, item.departmentName, item.notes, item.rhNotes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function VacationsBoard({
  items,
  canApprove,
  canWrite = false,
  employees = [],
}: {
  items: Vacation[];
  canApprove: boolean;
  canWrite?: boolean;
  employees?: EmployeeOption[];
}) {
  const pending = useMemo(
    () =>
      items
        .filter((item) => item.status === "pendente" || item.status === "solicitar")
        .sort((a, b) => {
          const aPortal = isPortalRequest(a) ? 1 : 0;
          const bPortal = isPortalRequest(b) ? 1 : 0;
          if (aPortal !== bPortal) return bPortal - aPortal;
          return sortByNewest(a, b);
        }),
    [items],
  );

  const inProgress = useMemo(
    () =>
      items
        .filter((item) => isVacationInProgress(item))
        .sort((a, b) => (a.endDate ?? "").localeCompare(b.endDate ?? "")),
    [items],
  );

  const inProgressIds = useMemo(() => new Set(inProgress.map((item) => item.id)), [inProgress]);

  const programmed = useMemo(
    () =>
      items
        .filter((item) => item.status === "programada" && !inProgressIds.has(item.id))
        .sort(sortByNewest),
    [items, inProgressIds],
  );

  const history = useMemo(
    () =>
      items
        .filter(
          (item) =>
            (item.status === "concluida" || item.status === "recusada") &&
            !inProgressIds.has(item.id),
        )
        .sort(sortByNewest),
    [items, inProgressIds],
  );

  const portalPending = pending.filter(
    (item) => item.status === "pendente" && isPortalRequest(item),
  ).length;

  const defaultView: View =
    inProgress.length > 0
      ? "em_gozo"
      : canApprove && pending.length > 0
        ? "aprovar"
        : programmed.length > 0
          ? "programadas"
          : "historico";

  const [view, setView] = useState<View>(defaultView);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vacation | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const [state, action, pendingForm] = useActionState<VacationActionState, FormData>(
    async (prev, formData) =>
      formData.get("id")
        ? updateVacationRhAction(prev, formData)
        : createVacationRhAction(prev, formData),
    {},
  );

  useCloseOnSuccess(pendingForm, state.success, () => {
    setFormOpen(false);
    setEditing(null);
  });

  const q = query.trim().toLowerCase();
  const currentItems =
    view === "aprovar"
      ? pending
      : view === "em_gozo"
        ? inProgress
        : view === "programadas"
          ? programmed
          : history;
  const filtered = currentItems.filter((item) => matchesQuery(item, q));

  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold text-[var(--color-green-text)]">
              RH · DP
            </p>
            <h1 className="brand-title text-2xl md:text-[1.75rem]">Férias</h1>
            <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
              {inProgress.length > 0
                ? `${inProgress.length} colaborador(es) em gozo de férias agora`
                : portalPending > 0
                  ? `${portalPending} pedido(s) do portal aguardando análise`
                  : pending.length > 0
                    ? `${pending.length} item(ns) para revisar`
                    : "Nada pendente no momento"}
            </p>
          </div>
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
      </section>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <Tab
          active={view === "aprovar"}
          onClick={() => setView("aprovar")}
          label="Para aprovar"
          count={pending.length}
          emphasize={pending.length > 0}
        />
        <Tab
          active={view === "em_gozo"}
          onClick={() => setView("em_gozo")}
          label="Em gozo"
          count={inProgress.length}
          emphasize={inProgress.length > 0}
        />
        <Tab
          active={view === "programadas"}
          onClick={() => setView("programadas")}
          label="Programadas"
          count={programmed.length}
        />
        <Tab
          active={view === "historico"}
          onClick={() => setView("historico")}
          label="Histórico"
          count={history.length}
        />
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <Input
          className="pl-9"
          placeholder="Buscar colaborador..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar férias"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={
            view === "aprovar"
              ? "Nada para aprovar"
              : view === "em_gozo"
                ? "Ninguém em gozo agora"
                : view === "programadas"
                  ? "Nenhuma férias programada"
                  : "Histórico vazio"
          }
          description={
            q
              ? "Nenhum resultado para essa busca."
              : view === "em_gozo"
                ? "Colaboradores com férias em andamento aparecem aqui."
                : "Quando houver registros, eles aparecem aqui."
          }
        />
      ) : view === "aprovar" && canApprove ? (
        <div className="space-y-3">
          {filtered.map((vacation) => (
            <ApprovalCard key={vacation.id} vacation={vacation} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
          {filtered.map((vacation, index) => (
            <ListRow
              key={vacation.id}
              vacation={vacation}
              bordered={index < filtered.length - 1}
              showPortal={view !== "historico" && view !== "em_gozo"}
              inProgress={view === "em_gozo"}
              canWrite={canWrite}
              onEdit={() => {
                setEditing(vacation);
                setEmployeeId(vacation.employeeId ?? "");
                setEmployeeName(vacation.employeeName);
                setFormOpen(true);
              }}
              onDelete={() => setDeleteId(vacation.id)}
            />
          ))}
        </div>
      )}

      <FormDialog
        open={formOpen}
        title={editing ? "Editar férias" : "Registrar férias"}
        onClose={() => !pendingForm && setFormOpen(false)}
        pending={pendingForm}
        footer={
          <FormDialogFooter
            formId="vacation-rh-form"
            onCancel={() => setFormOpen(false)}
            pending={pendingForm}
          />
        }
      >
        <form id="vacation-rh-form" action={action} className="space-y-3">
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
                required
                defaultValue={editing?.startDate?.slice(0, 10) ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="Término">
              <input
                type="date"
                name="endDate"
                required
                defaultValue={editing?.endDate?.slice(0, 10) ?? ""}
                className={fieldClass}
              />
            </Field>
          </div>
          <Field label="Status">
            <select
              name="status"
              defaultValue={editing?.status ?? "programada"}
              className={fieldClass}
            >
              <option value="programada">Programada</option>
              <option value="pendente">Pendente</option>
              <option value="solicitar">Solicitar</option>
              <option value="concluida">Concluída</option>
              <option value="recusada">Recusada</option>
            </select>
          </Field>
          <Field label="Dias (opcional)">
            <input name="days" defaultValue={editing?.days ?? ""} className={fieldClass} />
          </Field>
          <Field label="Obs. colaborador">
            <input name="notes" defaultValue={editing?.notes ?? ""} className={fieldClass} />
          </Field>
          <Field label="Obs. RH">
            <input name="rhNotes" defaultValue={editing?.rhNotes ?? ""} className={fieldClass} />
          </Field>
          {state.error ? (
            <p className="text-xs font-semibold text-[var(--color-danger)]">{state.error}</p>
          ) : null}
        </form>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir férias?"
        confirmLabel="Excluir"
        tone="danger"
        pending={pendingDelete}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          const fd = new FormData();
          fd.set("id", deleteId);
          startDelete(async () => {
            await deleteVacationAction(fd);
            setDeleteId(null);
          });
        }}
      />
    </div>
  );
}

function Tab({
  active,
  onClick,
  label,
  count,
  emphasize,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  emphasize?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--radius-pill)] border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-transparent bg-[var(--color-heading)] text-[var(--color-background)]"
          : emphasize
            ? "border-[rgba(0,217,49,0.45)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-heading)] hover:border-[var(--color-input-border-hover)]"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
          active
            ? "bg-[var(--color-background)]/20 text-[var(--color-background)]"
            : "bg-[var(--color-muted)] text-[var(--color-heading)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function ListRow({
  vacation,
  bordered,
  showPortal,
  inProgress = false,
  canWrite,
  onEdit,
  onDelete,
}: {
  vacation: Vacation;
  bordered: boolean;
  showPortal: boolean;
  inProgress?: boolean;
  canWrite?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 md:px-6 ${
        bordered ? "border-b border-[var(--color-border)]" : ""
      } ${inProgress ? "bg-[var(--color-warning-soft)]/25" : ""}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-[var(--color-heading)]">
            {vacation.employeeName}
          </p>
          {showPortal && isPortalRequest(vacation) ? (
            <span className="rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-primary-text)]">
              Portal
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
          {vacation.departmentName ?? "Sem setor"} · {formatDate(vacation.startDate)} —{" "}
          {formatDate(vacation.endDate)}
          {vacation.days != null ? ` · ${vacation.days} dias` : ""}
          {inProgress ? " · gozando agora" : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <TagBadge
          tag={resolveVacationStatusTag(inProgress ? "em_gozo" : vacation.status)}
        />
        {canWrite ? (
          <>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--color-danger)]"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ApprovalCard({ vacation }: { vacation: Vacation }) {
  const [rhNotes, setRhNotes] = useState("");
  const portal = isPortalRequest(vacation);

  return (
    <div
      className={`rounded-[var(--radius-lg)] border p-4 md:p-5 ${
        portal
          ? "border-[rgba(0,217,49,0.4)] bg-[var(--color-green-soft)]/40"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--color-heading)]">
              {vacation.employeeName}
            </p>
            {portal ? (
              <span className="rounded-[var(--radius-pill)] bg-[var(--color-green)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-navy)]">
                Portal
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {formatDate(vacation.startDate)} — {formatDate(vacation.endDate)}
            {vacation.days != null ? ` · ${vacation.days} dias` : ""}
            {vacation.departmentName ? ` · ${vacation.departmentName}` : ""}
          </p>
          {vacation.notes ? (
            <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">Obs.: {vacation.notes}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={rhNotes}
          onChange={(event) => setRhNotes(event.target.value)}
          placeholder="Comentário (opcional)"
          className="min-w-0 flex-1 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm"
        />
        <div className="flex gap-2">
          <ConfirmForm
            action={approveVacationAction}
            title="Aprovar solicitação?"
            description={`As férias de ${vacation.employeeName} serão programadas para ${formatDate(vacation.startDate)} — ${formatDate(vacation.endDate)}.`}
            confirmLabel="Aprovar"
            cancelLabel="Voltar"
            tone="primary"
            hiddenFields={
              <>
                <input type="hidden" name="id" value={vacation.id} />
                <input type="hidden" name="rhNotes" value={rhNotes} />
              </>
            }
            trigger={({ open }) => (
              <Button type="button" size="sm" onClick={open}>
                Aprovar
              </Button>
            )}
          />
          <ConfirmForm
            action={rejectVacationAction}
            title="Recusar solicitação?"
            description={`A solicitação de férias de ${vacation.employeeName} será marcada como recusada.`}
            confirmLabel="Recusar"
            cancelLabel="Voltar"
            tone="danger"
            hiddenFields={
              <>
                <input type="hidden" name="id" value={vacation.id} />
                <input type="hidden" name="rhNotes" value={rhNotes} />
              </>
            }
            trigger={({ open }) => (
              <Button type="button" size="sm" variant="danger" onClick={open}>
                Recusar
              </Button>
            )}
          />
        </div>
      </div>
    </div>
  );
}
