import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-[11px] font-[700] uppercase tracking-[0.06em] text-[#7679FF]">{eyebrow}</p> : null}
        <h1 className="mt-1 text-[16px] font-[700] text-[#191A2E]">{title}</h1>
        {description ? <p className="mt-1 max-w-4xl text-[12px] leading-relaxed text-[#62657A]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
