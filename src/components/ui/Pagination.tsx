import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPage }: Props) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const navBtn = "h-7 w-7 flex items-center justify-center rounded-lg border border-edge text-ink-3 transition-colors hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center justify-between px-1 mt-4">
      <p className="text-xs text-ink-4">
        Showing{" "}
        <span className="font-semibold text-ink">{from}–{to}</span>
        {" "}of{" "}
        <span className="font-semibold text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className={navBtn}>
          <ChevronLeft size={13} />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="flex h-7 w-7 items-center justify-center text-xs text-ink-4">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`h-7 w-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                p === page
                  ? "bg-brand text-white"
                  : "border border-edge text-ink-3 hover:bg-surface-raised"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className={navBtn}>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
