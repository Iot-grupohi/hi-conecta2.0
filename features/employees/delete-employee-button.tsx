"use client";

import { Trash2 } from "lucide-react";
import { deleteEmployeeAction } from "@/features/employees/actions";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/ui/confirm-form";

export function DeleteEmployeeButton({
  employeeId,
  employeeName,
  returnTo = "/colaboradores",
  compact = false,
  iconOnly = false,
}: {
  employeeId: string;
  employeeName: string;
  returnTo?: string;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  return (
    <ConfirmForm
      action={deleteEmployeeAction}
      title="Apagar colaborador?"
      description={`“${employeeName}” será removido permanentemente. Esta ação não pode ser desfeita.`}
      confirmLabel="Apagar"
      cancelLabel="Cancelar"
      tone="danger"
      hiddenFields={
        <>
          <input type="hidden" name="id" value={employeeId} />
          <input type="hidden" name="returnTo" value={returnTo} />
        </>
      }
      trigger={({ open }) =>
        iconOnly || compact ? (
          <button
            type="button"
            onClick={open}
            className={
              iconOnly
                ? "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger-text)]"
                : "inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] px-3 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
            }
            aria-label={`Apagar ${employeeName}`}
            title="Apagar"
          >
            <Trash2 className="h-4 w-4" />
            {iconOnly ? null : "Apagar"}
          </button>
        ) : (
          <Button variant="danger" size="sm" type="button" onClick={open}>
            <Trash2 className="h-3.5 w-3.5" />
            Apagar
          </Button>
        )
      }
    />
  );
}
