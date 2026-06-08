import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  icon,
  helper
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  helper?: string;
}) {
  return (
    <article className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.02em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-blue-700">{icon}</div>
      </div>
      {helper ? <p className="mt-3 text-xs text-slate-500">{helper}</p> : null}
    </article>
  );
}
