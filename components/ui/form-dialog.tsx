"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function FormDialog({
  open,
  title,
  description,
  children,
  onClose,
  pending = false,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  pending?: boolean;
  footer?: React.ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, pending, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-[rgba(0,0,66,0.55)] backdrop-blur-[2px]"
        onClick={() => {
          if (!pending) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-extrabold text-[var(--color-heading)]">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!pending) onClose();
            }}
            className="rounded-full p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-muted)]/30 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function FormDialogFooter({
  onCancel,
  pending,
  submitLabel = "Salvar",
  formId,
}: {
  onCancel: () => void;
  pending?: boolean;
  submitLabel?: string;
  formId?: string;
}) {
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={pending}>
        Cancelar
      </Button>
      <Button type="submit" size="sm" form={formId} disabled={pending}>
        {pending ? "Salvando..." : submitLabel}
      </Button>
    </>
  );
}
