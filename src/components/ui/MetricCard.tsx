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
    <article className="rounded-xl border border-[#E4E4EF] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-[700] uppercase tracking-[0.06em] text-[#62657A]">{label}</p>
          <p className="mt-2 text-[22px] font-[700] text-[#191A2E] tabular-nums">{value}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#ECEBFF] text-[#7679FF]">{icon}</div>
      </div>
      {helper ? <p className="mt-3 text-[11px] text-[#62657A]">{helper}</p> : null}
    </article>
  );
}
