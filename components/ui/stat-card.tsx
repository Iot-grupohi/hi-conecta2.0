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
    default: "text-[var(--color-navy)] bg-[var(--color-primary-soft)]",
    success: "text-[var(--color-success)] bg-[var(--color-success-soft)]",
    warning: "text-[var(--color-warning)] bg-[var(--color-warning-soft)]",
    danger: "text-[var(--color-danger)] bg-[var(--color-danger-soft)]",
    info: "text-[var(--color-info)] bg-[var(--color-info-soft)]",
  }[tone];

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(0,217,49,0.3)] hover:shadow-[var(--shadow-md)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wide text-[var(--color-muted-foreground)]">{label}</p>
          <p className="brand-gradient-text mt-2 text-3xl font-extrabold tracking-tight">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs font-medium normal-case tracking-normal text-[var(--color-muted-foreground)]">
              {hint}
            </p>
          ) : null}
        </div>
        {icon ? (
          <div className={cn("rounded-full p-2.5", toneClass)}>{icon}</div>
        ) : null}
      </div>
    </div>
  );
}
