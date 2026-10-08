export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";

  return (
    <div
      className={`flex ${dim} items-center justify-center rounded-full bg-[var(--color-green)] font-extrabold text-[var(--color-navy)] shadow-[0_0_24px_-6px_rgba(0,217,49,0.55)]`}
      aria-hidden
    >
      HI
    </div>
  );
}

export function BrandWordmark({ light = false }: { light?: boolean }) {
  return (
    <div className="leading-tight">
      <p className="text-sm font-extrabold tracking-tight">
        <span className={light ? "text-white" : "text-[var(--color-navy)]"}>Grupo </span>
        <span className="text-[var(--color-green)]">HI</span>
      </p>
      <p className={`text-[10px] font-bold tracking-[0.18em] ${light ? "text-white/70" : "text-[var(--color-muted-foreground)]"}`}>
        Hi-Conecta RH
      </p>
    </div>
  );
}
