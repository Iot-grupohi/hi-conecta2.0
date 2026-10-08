"use client";

import { useState } from "react";
import { approveVacationAction, rejectVacationAction } from "@/features/vacations/actions";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TagBadge } from "@/components/hr/tag-badge";
import { formatDate } from "@/lib/hr";
import { resolveDepartmentTag, resolveVacationStatusTag } from "@/lib/tags";
import type { Vacation } from "@/types/hr";

export function VacationApprovalQueue({ items }: { items: Vacation[] }) {
  const pending = items.filter((item) => item.status === "pendente" || item.status === "solicitar");

  if (pending.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Pendentes de aprovação</CardTitle>
        <CardDescription>
          {pending.length} solicitação(ões) aguardando análise do RH
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.map((vacation) => (
          <ApprovalRow key={vacation.id} vacation={vacation} />
        ))}
      </CardContent>
    </Card>
  );
}

function ApprovalRow({ vacation }: { vacation: Vacation }) {
  const [rhNotes, setRhNotes] = useState("");

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <div className="space-y-1">
        <p className="font-medium">{vacation.employeeName}</p>
        <div className="flex flex-wrap items-center gap-2">
          <TagBadge tag={resolveDepartmentTag(vacation.departmentName)} />
          <TagBadge tag={resolveVacationStatusTag(vacation.status)} />
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {formatDate(vacation.startDate)} — {formatDate(vacation.endDate)}
          {vacation.days != null ? ` · ${vacation.days} dias` : ""}
        </p>
        {vacation.notes ? (
          <p className="text-sm">
            <span className="text-[var(--color-muted-foreground)]">Obs. colaborador: </span>
            {vacation.notes}
          </p>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          value={rhNotes}
          onChange={(event) => setRhNotes(event.target.value)}
          placeholder="Comentário do RH (opcional)"
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
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
