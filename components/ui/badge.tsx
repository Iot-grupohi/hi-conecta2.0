import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

/** Tags suaves: fundo claro, texto colorido e indicador de cor. */
const tones: Record<BadgeTone, string> = {
  neutral: "bg-[var(--color-neutral-soft)] text-[var(--color-neutral-text)] before:bg-[var(--color-muted-foreground)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success-text)] before:bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning-text)] before:bg-[var(--color-warning)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger-text)] before:bg-[var(--color-danger)]",
  info: "bg-[var(--color-info-soft)] text-[var(--color-info-text)] before:bg-[var(--color-info)]",
  primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary-text)] before:bg-[var(--color-green)]",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-left text-[11px] font-semibold leading-5 whitespace-nowrap",
        "before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:content-['']",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
