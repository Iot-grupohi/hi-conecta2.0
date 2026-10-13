import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "select-chevron flex h-10 w-full cursor-pointer rounded-[var(--radius-pill)] border border-[var(--color-input-border)] bg-[var(--color-surface)] pl-4 pr-10 text-base text-[var(--color-foreground)] sm:text-sm transition-[border-color,box-shadow] duration-150 hover:border-[var(--color-input-border-hover)] focus-visible:border-[var(--color-ring)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,217,49,0.18)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";
