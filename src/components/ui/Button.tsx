import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary:   "bg-[#7679FF] text-white shadow-sm shadow-[#7679FF]/20 hover:bg-[#5659D9] disabled:bg-[#A5A7FF]",
  secondary: "border border-[#E4E4EF] bg-white text-[#191A2E] hover:bg-[#F0F0F8] disabled:text-[#62657A]",
  danger:    "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  ghost:     "text-[#5659D9] hover:bg-[#ECEBFF] disabled:text-[#62657A]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

export function Button({ className = "", variant = "primary", icon, children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-[600] transition disabled:cursor-not-allowed disabled:shadow-none ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
