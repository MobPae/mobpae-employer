import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size    = "sm" | "md" | "lg";

const VARIANT_CLS: Record<Variant, string> = {
  primary:   "bg-brand text-white shadow-brand hover:bg-brand-hover active:bg-brand-active disabled:opacity-50 disabled:shadow-none",
  secondary: "bg-surface text-ink-3 border border-edge hover:bg-surface-raised disabled:opacity-50",
  danger:    "bg-danger text-white hover:bg-danger-dark disabled:opacity-50",
  ghost:     "text-brand hover:bg-brand-soft disabled:opacity-50",
};

const SIZE_CLS: Record<Size, string> = {
  sm: "h-7 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
  lg: "h-10 px-5 text-sm gap-2 rounded-xl",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-colors duration-150 disabled:cursor-not-allowed ${VARIANT_CLS[variant]} ${SIZE_CLS[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
