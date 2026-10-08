import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

/** Tags com texto branco e fundo colorido vivo. */
const tones: Record<BadgeTone, string> = {
  neutral: "bg-[var(--color-navy)] text-white",
  success: "bg-[var(--color-success)] text-white",
  warning: "bg-[var(--color-warning)] text-white",
  danger: "bg-[var(--color-danger)] text-white",
  info: "bg-[var(--color-navy-mid)] text-white",
  primary: "bg-[var(--color-green)] text-white",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-left text-[10px] font-extrabold leading-snug tracking-wide whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
