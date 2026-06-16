import { Check, ChevronRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api-errors";
import { salaryRequestService } from "../../services/salary-request.service";
import type { SalaryRequest, SalaryRequestStatus } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

// ── status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING:      { label: "Pending",      bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
  SUBMITTED:    { label: "Submitted",    bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-400"     },
  UNDER_REVIEW: { label: "Under review", bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400"  },
  APPROVED:     { label: "Approved",     bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  REJECTED:     { label: "Rejected",     bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400"     },
  DISBURSED:    { label: "Disbursed",    bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400"    },
  REPAID:       { label: "Repaid",       bg: "bg-slate-100",  text: "text-slate-500",   dot: "bg-slate-400"   },
};

const REVIEWABLE = new Set(["PENDING", "SUBMITTED", "UNDER_REVIEW"]);

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? { label: status, bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-[500] ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ── filter chips ──────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: "ALL" | SalaryRequestStatus }[] = [
  { label: "All",          value: "ALL"         },
  { label: "Pending",      value: "PENDING"      },
  { label: "Submitted",    value: "SUBMITTED"    },
  { label: "Under review", value: "UNDER_REVIEW" },
  { label: "Approved",     value: "APPROVED"     },
  { label: "Rejected",     value: "REJECTED"     },
  { label: "Disbursed",    value: "DISBURSED"    },
  { label: "Repaid",       value: "REPAID"       },
];

// ── drawer ────────────────────────────────────────────────────────────────────

function DrawerPanel({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />}
      <div className={`fixed inset-y-0 right-0 z-40 w-[440px] bg-white border-l border-slate-200 shadow-xl flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}>
        {children}
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className="text-[12px] font-[500] text-slate-800">{value}</span>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function SalaryRequestsPage() {
  const toast = useToast();
  const [requests,   setRequests]   = useState<SalaryRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<SalaryRequest | null>(null);
  const [query,      setQuery]      = useState("");
  const [filter,     setFilter]     = useState<"ALL" | SalaryRequestStatus>("ALL");
  const [action,     setAction]     = useState<"APPROVE" | "REJECT" | null>(null);
  const [remarks,    setRemarks]    = useState("");

  const load = () => {
    setLoading(true);
    salaryRequestService.getSalaryRequests()
      .then(setRequests)
      .catch(err => toast.error("Failed to load", getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    requests.filter(r => {
      const q = `${r.requestId} ${r.employeeName} ${r.employeeCode}`.toLowerCase();
      return q.includes(query.toLowerCase()) && (filter === "ALL" || r.status === filter);
    }),
    [requests, query, filter]
  );

  // counts per status for chips
  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: requests.length };
    requests.forEach(r => { m[r.status] = (m[r.status] ?? 0) + 1; });
    return m;
  }, [requests]);

  const canReview = selected && REVIEWABLE.has(selected.status);

  const handleApprove = async () => {
    if (!selected) return;
    setAction("APPROVE");
    try {
      await salaryRequestService.approveRequest(selected.id);
      load();
      toast.success("Request approved", selected.requestId);
      setSelected(null);
    } catch (err) {
      toast.error("Approval failed", getApiErrorMessage(err));
    } finally { setAction(null); }
  };

  const handleReject = async () => {
    if (!selected || !remarks.trim()) return;
    setAction("REJECT");
    try {
      await salaryRequestService.rejectRequest(selected.id, remarks.trim());
      load();
      toast.success("Request rejected", selected.requestId);
      setSelected(null);
      setRemarks("");
    } catch (err) {
      toast.error("Rejection failed", getApiErrorMessage(err));
    } finally { setAction(null); }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[280px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, code, ID…"
            className="w-full h-9 pl-8 pr-3 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder-slate-400 text-slate-800"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`h-7 px-3 rounded-full text-[12px] font-[500] transition-colors flex items-center gap-1.5 ${
              filter === f.value
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {f.label}
            {counts[f.value] !== undefined && (
              <span className={`text-[10px] font-[700] ${filter === f.value ? "text-white/60" : "text-slate-400"}`}>
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <p className="text-[13px] text-slate-400">Loading salary requests…</p>
          </div>
        ) : !filtered.length ? (
          <div className="py-16 text-center">
            <p className="text-[13px] font-[500] text-slate-500">No requests found</p>
            <p className="text-[12px] text-slate-400 mt-1">Try changing your filter or search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-[12px]">
              <colgroup>
                <col style={{ width: "13%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100">
                  {["Request ID", "Employee", "Requested", "Approved", "Status", "Date", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-[500] text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => { setRemarks(""); setSelected(r); }}
                    className={`cursor-pointer hover:bg-slate-50/60 transition-colors ${selected?.id === r.id ? "bg-blue-50/30" : ""}`}
                  >
                    <td className="px-5 py-3 font-[600] text-slate-700">{r.requestId}</td>
                    <td className="px-5 py-3">
                      <p className="font-[500] text-slate-800 truncate">{r.employeeName}</p>
                      <p className="text-[10px] text-slate-400">{r.employeeCode}</p>
                    </td>
                    <td className="px-5 py-3 font-[600] text-slate-700 tabular-nums">{formatCurrency(r.requestedAmount)}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-500">
                      {r.approvedAmount ? formatCurrency(r.approvedAmount) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3"><StatusPill status={r.status} /></td>
                    <td className="px-5 py-3 text-slate-400 tabular-nums">{formatDate(r.createdDate)}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-[12px] font-[500] text-blue-500 hover:text-blue-700">
                        Review <ChevronRight size={12} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      <DrawerPanel open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <>
            {/* Drawer header */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-[600] text-slate-400 uppercase tracking-[0.07em]">{selected.requestId}</span>
                    <StatusPill status={selected.status} />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-[700] text-slate-500 flex-shrink-0">
                      {selected.employeeName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[14px] font-[600] text-slate-900 leading-none">{selected.employeeName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{selected.employeeCode}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-[11px] text-slate-400 mb-1">Requested</p>
                  <p className="text-[18px] font-[700] text-slate-900 tabular-nums">{formatCurrency(selected.requestedAmount)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-[11px] text-slate-400 mb-1">Approved</p>
                  <p className="text-[18px] font-[700] text-slate-900 tabular-nums">
                    {selected.approvedAmount ? formatCurrency(selected.approvedAmount) : <span className="text-slate-300 font-[400]">—</span>}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="bg-white border border-slate-100 rounded-xl px-4 py-1">
                <InfoRow label="Purpose"    value={selected.purpose || "—"} />
                <InfoRow label="Created"    value={formatDate(selected.createdDate)} />
                {selected.reviewerNote && (
                  <InfoRow label="Reviewer note" value={selected.reviewerNote} />
                )}
              </div>

              {/* Review actions */}
              {canReview && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-3">
                  <p className="text-[12px] font-[600] text-amber-800">Review this request</p>

                  <div>
                    <label className="block text-[11px] font-[500] text-slate-500 mb-1">Rejection remarks (required to reject)</label>
                    <textarea
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Employee not eligible…"
                      rows={3}
                      className="w-full px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleApprove}
                      disabled={Boolean(action)}
                      className="h-9 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-[600] disabled:opacity-50 transition-colors"
                    >
                      <Check size={13} />
                      {action === "APPROVE" ? "Approving…" : "Approve"}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={Boolean(action) || !remarks.trim()}
                      className="h-9 flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-[600] disabled:opacity-40 transition-colors"
                    >
                      <X size={13} />
                      {action === "REJECT" ? "Rejecting…" : "Reject"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DrawerPanel>
    </div>
  );
}
