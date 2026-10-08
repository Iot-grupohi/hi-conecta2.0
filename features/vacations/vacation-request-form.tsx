"use client";

import { useActionState, useMemo, useState } from "react";
import {
  requestVacationAction,
  type VacationActionState,
} from "@/features/vacations/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";

const initialState: VacationActionState = {};

function calcPreviewDays(startDate: string, endDate: string): number | null {
  if (!startDate || !endDate) return null;
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function VacationRequestForm() {
  const [state, formAction, pending] = useActionState(requestVacationAction, initialState);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [open, setOpen] = useState(false);
  const days = useMemo(() => calcPreviewDays(startDate, endDate), [startDate, endDate]);

  useCloseOnSuccess(pending, state.success, () => {
    setStartDate("");
    setEndDate("");
    setOpen(false);
  });

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-[var(--shadow-sm)]">
        <div>
          <p className="text-sm font-extrabold text-[var(--color-heading)]">Nova solicitação</p>
          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
            Escolha o período e envie para o RH analisar.
          </p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          Solicitar férias
        </Button>
        {state.success ? (
          <p className="w-full rounded-[var(--radius-md)] bg-[var(--color-success-soft)] px-3 py-2 text-sm text-[var(--color-success)]">
            {state.success}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[rgba(0,217,49,0.35)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-[var(--color-heading)]">Solicitar férias</p>
          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
            Informe início, término e, se quiser, uma observação.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-[var(--color-muted-foreground)] hover:text-[var(--color-heading)]"
        >
          Cancelar
        </button>
      </div>

      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        {state.error ? (
          <p className="sm:col-span-2 rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {state.error}
          </p>
        ) : null}

        <label className="space-y-1.5 text-sm">
          <span className="font-semibold text-[var(--color-heading)]">Início</span>
          <Input
            type="date"
            name="startDate"
            required
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="rounded-[var(--radius-pill)]"
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-semibold text-[var(--color-heading)]">Término</span>
          <Input
            type="date"
            name="endDate"
            required
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="rounded-[var(--radius-pill)]"
          />
        </label>
        <label className="space-y-1.5 text-sm sm:col-span-2">
          <span className="font-semibold text-[var(--color-heading)]">Observação</span>
          <textarea
            name="notes"
            rows={2}
            placeholder="Opcional"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {days != null ? (
              <>
                <strong className="text-[var(--color-heading)]">{days}</strong> dia(s) útil(eis)
              </>
            ) : (
              "Selecione as datas"
            )}
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? "Enviando..." : "Enviar ao RH"}
          </Button>
        </div>
      </form>
    </section>
  );
}
