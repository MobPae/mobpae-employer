import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  icon,
  iconBg = "bg-brand-soft",
  iconColor = "text-brand",
  helper,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconBg?: string;
  iconColor?: string;
  helper?: string;
}) {
  return (
    <article className="flex-1 min-w-0 rounded-2xl border border-edge bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xs font-semibold uppercase tracking-[0.07em] text-ink-4">{label}</p>
          <p className="mt-2 text-[22px] font-bold text-ink tabular-nums leading-none">{value}</p>
          {helper && <p className="mt-2 text-2xs text-ink-4">{helper}</p>}
        </div>
        <div className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </article>
  );
}
