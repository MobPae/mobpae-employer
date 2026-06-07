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
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-normal text-blue-700">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-bold tracking-normal text-blue-950">{title}</h1>
        {description ? <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900/65">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
