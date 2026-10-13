import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold text-[var(--color-green-text)]">{eyebrow}</p>
        ) : null}
        <h1 className="brand-title text-2xl md:text-[1.75rem]">{title}</h1>
        {description ? (
          <div className="mt-1.5 max-w-3xl text-sm text-[var(--color-muted-foreground)]">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
