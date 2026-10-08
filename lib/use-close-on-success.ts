"use client";

import { useEffect, useRef } from "react";

/**
 * Fecha modal/form após um submit bem-sucedido.
 * Dispara quando `pending` passa de true → false e há `success`
 * (funciona mesmo se a mensagem de sucesso for igual à anterior).
 */
export function useCloseOnSuccess(
  pending: boolean,
  success: string | null | undefined,
  onSuccess: () => void,
) {
  const wasPending = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (wasPending.current && !pending && success) {
      onSuccessRef.current();
    }
    wasPending.current = pending;
  }, [pending, success]);
}
