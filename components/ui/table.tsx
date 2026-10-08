import { cn } from "@/lib/utils";

export function Table({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full max-h-[calc(100dvh-12rem)] overflow-auto">
      <table
        className={cn(
          "w-full caption-bottom border-separate border-spacing-0 text-sm",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />;
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-[var(--color-muted)]/60", className)}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "sticky top-0 z-20 h-11 border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 text-left align-middle text-xs font-extrabold tracking-wide text-[var(--color-muted-foreground)] shadow-[0_1px_0_0_var(--color-border)]",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("border-b border-[var(--color-border)] px-4 py-3 align-middle", className)}
      {...props}
    />
  );
}
