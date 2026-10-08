import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <p className="brand-eyebrow mb-2">Grupo HI · Hi-Conecta RH</p>
        <h1 className="brand-title text-2xl tracking-tight md:text-3xl">{title}</h1>
        {description ? (
          <div className="mt-2 max-w-3xl text-sm font-medium normal-case tracking-normal text-[var(--color-muted-foreground)]">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
