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

  deleteMealPartnerCreditAction,

  upsertMealPartnerCreditAction,

  type CreditActionState,

} from "@/features/benefits/credit-actions";

import { EmployeePicker, Field, fieldClass, type EmployeeOption } from "@/features/hr/form-fields";

import type { MealPartnerCredit, MealPartnerDailySummary } from "@/types/hr";

import { ArrowLeft, ArrowUpRight, Pencil, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";



type PersonGroup = {

  key: string;

  employeeId: string | null;

  employeeName: string;

  items: MealPartnerCredit[];

  quantity: number;

  consumption: number;

};



export function MealPartnerBoard({

  credits,

  daily,

  employees = [],

  canWrite = false,

}: {

  credits: MealPartnerCredit[];

  daily: MealPartnerDailySummary[];

  employees?: EmployeeOption[];

  canWrite?: boolean;

}) {

  const [query, setQuery] = useState("");

  const [monthFilter, setMonthFilter] = useState("todos");

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);

  const [editing, setEditing] = useState<MealPartnerCredit | null>(null);

  const [employeeId, setEmployeeId] = useState("");

  const [employeeName, setEmployeeName] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [pendingDelete, startDelete] = useTransition();

  const [state, action, pending] = useActionState<CreditActionState, FormData>(

    upsertMealPartnerCreditAction,

    {},

  );



  useCloseOnSuccess(pending, state.success, () => {

    setFormOpen(false);

    setEditing(null);

  });



  const months = useMemo(() => {

    const set = new Set(credits.map((item) => item.monthLabel));

    return Array.from(set);

  }, [credits]);



  const stats = useMemo(() => {

    const quantity = credits.reduce((sum, item) => sum + item.quantity, 0);

    const consumption = credits.reduce((sum, item) => sum + item.consumptionValue, 0);

    const fees = daily.reduce((sum, item) => sum + (item.deliveryFee ?? 0), 0);

    const people = new Set(

      credits.map((item) => item.employeeId ?? item.employeeName.toLowerCase()),

    ).size;

    return { quantity, consumption, fees, total: consumption + fees, people };

  }, [credits, daily]);



  const people = useMemo(() => {

    const q = query.trim().toLowerCase();

    const map = new Map<string, PersonGroup>();



    for (const item of credits) {

      if (monthFilter !== "todos" && item.monthLabel !== monthFilter) continue;

      if (

        q &&

        ![item.employeeName, item.monthLabel, item.orderDates, item.partnerName]

          .join(" ")

          .toLowerCase()

          .includes(q)

      ) {

        continue;

      }



      const key = item.employeeId ?? `name:${item.employeeName.toLowerCase()}`;

      const current = map.get(key);

      if (current) {

        current.items.push(item);

        current.quantity += item.quantity;

        current.consumption += item.consumptionValue;

      } else {

        map.set(key, {

          key,

          employeeId: item.employeeId,

          employeeName: item.employeeName,

          items: [item],

          quantity: item.quantity,

          consumption: item.consumptionValue,

        });

      }

    }



    return Array.from(map.values()).sort((a, b) =>

      a.employeeName.localeCompare(b.employeeName, "pt-BR"),

    );

  }, [credits, query, monthFilter]);



  const selected = people.find((person) => person.key === selectedKey) ?? null;



  function openForm(item?: MealPartnerCredit, person?: PersonGroup) {

    setEditing(item ?? null);

    setEmployeeId(item?.employeeId ?? person?.employeeId ?? "");

    setEmployeeName(item?.employeeName ?? person?.employeeName ?? "");

    setFormOpen(true);

  }



  return (

    <div className="space-y-6">

      <section>

        <div className="flex flex-wrap items-end justify-between gap-4">

          <div>

            <p className="mb-1 text-xs font-semibold text-[var(--color-green-text)]">

              Benefícios · Alimentação

            </p>

            <h1 className="brand-title text-2xl md:text-[1.75rem]">

              Crédito Paraíba Grill

            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">

              Refeições no restaurante parceiro enquanto o vale alimentação ainda não foi liberado.

              Clique no colaborador para ver o histórico.

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



      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

        <Stat label="Colaboradores" value={String(stats.people)} />

        <Stat label="Pedidos" value={String(stats.quantity)} />

        <Stat label="Consumo" value={formatCurrency(stats.consumption)} />

        <Stat label="Total c/ taxas" value={formatCurrency(stats.total)} />

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

                placeholder="Buscar colaborador..."

                value={query}

                onChange={(event) => setQuery(event.target.value)}

              />

            </div>

            <select

              value={monthFilter}

              onChange={(event) => setMonthFilter(event.target.value)}

              className="select-chevron h-10 w-full cursor-pointer rounded-[var(--radius-pill)] border border-[var(--color-input-border)] bg-[var(--color-surface)] pl-4 pr-10 text-base text-[var(--color-foreground)] hover:border-[var(--color-input-border-hover)] focus-visible:border-[var(--color-ring)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,217,49,0.18)] sm:w-auto sm:text-sm"

              aria-label="Filtrar mês"

            >

              <option value="todos">Todos os meses</option>

              {months.map((month) => (

                <option key={month} value={month}>

                  {month}

                </option>

              ))}

            </select>

          </div>



          {people.length === 0 ? (

            <EmptyState

              title="Nenhum crédito encontrado"

              description="Ajuste a busca ou importe a planilha do Paraíba Grill."

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

                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]">

                      <UtensilsCrossed className="h-4 w-4" />

                    </span>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-[var(--color-heading)]">

                        {person.employeeName}

                      </p>

                      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">

                        {person.items.length} lançamento(s) · {person.quantity} refeição(ões)

                      </p>

                      {!person.employeeId ? (

                        <p className="mt-1 text-[11px] font-semibold text-[var(--color-warning)]">

                          Sem vínculo no cadastro

                        </p>

                      ) : null}

                    </div>

                  </div>

                  <div className="text-right">

                    <p className="text-sm font-semibold text-[var(--color-heading)]">

                      {formatCurrency(person.consumption)}

                    </p>

                    <p className="mt-1 text-xs font-semibold text-[var(--color-green-text)]">

                      Ver histórico

                    </p>

                  </div>

                </button>

              ))}

            </div>

          )}



          {daily.length > 0 ? (

            <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] md:p-6">

              <p className="text-xs font-semibold text-[var(--color-green-text)]">

                Financeiro

              </p>

              <h2 className="mt-1 text-base font-semibold text-[var(--color-heading)]">

                Resumo diário

              </h2>

              <div className="mt-4 space-y-2">

                {daily.slice(0, 12).map((item) => (

                  <div

                    key={item.id}

                    className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--color-muted)]/40 px-4 py-3"

                  >

                    <p className="text-sm font-semibold text-[var(--color-heading)]">

                      {formatDate(item.date)} · {item.quantity} pedido(s)

                    </p>

                    <p className="text-sm font-semibold text-[var(--color-heading)]">

                      {formatCurrency(item.dayTotal)}

                    </p>

                  </div>

                ))}

              </div>

            </section>

          ) : null}

        </>

      )}



      <FormDialog

        open={formOpen}

        title={editing ? "Editar crédito" : "Novo crédito parceiro"}

        onClose={() => !pending && setFormOpen(false)}

        pending={pending}

        footer={

          <FormDialogFooter

            formId="meal-partner-form"

            onCancel={() => setFormOpen(false)}

            pending={pending}

          />

        }

      >

        <form id="meal-partner-form" action={action} className="space-y-3">

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

          <div className="grid gap-3 sm:grid-cols-2">

            <Field label="Quantidade">

              <input

                name="quantity"

                required

                defaultValue={editing?.quantity ?? ""}

                className={fieldClass}

              />

            </Field>

            <Field label="Valor unitário">

              <input

                name="unitValue"

                defaultValue={editing?.unitValue ?? 23}

                className={fieldClass}

              />

            </Field>

          </div>

          <Field label="Valor consumido">

            <input

              name="consumptionValue"

              required

              defaultValue={editing?.consumptionValue ?? ""}

              className={fieldClass}

            />

          </Field>

          <Field label="Datas dos pedidos">

            <textarea

              name="orderDates"

              rows={3}

              defaultValue={editing?.orderDates ?? ""}

              className={fieldClass}

              placeholder="Ex.: 01/03, 05/03 (2)"

            />

          </Field>

          <Field label="Parceiro">

            <input

              name="partnerName"

              defaultValue={editing?.partnerName ?? "Paraíba Grill"}

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

            await deleteMealPartnerCreditAction(fd);

            setDeleteId(null);

          });

        }}

      />

    </div>

  );

}



function parseOrderDates(raw: string): string[] {

  if (!raw?.trim()) return [];

  return raw

    .split(/[,;]+/)

    .map((part) => part.replace(/\s*\(.*?\)\s*/g, "").trim())

    .filter(Boolean);

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

  onEdit: (item: MealPartnerCredit) => void;

  onDelete: (id: string) => void;

}) {

  const sorted = [...person.items].sort(

    (a, b) => b.year - a.year || b.monthNumber - a.monthNumber,

  );

  const unitValue = sorted[0]?.unitValue ?? 23;



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

            Adicionar lançamento

          </Button>

        ) : null}

      </div>



      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">

        <div className="flex flex-col gap-5 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-7">

          <div className="flex items-center gap-4">

            <span

              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-info-soft)] text-[var(--color-info-text)]"

            >

              <UtensilsCrossed className="h-7 w-7" />

            </span>

            <div className="min-w-0">

              <p className="text-xs font-semibold text-[var(--color-green-text)]">

                Histórico de crédito

              </p>

              <h2 className="mt-1 truncate text-xl font-bold text-[var(--color-heading)]">

                {person.employeeName}

              </h2>

              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">

                Paraíba Grill · até liberação do vale alimentação

              </p>

            </div>

          </div>

          {person.employeeId ? (

            <Link

              href={`/colaboradores/${person.employeeId}?returnTo=${encodeURIComponent("/credito-alimentacao")}`}

              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-input-border)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-heading)] transition-colors hover:border-[var(--color-input-border-hover)] hover:bg-[var(--color-muted)]"

            >

              Ficha completa

              <ArrowUpRight className="h-3.5 w-3.5" />

            </Link>

          ) : null}

        </div>



        <div className="grid gap-4 border-t border-[var(--color-border)] bg-[var(--color-muted)]/35 px-5 py-5 sm:grid-cols-3 md:px-7">

          <div>

            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">

              Refeições

            </p>

            <p className="mt-2 text-sm font-semibold text-[var(--color-heading)]">

              {person.quantity}

            </p>

          </div>

          <div>

            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">

              Valor unitário

            </p>

            <p className="mt-2 text-sm font-semibold text-[var(--color-heading)]">

              {formatCurrency(unitValue)}

            </p>

          </div>

          <div>

            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">

              Total consumido

            </p>

            <p className="mt-2 text-sm font-semibold text-[var(--color-heading)]">

              {formatCurrency(person.consumption)}

            </p>

          </div>

        </div>

      </section>



      <section className="rounded-[var(--radius-lg)] border border-[rgba(0,217,49,0.3)] bg-[var(--color-green-soft)]/40 px-5 py-5 md:px-6">

        <div className="flex flex-wrap items-end justify-between gap-3">

          <div>

            <p className="text-xs font-semibold text-[var(--color-heading)]">

              Crédito parceiro

            </p>

            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">

              {sorted.length} período(s) registrados

            </p>

          </div>

          <p className="text-2xl font-bold tabular-nums text-[var(--color-heading)]">

            {formatCurrency(person.consumption)}

          </p>

        </div>

      </section>



      <div className="space-y-4">

        <div>

          <p className="text-xs font-semibold text-[var(--color-green-text)]">

            Lançamentos

          </p>

          <h3 className="mt-1 text-lg font-semibold text-[var(--color-heading)]">

            Por período

          </h3>

        </div>



        <div className="grid gap-4">

          {sorted.map((item) => {

            const dates = parseOrderDates(item.orderDates);

            return (

              <article

                key={item.id}

                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] md:p-6"

              >

                <div className="flex flex-wrap items-start justify-between gap-3">

                  <div>

                    <p className="text-xs font-semibold text-[var(--color-green-text)]">

                      Período

                    </p>

                    <h4 className="mt-1 text-base font-semibold text-[var(--color-heading)]">

                      {item.monthLabel}/{item.year}

                    </h4>

                  </div>

                  <div className="flex items-center gap-2">

                    <div className="rounded-[var(--radius-pill)] bg-[var(--color-muted)] px-3 py-1.5 text-sm font-semibold tabular-nums text-[var(--color-heading)]">

                      {formatCurrency(item.consumptionValue)}

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



                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  <div>

                    <p className="text-xs font-medium text-[var(--color-muted-foreground)]">

                      Quantidade

                    </p>

                    <p className="mt-2 text-sm font-semibold text-[var(--color-heading)]">

                      {item.quantity} refeição(ões)

                    </p>

                  </div>

                  <div>

                    <p className="text-xs font-medium text-[var(--color-muted-foreground)]">

                      Valor unitário

                    </p>

                    <p className="mt-2 text-sm font-semibold text-[var(--color-heading)]">

                      {formatCurrency(item.unitValue)}

                    </p>

                  </div>

                </div>



                <div className="mt-5">

                  <p className="text-xs font-medium text-[var(--color-muted-foreground)]">

                    Datas dos pedidos

                  </p>

                  {dates.length > 0 ? (

                    <div className="mt-3 flex flex-wrap gap-2">

                      {dates.map((date) => (

                        <span

                          key={`${item.id}-${date}`}

                          className="rounded-[var(--radius-pill)] bg-[var(--color-muted)] px-3 py-1.5 text-xs font-bold text-[var(--color-heading)]"

                        >

                          {date}

                        </span>

                      ))}

                    </div>

                  ) : (

                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">

                      Datas não informadas

                    </p>

                  )}

                </div>

              </article>

            );

          })}

        </div>

      </div>

    </div>

  );

}



function Stat({ label, value }: { label: string; value: string }) {

  return (

    <div className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 sm:px-5 sm:py-4">

      <p className="text-xs font-medium text-[var(--color-muted-foreground)]">

        {label}

      </p>

      <p className="mt-1.5 break-words text-lg font-bold tabular-nums text-[var(--color-heading)] sm:mt-2 sm:text-2xl">{value}</p>

    </div>

  );

}


