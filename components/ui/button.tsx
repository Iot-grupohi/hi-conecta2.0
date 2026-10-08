import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "rounded-[var(--radius-pill)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-glow)] hover:bg-[var(--color-primary-hover)] hover:-translate-y-0.5",
  secondary:
    "rounded-[var(--radius-pill)] border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20",
  ghost:
    "rounded-[var(--radius-pill)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
  outline:
    "rounded-[var(--radius-pill)] border border-[rgba(0,0,112,0.15)] bg-[var(--color-surface)] text-[var(--color-heading)] hover:border-[rgba(0,217,49,0.35)] hover:bg-[var(--color-green-soft)]",
  danger:
    "rounded-[var(--radius-pill)] bg-[var(--color-danger)] text-white hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-xs font-bold",
  md: "h-10 px-5 text-sm font-bold",
  lg: "h-11 px-6 text-sm font-extrabold",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
