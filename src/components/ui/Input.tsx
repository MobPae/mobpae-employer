import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
}

export function Input({ label, icon, className = "", ...props }: InputProps) {
  return (
    <label className="grid gap-1.5 text-[12px] font-[600] text-[#191A2E]">
      {label}
      <span className="relative">
        {icon ? <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#62657A]">{icon}</span> : null}
        <input
          className={`h-10 w-full rounded-lg border border-[#E4E4EF] bg-white px-3 text-[13px] text-[#191A2E] transition placeholder:text-[#62657A] focus:border-[#7679FF] focus:ring-4 focus:ring-[#7679FF]/10 disabled:cursor-not-allowed disabled:border-[#E4E4EF] disabled:bg-[#F0F0F8] disabled:text-[#62657A] ${icon ? "pl-9" : ""} ${className}`}
          {...props}
        />
      </span>
    </label>
  );
}
