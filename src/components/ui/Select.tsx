import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ label: string; value: string }>;
}

export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <select
        className={`h-10 w-full rounded-md border border-blue-100 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 ${className}`}
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
