"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormDialog, FormDialogFooter } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TagBadge } from "@/components/hr/tag-badge";
import { formatCurrency, formatDate } from "@/lib/hr";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";
import {
  createVacationRhAction,
  deleteVacationAction,
  updateVacationRhAction,
  type VacationActionState,
} from "@/features/vacations/actions";
import {
  createLeaveAction,
  deleteLeaveAction,
  updateLeaveAction,
  type LeaveActionState,
} from "@/features/leaves/actions";
import {
  createAsoAction,
  deleteAsoAction,
  updateAsoAction,
  type AsoActionState,
} from "@/features/aso/actions";
import {
  deleteLaundryCreditAction,
  deleteMealPartnerCreditAction,
  deleteTransportCreditAction,
  deleteBenefitCreditAction,
  upsertLaundryCreditAction,
  upsertMealPartnerCreditAction,
  upsertTransportCreditAction,
  upsertBenefitCreditAction,
  type CreditActionState,
} from "@/features/benefits/credit-actions";
import {
  deleteProbationAction,
  upsertProbationAction,
  type HistoryActionState,
} from "@/features/employees/history-actions";
import { Field, fieldClass } from "@/features/hr/form-fields";
import { resolveVacationStatusTag } from "@/lib/tags";
import type { Employee } from "@/types/hr";

type History = Awaited<ReturnType<typeof import("@/lib/data").getEmployeeHistory>>;

type FormKind =
  | "vacation"
  | "leave"
  | "aso"
  | "laundry"
  | "transport"
  | "benefit"
  | "meal"
  | "probation"
  | null;

export function EmployeeHistoryCrud({
  employee,
  history,
  canWrite,
}: {
  employee: Employee;
  history: History;
  canWrite: boolean;
}) {
  const [kind, setKind] = useState<FormKind>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: Exclude<FormKind, null>;
  } | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  function openCreate(next: Exclude<FormKind, null>) {
    setEditId(null);
    setKind(next);
  }

  function openEdit(next: Exclude<FormKind, null>, id: string) {
    setEditId(id);
    setKind(next);
  }

  return (
    <>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <HistoryBlock
          title="Férias"
          empty="Nenhum registro de férias."
          canWrite={canWrite}
          onAdd={() => openCreate("vacation")}
          items={history.vacations.map((item) => ({
            id: item.id,
            title: `${formatDate(item.startDate)} — ${formatDate(item.endDate)}`,
            subtitle: `${item.days ?? "—"} dias`,
            tag: resolveVacationStatusTag(item.status),
            onEdit: () => openEdit("vacation", item.id),
            onDelete: () => setDeleteTarget({ id: item.id, type: "vacation" }),
          }))}
        />
        <HistoryBlock
          title="Afastamentos"
          empty="Nenhum afastamento registrado."
          canWrite={canWrite}
          onAdd={() => openCreate("leave")}
          items={history.leaves.map((item) => ({
            id: item.id,
            title: `${formatDate(item.startDate)} — ${formatDate(item.endDate)}`,
            subtitle: `${item.days ?? "—"} dias · CID ${item.cid ?? "—"}`,
            onEdit: () => openEdit("leave", item.id),
            onDelete: () => setDeleteTarget({ id: item.id, type: "leave" }),
          }))}
        />
        <HistoryBlock
          title="Crédito refeição (parceiro)"
          empty="Sem crédito em restaurante parceiro."
          canWrite={canWrite}
          onAdd={() => openCreate("meal")}
          items={(history.mealPartnerCredits ?? []).map((item) => ({
            id: item.id,
            title: `${item.partnerName} · ${item.monthLabel}/${item.year}`,
            subtitle: `${item.orderDates || "Sem datas"} · ${item.quantity} refeição(ões) · ${formatCurrency(item.consumptionValue)}`,
            onEdit: () => openEdit("meal", item.id),
            onDelete: () => setDeleteTarget({ id: item.id, type: "meal" }),
          }))}
        />
        <HistoryBlock
          title="Crédito lavanderia"
          empty="Sem crédito de lavanderia."
          canWrite={canWrite}
          onAdd={() => openCreate("laundry")}
          items={(history.laundryCredits ?? []).map((item) => ({
            id: item.id,
            title: `${item.monthLabel}/${item.year}`,
            subtitle: `${item.isProportional ? "Proporcional" : "Integral"} · ${formatCurrency(item.amount)}`,
            onEdit: () => openEdit("laundry", item.id),
            onDelete: () => setDeleteTarget({ id: item.id, type: "laundry" }),
          }))}
        />
        <HistoryBlock
          title="Benefícios CAJU"
          empty="Sem lançamentos de benefícios CAJU."
          canWrite={canWrite}
          onAdd={() => openCreate("benefit")}
          items={(history.benefitCredits ?? []).map((item) => ({
            id: item.id,
            title: `${item.monthLabel}/${item.year}${item.isProportional ? " · proporcional" : ""}`,
            subtitle: `Alimentação ${item.mealAmount != null ? formatCurrency(item.mealAmount) : "—"} · Mobilidade ${
              item.mobilityAmount != null
                ? formatCurrency(item.mobilityAmount)
                : item.mobilityNote || "—"
            }`,
            onEdit: () => openEdit("benefit", item.id),
            onDelete: () => setDeleteTarget({ id: item.id, type: "benefit" }),
          }))}
        />
        <HistoryBlock
          title="Vale transporte"
          empty="Sem crédito de vale transporte."
          canWrite={canWrite}
          onAdd={() => openCreate("transport")}
          items={(history.transportCredits ?? []).map((item) => ({
            id: item.id,
            title: `${item.monthLabel}/${item.year}${item.isProportional ? " · proporcional" : ""}`,
            subtitle: `${item.days != null ? `${item.days} dia(s)` : "—"} · ${formatCurrency(item.totalAmount)}`,
            onEdit: () => openEdit("transport", item.id),
            onDelete: () => setDeleteTarget({ id: item.id, type: "transport" }),
          }))}
        />
        <HistoryBlock
          title="Experiência / contrato"
          empty="Sem períodos de experiência."
          canWrite={canWrite}
          onAdd={() => openCreate("probation")}
          items={history.probation.map((item) => ({
            id: item.id,
            title: `Admissão ${formatDate(item.hireDate)}`,
            subtitle: `1º ${formatDate(item.firstPeriodEnd)} · 2º ${formatDate(item.secondPeriodEnd)}`,
            onEdit: () => openEdit("probation", item.id),
            onDelete: () => setDeleteTarget({ id: item.id, type: "probation" }),
          }))}
        />
        <HistoryBlock
          title="Documentos / ASO"
          empty="Nenhum exame ocupacional vinculado."
          canWrite={canWrite}
          onAdd={() => openCreate("aso")}
          items={history.aso.map((item) => ({
            id: item.id,
            title: `Admissional ${formatDate(item.admissionExamDate === "pendente" ? null : item.admissionExamDate)}`,
            subtitle: `Validade ${formatDate(item.admissionExamValidUntil === "pendente" ? null : item.admissionExamValidUntil)} · Periódico 1: ${item.periodic1Date ?? "—"}`,
            onEdit: () => openEdit("aso", item.id),
            onDelete: () => setDeleteTarget({ id: item.id, type: "aso" }),
          }))}
        />
      </div>

      {kind ? (
        <HistoryFormDialog
          kind={kind}
          editId={editId}
          employee={employee}
          history={history}
          onClose={() => setKind(null)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Excluir registro?"
        confirmLabel="Excluir"
        tone="danger"
        pending={pendingDelete}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const fd = new FormData();
          fd.set("id", deleteTarget.id);
          startDelete(async () => {
            const map = {
              vacation: deleteVacationAction,
              leave: deleteLeaveAction,
              aso: deleteAsoAction,
              laundry: deleteLaundryCreditAction,
              transport: deleteTransportCreditAction,
              benefit: deleteBenefitCreditAction,
              meal: deleteMealPartnerCreditAction,
              probation: deleteProbationAction,
            } as const;
            await map[deleteTarget.type](fd);
            setDeleteTarget(null);
          });
        }}
      />
    </>
  );
}

function HistoryBlock({
  title,
  empty,
  items,
  canWrite,
  onAdd,
}: {
  title: string;
  empty: string;
  canWrite: boolean;
  onAdd: () => void;
  items: {
    id: string;
    title: string;
    subtitle: string;
    tag?: ReturnType<typeof resolveVacationStatusTag>;
    onEdit: () => void;
    onDelete: () => void;
  }[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>{title}</CardTitle>
        {canWrite ? (
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{empty}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    {item.tag ? <TagBadge tag={item.tag} /> : null}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    {item.subtitle}
                  </p>
                </div>
                {canWrite ? (
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={item.onEdit}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--color-danger)]"
                      onClick={item.onDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function HistoryFormDialog({
  kind,
  editId,
  employee,
  history,
  onClose,
}: {
  kind: Exclude<FormKind, null>;
  editId: string | null;
  employee: Employee;
  history: History;
  onClose: () => void;
}) {
  const titles: Record<Exclude<FormKind, null>, string> = {
    vacation: "Férias",
    leave: "Afastamento",
    aso: "ASO",
    laundry: "Lavanderia",
    transport: "Vale transporte",
    benefit: "CAJU",
    meal: "Refeição parceiro",
    probation: "Experiência",
  };

  const actionMap = {
    vacation: async (prev: VacationActionState, fd: FormData) =>
      fd.get("id") ? updateVacationRhAction(prev, fd) : createVacationRhAction(prev, fd),
    leave: async (prev: LeaveActionState, fd: FormData) =>
      fd.get("id") ? updateLeaveAction(prev, fd) : createLeaveAction(prev, fd),
    aso: async (prev: AsoActionState, fd: FormData) =>
      fd.get("id") ? updateAsoAction(prev, fd) : createAsoAction(prev, fd),
    laundry: upsertLaundryCreditAction,
    transport: upsertTransportCreditAction,
    benefit: upsertBenefitCreditAction,
    meal: upsertMealPartnerCreditAction,
    probation: upsertProbationAction,
  } as const;

  const [state, action, pending] = useActionState<
    VacationActionState | LeaveActionState | AsoActionState | CreditActionState | HistoryActionState,
    FormData
  >(actionMap[kind] as never, {});

  useCloseOnSuccess(pending, state.success, onClose);

  const vacation = history.vacations.find((item) => item.id === editId);
  const leave = history.leaves.find((item) => item.id === editId);
  const aso = history.aso.find((item) => item.id === editId);
  const laundry = (history.laundryCredits ?? []).find((item) => item.id === editId);
  const transport = (history.transportCredits ?? []).find((item) => item.id === editId);
  const benefit = (history.benefitCredits ?? []).find((item) => item.id === editId);
  const meal = (history.mealPartnerCredits ?? []).find((item) => item.id === editId);
  const probation = history.probation.find((item) => item.id === editId);

  return (
    <FormDialog
      open
      title={`${editId ? "Editar" : "Adicionar"} · ${titles[kind]}`}
      onClose={() => !pending && onClose()}
      pending={pending}
      footer={
        <FormDialogFooter formId="ficha-history-form" onCancel={onClose} pending={pending} />
      }
    >
      <form id="ficha-history-form" action={action} className="space-y-3">
        {editId ? <input type="hidden" name="id" value={editId} /> : null}
        <input type="hidden" name="employeeId" value={employee.id} />
        <input type="hidden" name="employeeName" value={employee.name} />

        {kind === "vacation" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Início">
                <input
                  type="date"
                  name="startDate"
                  required
                  defaultValue={vacation?.startDate?.slice(0, 10) ?? ""}
                  className={fieldClass}
                />
              </Field>
              <Field label="Término">
                <input
                  type="date"
                  name="endDate"
                  required
                  defaultValue={vacation?.endDate?.slice(0, 10) ?? ""}
                  className={fieldClass}
                />
              </Field>
            </div>
            <Field label="Status">
              <select name="status" defaultValue={vacation?.status ?? "programada"} className={fieldClass}>
                <option value="programada">Programada</option>
                <option value="pendente">Pendente</option>
                <option value="concluida">Concluída</option>
                <option value="recusada">Recusada</option>
              </select>
            </Field>
          </>
        ) : null}

        {kind === "leave" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Início">
                <input
                  type="date"
                  name="startDate"
                  defaultValue={leave?.startDate?.slice(0, 10) ?? ""}
                  className={fieldClass}
                />
              </Field>
              <Field label="Término">
                <input
                  type="date"
                  name="endDate"
                  defaultValue={leave?.endDate?.slice(0, 10) ?? ""}
                  className={fieldClass}
                />
              </Field>
            </div>
            <Field label="Dias">
              <input name="days" defaultValue={leave?.days ?? ""} className={fieldClass} />
            </Field>
            <Field label="CID">
              <input name="cid" defaultValue={leave?.cid ?? ""} className={fieldClass} />
            </Field>
          </>
        ) : null}

        {kind === "aso" ? (
          <>
            <Field label="Admissional">
              <input
                name="admissionExamDate"
                defaultValue={aso?.admissionExamDate ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="Validade">
              <input
                name="admissionExamValidUntil"
                defaultValue={aso?.admissionExamValidUntil ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="1º periódico">
              <input name="periodic1Date" defaultValue={aso?.periodic1Date ?? ""} className={fieldClass} />
            </Field>
          </>
        ) : null}

        {kind === "laundry" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Mês">
                <input
                  name="monthNumber"
                  required
                  defaultValue={laundry?.monthNumber ?? new Date().getMonth() + 1}
                  className={fieldClass}
                />
              </Field>
              <Field label="Ano">
                <input
                  name="year"
                  required
                  defaultValue={laundry?.year ?? new Date().getFullYear()}
                  className={fieldClass}
                />
              </Field>
            </div>
            <Field label="Valor">
              <input name="amount" required defaultValue={laundry?.amount ?? 120} className={fieldClass} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isProportional" defaultChecked={laundry?.isProportional} />
              Proporcional
            </label>
          </>
        ) : null}

        {kind === "transport" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Mês">
                <input
                  name="monthNumber"
                  required
                  defaultValue={transport?.monthNumber ?? new Date().getMonth() + 1}
                  className={fieldClass}
                />
              </Field>
              <Field label="Ano">
                <input
                  name="year"
                  required
                  defaultValue={transport?.year ?? new Date().getFullYear()}
                  className={fieldClass}
                />
              </Field>
            </div>
            <Field label="Total">
              <input
                name="totalAmount"
                required
                defaultValue={transport?.totalAmount ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="Dias">
              <input name="days" defaultValue={transport?.days ?? ""} className={fieldClass} />
            </Field>
          </>
        ) : null}

        {kind === "benefit" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Mês">
                <input
                  name="monthNumber"
                  required
                  defaultValue={benefit?.monthNumber ?? new Date().getMonth() + 1}
                  className={fieldClass}
                />
              </Field>
              <Field label="Ano">
                <input
                  name="year"
                  required
                  defaultValue={benefit?.year ?? new Date().getFullYear()}
                  className={fieldClass}
                />
              </Field>
            </div>
            <Field label="Alimentação">
              <input name="mealAmount" defaultValue={benefit?.mealAmount ?? ""} className={fieldClass} />
            </Field>
            <Field label="Mobilidade">
              <input
                name="mobilityAmount"
                defaultValue={benefit?.mobilityAmount ?? ""}
                className={fieldClass}
              />
            </Field>
          </>
        ) : null}

        {kind === "meal" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Mês">
                <input
                  name="monthNumber"
                  required
                  defaultValue={meal?.monthNumber ?? new Date().getMonth() + 1}
                  className={fieldClass}
                />
              </Field>
              <Field label="Ano">
                <input
                  name="year"
                  required
                  defaultValue={meal?.year ?? new Date().getFullYear()}
                  className={fieldClass}
                />
              </Field>
            </div>
            <Field label="Quantidade">
              <input name="quantity" required defaultValue={meal?.quantity ?? ""} className={fieldClass} />
            </Field>
            <Field label="Valor consumo">
              <input
                name="consumptionValue"
                required
                defaultValue={meal?.consumptionValue ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="Datas">
              <input name="orderDates" defaultValue={meal?.orderDates ?? ""} className={fieldClass} />
            </Field>
          </>
        ) : null}

        {kind === "probation" ? (
          <>
            <Field label="Admissão">
              <input
                type="date"
                name="hireDate"
                defaultValue={probation?.hireDate?.slice(0, 10) ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="Fim 1º período">
              <input
                type="date"
                name="firstPeriodEnd"
                defaultValue={probation?.firstPeriodEnd?.slice(0, 10) ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="Fim 2º período">
              <input
                type="date"
                name="secondPeriodEnd"
                defaultValue={probation?.secondPeriodEnd?.slice(0, 10) ?? ""}
                className={fieldClass}
              />
            </Field>
          </>
        ) : null}

        {"error" in state && state.error ? (
          <p className="text-xs font-semibold text-[var(--color-danger)]">{state.error}</p>
        ) : null}
      </form>
    </FormDialog>
  );
}
