export function CostStat({
  label,
  value,
  hint,
  emphasize = false,
}: {
  label: string;
  value: string;
  hint: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-[var(--radius-lg)] border px-4 py-3.5 sm:px-5 sm:py-4 ${
        emphasize
          ? "border-[rgba(0,217,49,0.35)] bg-[var(--color-green-soft)]/40"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p
        className={`mt-1.5 break-words text-lg font-bold tabular-nums sm:mt-2 sm:text-2xl ${
          emphasize ? "text-[var(--color-green-text)]" : "text-[var(--color-heading)]"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hint}</p>
    </div>
  );
}
