import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-[var(--radius-pill)] border border-[var(--color-input-border)] bg-[var(--color-surface)] px-4 text-base text-[var(--color-foreground)] sm:text-sm placeholder:text-[var(--color-muted-foreground)] transition-[border-color,box-shadow] duration-150 hover:border-[var(--color-input-border-hover)] focus-visible:border-[var(--color-ring)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,217,49,0.18)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
