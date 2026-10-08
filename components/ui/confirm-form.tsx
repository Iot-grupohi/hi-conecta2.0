"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { ConfirmDialog, type ConfirmTone } from "@/components/ui/confirm-dialog";

type TriggerApi = {
  open: () => void;
};

/**
 * Themed confirm modal before a server form action. Never uses window.confirm.
 */
export function ConfirmForm({
  action,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger",
  trigger,
  hiddenFields,
}: {
  action: (formData: FormData) => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  trigger: (api: TriggerApi) => ReactNode;
  hiddenFields?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleCancel = useCallback(() => {
    if (!pending) setOpen(false);
  }, [pending]);

  const handleConfirm = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <>
      {trigger({ open: () => setOpen(true) })}

      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        tone={tone}
        pending={pending}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />

      <form
        ref={formRef}
        className="hidden"
        action={async (formData) => {
          setPending(true);
          try {
            await action(formData);
            setOpen(false);
          } catch {
            setOpen(false);
          } finally {
            setPending(false);
          }
        }}
      >
        {hiddenFields}
      </form>
    </>
  );
}
