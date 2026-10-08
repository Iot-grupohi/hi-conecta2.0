import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
  action,
}: {
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 px-6 py-16 text-center",
        className,
      )}
    >
      <h3 className="text-base font-extrabold text-[var(--color-heading)]">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm font-medium normal-case tracking-normal text-[var(--color-muted-foreground)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
