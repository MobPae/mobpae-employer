import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 disabled:bg-blue-300",
  secondary: "border border-blue-100 bg-white text-blue-900 hover:bg-blue-50 disabled:text-slate-400",
  danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300",
  ghost: "text-blue-800 hover:bg-blue-50 disabled:text-slate-400"
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

export function Button({ className = "", variant = "primary", icon, children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:shadow-none ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
