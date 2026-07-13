import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ label: string; value: string }>;
}

export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <label className="grid gap-1.5">
      {label && (
        <span className="text-xs font-semibold text-ink">{label}</span>
      )}
      <select
        className={`h-10 w-full rounded-lg border border-edge bg-surface px-3 text-sm text-ink transition-colors
          focus:border-brand focus:ring-2 focus:ring-brand/15
          disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-disabled
          ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
