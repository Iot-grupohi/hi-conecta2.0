"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormDialog, FormDialogFooter } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency } from "@/lib/hr";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";
import {
  deleteLaundryCreditAction,
  upsertLaundryCreditAction,
  type CreditActionState,
} from "@/features/benefits/credit-actions";
import { EmployeePicker, Field, fieldClass, type EmployeeOption } from "@/features/hr/form-fields";
import type { LaundryCredit } from "@/types/hr";
import { ArrowLeft, ArrowUpRight, Pencil, Plus, Search, Shirt, Trash2 } from "lucide-react";

type PersonGroup = {
  key: string;
  employeeId: string | null;
  employeeName: string;
  items: LaundryCredit[];
  total: number;
  proportionalCount: number;
};

export function LaundryCreditBoard({
  credits,
  employees = [],
  canWrite = false,
}: {
  credits: LaundryCredit[];
  employees?: EmployeeOption[];
  canWrite?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("todos");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LaundryCredit | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const [state, action, pending] = useActionState<CreditActionState, FormData>(
    upsertLaundryCreditAction,
    {},
  );

  useCloseOnSuccess(pending, state.success, () => {
    setFormOpen(false);
    setEditing(null);
  });

  const months = useMemo(() => {
    const set = new Set(credits.map((item) => `${item.monthNumber}:${item.monthLabel}`));
    return Array.from(set)
      .map((value) => {
        const [num, label] = value.split(":");
        return { monthNumber: Number(num), monthLabel: label };
      })
      .sort((a, b) => a.monthNumber - b.monthNumber);
  }, [credits]);

  const stats = useMemo(() => {
    const total = credits.reduce((sum, item) => sum + item.amount, 0);
    const people = new Set(
      credits.map((item) => item.employeeId ?? item.cpf ?? item.employeeName.toLowerCase()),
    ).size;
    const proportional = credits.filter((item) => item.isProportional).length;
    return { total, people, proportional, credits: credits.length };
  }, [credits]);

  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, PersonGroup>();
    for (const item of credits) {
      if (monthFilter !== "todos" && String(item.monthNumber) !== monthFilter) continue;
      if (
        q &&
        ![item.employeeName, item.cpf, item.monthLabel]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      ) {
        continue;
      }
      const key = item.employeeId ?? item.cpf ?? `name:${item.employeeName.toLowerCase()}`;
      const current = map.get(key);
      if (current) {
        current.items.push(item);
        current.total += item.amount;
        if (item.isProportional) current.proportionalCount += 1;
      } else {
        map.set(key, {
          key,
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          items: [item],
          total: item.amount,
          proportionalCount: item.isProportional ? 1 : 0,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName, "pt-BR"),
    );
  }, [credits, query, monthFilter]);

  const selected = people.find((person) => person.key === selectedKey) ?? null;

  function openForm(item?: LaundryCredit, person?: PersonGroup) {
    setEditing(item ?? null);
    setEmployeeId(item?.employeeId ?? person?.employeeId ?? "");
    setEmployeeName(item?.employeeName ?? person?.employeeName ?? "");
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[var(--radius-lg)] text-white shadow-[var(--shadow-md)]">
        <div className="absolute inset-0" style={{ background: "var(--gradient-mesh)" }} />
        <div className="brand-orb -left-12 top-0 h-36 w-36 bg-[rgba(0,217,49,0.28)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-4 px-6 py-7 md:px-8">
          <div>
            <p className="text-[10px] font-bold tracking-[0.22em] text-[var(--color-green)] uppercase">
              Benefícios · Lavanderia
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
              Crédito lavanderia
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Todos recebem R$ 120,00 por mês. Quem entra no meio do mês recebe valor proporcional.
            </p>
          </div>
          {canWrite ? (
            <Button size="sm" onClick={() => openForm()}>
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          ) : null}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Colaboradores" value={String(stats.people)} />
        <Stat label="Lançamentos" value={String(stats.credits)} />
        <Stat label="Proporcionais" value={String(stats.proportional)} />
        <Stat label="Total creditado" value={formatCurrency(stats.total)} />
      </div>

      {selected ? (
        <PersonHistory
          person={selected}
          canWrite={canWrite}
          onBack={() => setSelectedKey(null)}
          onAdd={() => openForm(undefined, selected)}
          onEdit={(item) => openForm(item)}
          onDelete={setDeleteId}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <Input
                className="pl-9"
                placeholder="Buscar colaborador ou CPF..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
              className="h-10 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold"
              aria-label="Filtrar mês"
            >
              <option value="todos">Todos os meses</option>
              {months.map((month) => (
                <option key={month.monthNumber} value={String(month.monthNumber)}>
                  {month.monthLabel}
                </option>
              ))}
            </select>
          </div>

          {people.length === 0 ? (
            <EmptyState
              title="Nenhum crédito encontrado"
              description="Ajuste a busca ou importe a planilha de lavanderia."
            />
          ) : (
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
              {people.map((person, index) => (
                <button
                  key={person.key}
                  type="button"
                  onClick={() => setSelectedKey(person.key)}
                  className={`flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-[var(--color-muted)]/50 md:px-6 ${
                    index < people.length - 1 ? "border-b border-[var(--color-border)]" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-soft)] text-[var(--color-navy)]">
                      <Shirt className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[var(--color-heading)]">
                        {person.employeeName}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                        {person.items.length} mês(es)
                        {person.proportionalCount > 0
                          ? ` · ${person.proportionalCount} proporcional(is)`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-[var(--color-heading)]">
                      {formatCurrency(person.total)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[var(--color-green)]">
                      Ver histórico
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <FormDialog
        open={formOpen}
        title={editing ? "Editar crédito" : "Novo crédito lavanderia"}
        onClose={() => !pending && setFormOpen(false)}
        pending={pending}
        footer={
          <FormDialogFooter
            formId="laundry-form"
            onCancel={() => setFormOpen(false)}
            pending={pending}
          />
        }
      >
        <form id="laundry-form" action={action} className="space-y-3">
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
            <Field label="Mês">
              <select
                name="monthNumber"
                required
                defaultValue={editing?.monthNumber ?? new Date().getMonth() + 1}
                className={fieldClass}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ano">
              <input
                name="year"
                required
                defaultValue={editing?.year ?? new Date().getFullYear()}
                className={fieldClass}
              />
            </Field>
          </div>
          <Field label="Valor">
            <input
              name="amount"
              required
              defaultValue={editing?.amount ?? 120}
              className={fieldClass}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isProportional"
              defaultChecked={editing?.isProportional ?? false}
            />
            Proporcional
          </label>
          {state.error ? (
            <p className="text-xs font-semibold text-[var(--color-danger)]">{state.error}</p>
          ) : null}
        </form>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir crédito?"
        confirmLabel="Excluir"
        tone="danger"
        pending={pendingDelete}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          const fd = new FormData();
          fd.set("id", deleteId);
          startDelete(async () => {
            await deleteLaundryCreditAction(fd);
            setDeleteId(null);
          });
        }}
      />
    </div>
  );
}

function PersonHistory({
  person,
  canWrite,
  onBack,
  onAdd,
  onEdit,
  onDelete,
}: {
  person: PersonGroup;
  canWrite: boolean;
  onBack: () => void;
  onAdd: () => void;
  onEdit: (item: LaundryCredit) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...person.items].sort(
    (a, b) => b.year - a.year || b.monthNumber - a.monthNumber,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-muted-foreground)] hover:text-[var(--color-heading)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para colaboradores
        </button>
        {canWrite ? (
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Adicionar mês
          </Button>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-5 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-7">
          <div className="flex items-center gap-4">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[var(--color-navy)]"
              style={{ background: "linear-gradient(145deg, #e8fff0 0%, #dce4ff 100%)" }}
            >
              <Shirt className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-green)] uppercase">
                Histórico de lavanderia
              </p>
              <h2 className="mt-1 truncate text-xl font-extrabold text-[var(--color-heading)]">
                {person.employeeName}
              </h2>
            </div>
          </div>
          {person.employeeId ? (
            <Link
              href={`/colaboradores/${person.employeeId}?returnTo=${encodeURIComponent("/credito-lavanderia")}`}
              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-navy)] px-4 text-xs font-extrabold !text-white hover:!text-white"
            >
              Ficha completa
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4">
        {sorted.map((item) => (
          <article
            key={item.id}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] md:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-green)] uppercase">
                  {item.isProportional ? "Proporcional" : "Crédito integral"}
                </p>
                <h4 className="mt-1 text-base font-extrabold text-[var(--color-heading)]">
                  {item.monthLabel}/{item.year}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-extrabold ${
                    item.isProportional
                      ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                      : "bg-[var(--color-navy)] text-white"
                  }`}
                >
                  {formatCurrency(item.amount)}
                </div>
                {canWrite ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--color-danger)]"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
      <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-muted-foreground)] uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-[var(--color-heading)]">{value}</p>
    </div>
  );
}
