import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ label: string; value: string }>;
}

export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <label className="grid gap-1.5 text-[12px] font-[600] text-[#191A2E]">
      {label}
      <select
        className={`h-10 w-full rounded-lg border border-[#E4E4EF] bg-white px-3 text-[13px] text-[#191A2E] transition focus:border-[#7679FF] focus:ring-4 focus:ring-[#7679FF]/10 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
