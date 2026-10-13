import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass = {
    default: "text-[var(--color-primary-text)] bg-[var(--color-primary-soft)]",
    success: "text-[var(--color-success-text)] bg-[var(--color-success-soft)]",
    warning: "text-[var(--color-warning-text)] bg-[var(--color-warning-soft)]",
    danger: "text-[var(--color-danger-text)] bg-[var(--color-danger-soft)]",
    info: "text-[var(--color-info-text)] bg-[var(--color-info-soft)]",
  }[tone];

  return (
    <div className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs font-medium text-[var(--color-muted-foreground)] sm:text-[13px]">{label}</p>
        {icon ? (
          <div className={cn("shrink-0 rounded-[var(--radius-md)] p-1.5 sm:p-2", toneClass)}>{icon}</div>
        ) : null}
      </div>
      <p className="mt-1 truncate text-2xl font-bold tabular-nums tracking-tight text-[var(--color-heading)] sm:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      ) : null}
    </div>
  );
}
