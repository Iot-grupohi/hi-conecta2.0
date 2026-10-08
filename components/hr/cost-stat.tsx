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
      className={`rounded-[var(--radius-lg)] border px-5 py-4 ${
        emphasize
          ? "border-[rgba(0,217,49,0.35)] bg-[var(--color-green-soft)]/40"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--color-muted-foreground)] uppercase">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-extrabold tabular-nums ${
          emphasize ? "text-[var(--color-navy)]" : "text-[var(--color-heading)]"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hint}</p>
    </div>
  );
}
