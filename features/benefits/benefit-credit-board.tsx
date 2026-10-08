"use client";



import { useActionState, useMemo, useState, useTransition } from "react";

import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { FormDialog, FormDialogFooter } from "@/components/ui/form-dialog";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { formatCurrency, formatDate } from "@/lib/hr";

import { useCloseOnSuccess } from "@/lib/use-close-on-success";

import {

  deleteBenefitCreditAction,

  upsertBenefitCreditAction,

  type CreditActionState,

} from "@/features/benefits/credit-actions";

import { EmployeePicker, Field, fieldClass, type EmployeeOption } from "@/features/hr/form-fields";

import type { BenefitCredit } from "@/types/hr";

import { ArrowLeft, ArrowUpRight, Pencil, Plus, Search, Trash2, WalletCards } from "lucide-react";



type PersonGroup = {

  key: string;

  employeeId: string | null;

  employeeName: string;

  items: BenefitCredit[];

  mealTotal: number;

  mobilityTotal: number;

  transportTotal: number;

};



function rowTotal(item: BenefitCredit) {

  return (item.mealAmount ?? 0) + (item.mobilityAmount ?? 0) + (item.transportAmount ?? 0);

}



export function BenefitCreditBoard({

  credits,

  employees = [],

  canWrite = false,

}: {

  credits: BenefitCredit[];

  employees?: EmployeeOption[];

  canWrite?: boolean;

}) {

  const [query, setQuery] = useState("");

  const [monthFilter, setMonthFilter] = useState("todos");

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);

  const [editing, setEditing] = useState<BenefitCredit | null>(null);

  const [employeeId, setEmployeeId] = useState("");

  const [employeeName, setEmployeeName] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [pendingDelete, startDelete] = useTransition();

  const [state, action, pending] = useActionState<CreditActionState, FormData>(

    upsertBenefitCreditAction,

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

    const meal = credits.reduce((sum, item) => sum + (item.mealAmount ?? 0), 0);

    const mobility = credits.reduce((sum, item) => sum + (item.mobilityAmount ?? 0), 0);

    const transport = credits.reduce((sum, item) => sum + (item.transportAmount ?? 0), 0);

    const people = new Set(

      credits.map((item) => item.employeeId ?? item.cpf ?? item.employeeName.toLowerCase()),

    ).size;

    return { meal, mobility, transport, total: meal + mobility + transport, people };

  }, [credits]);



  const people = useMemo(() => {

    const q = query.trim().toLowerCase();

    const map = new Map<string, PersonGroup>();

    for (const item of credits) {

      if (monthFilter !== "todos" && String(item.monthNumber) !== monthFilter) continue;

      if (

        q &&

        ![item.employeeName, item.cpf, item.departmentName, item.monthLabel]

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

        current.mealTotal += item.mealAmount ?? 0;

        current.mobilityTotal += item.mobilityAmount ?? 0;

        current.transportTotal += item.transportAmount ?? 0;

      } else {

        map.set(key, {

          key,

          employeeId: item.employeeId,

          employeeName: item.employeeName,

          items: [item],

          mealTotal: item.mealAmount ?? 0,

          mobilityTotal: item.mobilityAmount ?? 0,

          transportTotal: item.transportAmount ?? 0,

        });

      }

    }

    return Array.from(map.values()).sort((a, b) =>

      a.employeeName.localeCompare(b.employeeName, "pt-BR"),

    );

  }, [credits, query, monthFilter]);



  const selected = people.find((person) => person.key === selectedKey) ?? null;



  function openForm(item?: BenefitCredit, person?: PersonGroup) {

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

              Benefícios · CAJU

            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">

              Controle de benefícios

            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/70">

              Auxílio alimentação, mobilidade e vale transporte por mês — inclusive créditos

              proporcionais.

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

        <Stat label="Alimentação" value={formatCurrency(stats.meal)} />

        <Stat label="Mobilidade" value={formatCurrency(stats.mobility)} />

        <Stat label="Total geral" value={formatCurrency(stats.total)} />

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

                placeholder="Buscar colaborador, CPF ou setor..."

                value={query}

                onChange={(event) => setQuery(event.target.value)}

              />

            </div>

            <select

              value={monthFilter}

              onChange={(event) => setMonthFilter(event.target.value)}

              className="h-10 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold"

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

              title="Nenhum lançamento encontrado"

              description="Ajuste a busca ou importe a planilha de benefícios."

            />

          ) : (

            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">

              {people.map((person, index) => {

                const total = person.mealTotal + person.mobilityTotal + person.transportTotal;

                return (

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

                        <WalletCards className="h-4 w-4" />

                      </span>

                      <div className="min-w-0">

                        <p

                          className="truncate text-sm font-extrabold text-[var(--color-heading)]"

                          lang="pt-BR"

                          data-preserve-case="true"

                        >

                          {person.employeeName}

                        </p>

                        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">

                          {person.items.length} mês(es) · Alimentação {formatCurrency(person.mealTotal)}

                        </p>

                      </div>

                    </div>

                    <div className="text-right">

                      <p className="text-sm font-extrabold text-[var(--color-heading)]">

                        {formatCurrency(total)}

                      </p>

                      <p className="mt-1 text-xs font-semibold text-[var(--color-green)]">

                        Ver histórico

                      </p>

                    </div>

                  </button>

                );

              })}

            </div>

          )}

        </>

      )}



      <FormDialog

        open={formOpen}

        title={editing ? "Editar lançamento" : "Novo lançamento CAJU"}

        onClose={() => !pending && setFormOpen(false)}

        pending={pending}

        footer={

          <FormDialogFooter

            formId="benefit-form"

            onCancel={() => setFormOpen(false)}

            pending={pending}

          />

        }

      >

        <form id="benefit-form" action={action} className="space-y-3">

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

          <div className="grid gap-3 sm:grid-cols-3">

            <Field label="Alimentação">

              <input

                name="mealAmount"

                defaultValue={editing?.mealAmount ?? ""}

                className={fieldClass}

              />

            </Field>

            <Field label="Mobilidade">

              <input

                name="mobilityAmount"

                defaultValue={editing?.mobilityAmount ?? ""}

                className={fieldClass}

              />

            </Field>

            <Field label="Vale transporte">

              <input

                name="transportAmount"

                defaultValue={editing?.transportAmount ?? ""}

                className={fieldClass}

              />

            </Field>

          </div>

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

        title="Excluir lançamento?"

        confirmLabel="Excluir"

        tone="danger"

        pending={pendingDelete}

        onCancel={() => setDeleteId(null)}

        onConfirm={() => {

          if (!deleteId) return;

          const fd = new FormData();

          fd.set("id", deleteId);

          startDelete(async () => {

            await deleteBenefitCreditAction(fd);

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

  onEdit: (item: BenefitCredit) => void;

  onDelete: (id: string) => void;

}) {

  const sorted = [...person.items].sort(

    (a, b) => b.year - a.year || b.monthNumber - a.monthNumber,

  );

  const total = person.mealTotal + person.mobilityTotal + person.transportTotal;



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

              <WalletCards className="h-7 w-7" />

            </span>

            <div className="min-w-0">

              <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-green)] uppercase">

                Histórico CAJU

              </p>

              <h2

                className="mt-1 truncate text-xl font-extrabold text-[var(--color-heading)]"

                lang="pt-BR"

                data-preserve-case="true"

              >

                {person.employeeName}

              </h2>

              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">

                Alimentação, mobilidade e vale transporte

              </p>

            </div>

          </div>

          {person.employeeId ? (

            <Link

              href={`/colaboradores/${person.employeeId}?returnTo=${encodeURIComponent("/credito-beneficios")}`}

              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-navy)] px-4 text-xs font-extrabold !text-white hover:!text-white"

            >

              Ficha completa

              <ArrowUpRight className="h-3.5 w-3.5" />

            </Link>

          ) : null}

        </div>



        <div className="grid gap-4 border-t border-[var(--color-border)] bg-[var(--color-muted)]/35 px-5 py-5 sm:grid-cols-3 md:px-7">

          <div>

            <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-muted-foreground)] uppercase">

              Alimentação

            </p>

            <p className="mt-2 text-sm font-extrabold text-[var(--color-heading)]">

              {formatCurrency(person.mealTotal)}

            </p>

          </div>

          <div>

            <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-muted-foreground)] uppercase">

              Mobilidade

            </p>

            <p className="mt-2 text-sm font-extrabold text-[var(--color-heading)]">

              {formatCurrency(person.mobilityTotal)}

            </p>

          </div>

          <div>

            <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-muted-foreground)] uppercase">

              Total

            </p>

            <p className="mt-2 text-sm font-extrabold text-[var(--color-navy)]">

              {formatCurrency(total)}

            </p>

          </div>

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

                  {item.isProportional ? "Proporcional" : "Mensal"}

                </p>

                <h4 className="mt-1 text-base font-extrabold text-[var(--color-heading)]">

                  {item.monthLabel}/{item.year}

                </h4>

                <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">

                  {item.departmentName ?? "Sem setor"}

                  {item.workDays != null

                    ? ` · ${item.workDays} dias úteis`

                    : item.workDaysNote

                      ? ` · ${item.workDaysNote}`

                      : ""}

                  {item.startDate ? ` · início ${formatDate(item.startDate)}` : ""}

                </p>

              </div>

              <div className="flex items-center gap-2">

                <div className="rounded-[var(--radius-pill)] bg-[var(--color-navy)] px-3 py-1.5 text-sm font-extrabold text-white">

                  {formatCurrency(rowTotal(item))}

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



            <div className="mt-5 grid gap-4 sm:grid-cols-3">

              <div>

                <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-muted-foreground)] uppercase">

                  Alimentação

                </p>

                <p className="mt-2 text-sm font-extrabold text-[var(--color-heading)]">

                  {item.mealAmount != null ? formatCurrency(item.mealAmount) : "—"}

                </p>

              </div>

              <div>

                <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-muted-foreground)] uppercase">

                  Mobilidade

                </p>

                <p className="mt-2 text-sm font-extrabold text-[var(--color-heading)]">

                  {item.mobilityAmount != null

                    ? formatCurrency(item.mobilityAmount)

                    : item.mobilityNote || "—"}

                </p>

              </div>

              <div>

                <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-muted-foreground)] uppercase">

                  Vale transporte

                </p>

                <p className="mt-2 text-sm font-extrabold text-[var(--color-heading)]">

                  {item.transportAmount != null ? formatCurrency(item.transportAmount) : "—"}

                </p>

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


