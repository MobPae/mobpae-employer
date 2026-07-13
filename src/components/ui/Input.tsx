import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

export function Input({ label, icon, error, className = "", ...props }: InputProps) {
  return (
    <label className="grid gap-1.5">
      {label && (
        <span className="text-xs font-semibold text-ink">{label}</span>
      )}
      <span className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          className={`h-10 w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-ink-4 transition-colors
            ${error ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/15" : "border-edge focus:border-brand focus:ring-2 focus:ring-brand/15"}
            disabled:cursor-not-allowed disabled:border-edge disabled:bg-surface-muted disabled:text-ink-disabled
            ${icon ? "pl-9" : ""}
            ${className}`}
          {...props}
        />
      </span>
      {error && (
        <span className="text-2xs font-medium text-danger">{error}</span>
      )}
    </label>
  );
}
