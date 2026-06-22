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

  return (
    <div className="flex items-center justify-between px-1 mt-4">
      <p className="text-[12px] text-[#62657A]">
        Showing <span className="font-[600] text-[#191A2E]">{from}–{to}</span> of <span className="font-[600] text-[#191A2E]">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E4E4EF] text-[#62657A] hover:bg-[#F0F0F8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={13} />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-[11px] text-[#62657A]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-[600] transition-colors ${
                p === page
                  ? "bg-[#7679FF] text-white"
                  : "border border-[#E4E4EF] text-[#62657A] hover:bg-[#F0F0F8]"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E4E4EF] text-[#62657A] hover:bg-[#F0F0F8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
