"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

export type ConfirmTone = "danger" | "primary" | "warning";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
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
        onCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, pending, onCancel]);

  if (!open || typeof document === "undefined") return null;

  const accent =
    tone === "danger"
      ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
      : tone === "warning"
        ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
        : "bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-[rgba(0,0,66,0.55)] backdrop-blur-[2px]"
        onClick={() => {
          if (!pending) onCancel();
        }}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="dialog-enter relative z-10 w-full overflow-hidden rounded-t-[var(--radius-lg)] border sm:max-w-md sm:rounded-[var(--radius-lg)] border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]"
      >
        <div className="relative overflow-hidden px-6 pb-2 pt-6">
          <div
            className="absolute inset-x-0 top-0 h-1.5"
            style={{ background: "var(--gradient-brand)" }}
          />
          <div
            className={`inline-flex rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-semibold ${accent}`}
          >
            Confirmação
          </div>
          <h2 id={titleId} className="mt-3 text-lg font-semibold text-[var(--color-heading)]">
            {title}
          </h2>
          {description ? (
            <p
              id={descriptionId}
              className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]"
            >
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] [&>*]:flex-1 sm:[&>*]:flex-none">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            disabled={pending}
            autoFocus
          >
            {pending ? "Aguarde..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
