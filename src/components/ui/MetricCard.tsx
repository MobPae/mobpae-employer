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
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 text-slate-700">{icon}</div>
      </div>
      {helper ? <p className="mt-3 text-xs text-slate-500">{helper}</p> : null}
    </article>
  );
}
