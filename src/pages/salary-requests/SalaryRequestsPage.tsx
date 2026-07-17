import { Calendar, Check, CheckCircle2, ChevronRight, Download, Search, X, CheckCheck, Ban, ShieldCheck, ClipboardList } from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Pagination } from "../../components/ui/Pagination";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage, isForbidden } from "../../services/api-errors";
import { salaryRequestService } from "../../services/salary-request.service";
import type { LoanApplication, LoanApplicationHistoryEvent, LoanApplicationStatus } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

const PAGE_SIZE = 15;

// ── status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING:                        { label: "Pending",             bg: "bg-warning-bg",    text: "text-warning",      dot: "bg-warning" },
  SUBMITTED:                      { label: "Submitted",           bg: "bg-warning-bg",    text: "text-warning",      dot: "bg-warning" },
  UNDER_REVIEW:                   { label: "Under review",        bg: "bg-warning-bg",    text: "text-warning",      dot: "bg-warning" },
  EMPLOYER_APPROVED:              { label: "Approved by you",     bg: "bg-info-bg",       text: "text-info",         dot: "bg-info" },
  EMPLOYER_REJECTED:              { label: "Rejected by you",     bg: "bg-danger-bg",     text: "text-danger",       dot: "bg-danger" },
  AWAITING_MEMBERSHIP_PAYMENT:    { label: "Platform fee pending", bg: "bg-warning-bg",   text: "text-warning",      dot: "bg-warning" },
  AWAITING_PLATFORM_FEE_PAYMENT:  { label: "Platform fee pending", bg: "bg-warning-bg",   text: "text-warning",      dot: "bg-warning" },
  APPROVED:                       { label: "Admin approved",      bg: "bg-info-bg",       text: "text-info",         dot: "bg-info" },
  REJECTED:                       { label: "Rejected",            bg: "bg-danger-bg",     text: "text-danger",       dot: "bg-danger" },
  READY_FOR_DISBURSAL:            { label: "Ready to disburse",   bg: "bg-success-bg",    text: "text-success",      dot: "bg-success" },
  DISBURSED:                      { label: "Disbursed",           bg: "bg-success-bg",    text: "text-success",      dot: "bg-success" },
  REPAYMENT_SCHEDULED:            { label: "Repaying",            bg: "bg-warning-bg",    text: "text-warning",      dot: "bg-warning" },
  REPAID:                         { label: "Repaid",              bg: "bg-success-soft",  text: "text-success-dark", dot: "bg-success-dark" },
  CANCELLED:                      { label: "Cancelled",           bg: "bg-surface-muted", text: "text-ink-3",        dot: "bg-ink-3" },
  EXPIRED:                        { label: "Expired",             bg: "bg-surface-muted", text: "text-ink-3",        dot: "bg-ink-3" },
};

// Employer can only review SUBMITTED requests
const REVIEWABLE = new Set(["SUBMITTED"]);

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? { label: status, bg: "bg-surface-muted", text: "text-ink-3", dot: "bg-ink-4" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ── filter chips ──────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: "ALL" | LoanApplicationStatus }[] = [
  { label: "All",           value: "ALL"                            },
  { label: "Submitted",     value: "SUBMITTED"                      },
  { label: "Approved by you", value: "EMPLOYER_APPROVED"            },
  { label: "Rejected by you", value: "EMPLOYER_REJECTED"            },
  { label: "Platform fee",  value: "AWAITING_PLATFORM_FEE_PAYMENT"  },
  { label: "Disbursed",     value: "DISBURSED"                      },
  { label: "Repaying",      value: "REPAYMENT_SCHEDULED"            },
  { label: "Repaid",        value: "REPAID"                         },
];

// ── drawer ────────────────────────────────────────────────────────────────────

function DrawerPanel({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />}
      <div className={`fixed inset-y-0 right-0 z-40 flex w-[440px] flex-col border-l border-edge bg-surface shadow-overlay transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}>
        {children}
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-edge-2 py-2.5 last:border-0">
      <span className="text-xs text-ink-3">{label}</span>
      <span className="text-xs font-medium text-ink">{value}</span>
    </div>
  );
}

// Audit trail of every approve/reject step — only renders once the backend
// supports GET /loan-applications/:id/history.
function HistoryTimeline({ events }: { events: LoanApplicationHistoryEvent[] }) {
  return (
    <div>
      {events.map((e, i) => {
        const cfg = STATUS_CFG[e.status] ?? { label: e.status, dot: "bg-ink-3" };
        return (
          <div key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-brand bg-brand-soft`}>
                <CheckCircle2 size={11} className="text-brand" />
              </span>
              {i < events.length - 1 && <div className="my-1 w-px flex-1 bg-brand-muted" style={{ minHeight: 18 }} />}
            </div>
            <div className="pb-3.5">
              <p className="flex items-center gap-1.5 text-xs font-medium leading-none text-ink">
                {cfg.label}
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              </p>
              <p className="mt-1 text-2xs text-ink-3">{e.actorName} · {formatDate(e.createdAt)}</p>
              {e.note && <p className="mt-1 text-2xs italic text-ink-3">"{e.note}"</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function SalaryRequestsPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests,  setRequests]  = useState<LoanApplication[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected,  setSelected]  = useState<LoanApplication | null>(null);
  const [history,   setHistory]   = useState<LoanApplicationHistoryEvent[]>([]);
  const [query,     setQuery]     = useState(searchParams.get("q") ?? "");
  const [filter,    setFilter]    = useState<"ALL" | LoanApplicationStatus>((searchParams.get("status") as LoanApplicationStatus) || "ALL");
  const [page,      setPage]      = useState(Number(searchParams.get("page")) || 1);
  const [action,    setAction]    = useState<"APPROVE" | "REJECT" | null>(null);
  const [remarks,   setRemarks]   = useState("");

  // bulk selection
  const [selectedIds,         setSelectedIds]         = useState<Set<string>>(new Set());
  const [bulkLoading,         setBulkLoading]         = useState(false);
  const [bulkRejectOpen,      setBulkRejectOpen]      = useState(false);
  const [bulkRemarks,         setBulkRemarks]         = useState("");
  const [confirmBulkApprove,  setConfirmBulkApprove]  = useState(false);
  const [dateFrom,            setDateFrom]            = useState(searchParams.get("from") ?? "");
  const [dateTo,              setDateTo]              = useState(searchParams.get("to") ?? "");

  // Keep filters/page in the URL so refresh, back/forward, and bookmarking
  // a filtered view all just work.
  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (filter !== "ALL") next.set("status", filter);
    if (dateFrom) next.set("from", dateFrom);
    if (dateTo) next.set("to", dateTo);
    if (page > 1) next.set("page", String(page));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter, dateFrom, dateTo, page]);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    salaryRequestService.getSalaryRequests()
      .then(data => { setRequests(data); setSelectedIds(new Set()); })
      .catch(err => { setLoadError(getApiErrorMessage(err)); toast.error("Failed to load", getApiErrorMessage(err)); })
      .finally(() => setLoading(false));
  }, []);

  // Fetch on mount (and whenever `load` identity changes) using the same
  // handler the "Retry" button reuses.
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() =>
    requests.filter(r => {
      const q = `${r.applicationNumber} ${r.employeeName} ${r.employeeCode}`.toLowerCase();
      const matchSearch = q.includes(query.toLowerCase());
      const matchStatus = filter === "ALL" || r.status === filter;
      const created = r.submittedAt ? new Date(r.submittedAt) : null;
      const matchFrom = !dateFrom || (created !== null && created >= new Date(dateFrom));
      const matchTo   = !dateTo   || (created !== null && created <= new Date(dateTo + "T23:59:59"));
      return matchSearch && matchStatus && matchFrom && matchTo;
    }),
    [requests, query, filter, dateFrom, dateTo]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: requests.length };
    requests.forEach(r => { m[r.status] = (m[r.status] ?? 0) + 1; });
    return m;
  }, [requests]);

  const canReview = selected && REVIEWABLE.has(selected.status);
  const openRequest = (request: LoanApplication) => {
    setRemarks("");
    setSelected(request);
    setHistory([]);
    void salaryRequestService.getHistory(request.id).then(setHistory).catch(() => {});
  };

  const reviewableOnPage = paginated.filter(r => REVIEWABLE.has(r.status));
  const allPageSelected  = reviewableOnPage.length > 0 && reviewableOnPage.every(r => selectedIds.has(r.id));

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        reviewableOnPage.forEach(r => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        reviewableOnPage.forEach(r => next.add(r.id));
        return next;
      });
    }
  };

  // ── single-request actions ──────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!selected) return;
    setAction("APPROVE");
    try {
      await salaryRequestService.approveRequest(selected.id);
      load();
      toast.success("Sent for admin review", selected.applicationNumber);
      setSelected(null);
    } catch (err) {
      const msg = isForbidden(err)
        ? "You don't have permission to approve this request."
        : getApiErrorMessage(err);
      toast.error("Approval failed", msg);
    } finally { setAction(null); }
  };

  const handleReject = async () => {
    if (!selected || !remarks.trim()) return;
    setAction("REJECT");
    try {
      await salaryRequestService.rejectRequest(selected.id, remarks.trim());
      load();
      toast.success("Request rejected", selected.applicationNumber);
      setSelected(null);
      setRemarks("");
    } catch (err) {
      const msg = isForbidden(err)
        ? "You don't have permission to reject this request."
        : getApiErrorMessage(err);
      toast.error("Rejection failed", msg);
    } finally { setAction(null); }
  };

  // ── bulk actions ─────────────────────────────────────────────────────────────
  const MAX_BULK = 50;

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (ids.length > MAX_BULK) {
      toast.error("Too many selected", `Bulk actions are limited to ${MAX_BULK} requests at a time.`);
      return;
    }
    setBulkLoading(true);
    try {
      const result = await salaryRequestService.bulkAction("APPROVE", ids);
      const s = result.succeeded.length;
      const f = result.failed.length;
      if (s > 0) toast.success(`${s} request${s > 1 ? "s" : ""} sent for admin review`, f > 0 ? `${f} failed` : undefined);
      else        toast.error("Bulk approval failed", "No requests were approved");
      load();
    } catch (err) {
      toast.error("Bulk approval failed", getApiErrorMessage(err));
    } finally { setBulkLoading(false); }
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length || !bulkRemarks.trim()) return;
    if (ids.length > MAX_BULK) {
      toast.error("Too many selected", `Bulk actions are limited to ${MAX_BULK} requests at a time.`);
      return;
    }
    setBulkLoading(true);
    try {
      const result = await salaryRequestService.bulkAction("REJECT", ids, bulkRemarks.trim());
      const s = result.succeeded.length;
      const f = result.failed.length;
      if (s > 0) toast.success(`${s} request${s > 1 ? "s" : ""} rejected`, f > 0 ? `${f} failed` : undefined);
      else        toast.error("Bulk rejection failed", "No requests were rejected");
      setBulkRejectOpen(false);
      setBulkRemarks("");
      load();
    } catch (err) {
      toast.error("Bulk rejection failed", getApiErrorMessage(err));
    } finally { setBulkLoading(false); }
  };

  const hasBulkSelection = selectedIds.size > 0;

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Loan Applications</h1>
          <p className="mt-1.5 text-sm text-ink-3">Approve eligible applications and send them to MobPae admin for final review.</p>
        </div>
        <Button
          variant="secondary" size="md" icon={<Download size={14} />}
          onClick={() => exportToCsv(filtered.map(r => ({ ApplicationNumber: r.applicationNumber, Employee: r.employeeName, EmployeeCode: r.employeeCode, RequestedAmount: r.requestedAmount, EmployerApprovedAmount: r.employerApprovedAmount ?? "", Status: r.status, Date: r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "" })), `loan-applications-${Date.now()}`)}
        >
          Export CSV
        </Button>
      </div>

      {/* Search + date filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative max-w-[280px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
          <input
            value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, code, ID…" aria-label="Search loan applications"
            className="h-9 w-full rounded-lg border border-edge bg-surface pl-9 pr-3 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-ink-4" />
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            aria-label="From date"
            className="h-[34px] rounded-lg border border-edge bg-surface px-2.5 text-xs text-ink-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
          <span className="text-xs text-ink-4">–</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            aria-label="To date"
            className="h-[34px] rounded-lg border border-edge bg-surface px-2.5 text-xs text-ink-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }} aria-label="Clear date filter"
              className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-surface-muted text-ink-3">
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
            className={`flex h-[30px] items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
              filter === f.value ? "border border-ink bg-ink text-white" : "border border-edge bg-surface text-ink-3 hover:bg-surface-raised"
            }`}>
            {f.label}
            {counts[f.value] !== undefined && (
              <span className={`text-2xs font-bold ${filter === f.value ? "text-white/50" : "text-ink-4"}`}>{counts[f.value]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {hasBulkSelection && (
        <div className="flex items-center gap-3 rounded-xl bg-ink px-4 py-2.5 text-white">
          <span className="text-sm font-medium">{selectedIds.size} selected{totalPages > 1 ? " (this page)" : ""}</span>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-white/60 hover:text-white/80">Clear</button>
          <div className="flex-1" />
          {bulkRejectOpen ? (
            <div className="flex max-w-[380px] flex-1 items-center gap-2">
              <input autoFocus value={bulkRemarks} onChange={e => setBulkRemarks(e.target.value)} placeholder="Rejection remarks (required)…"
                aria-label="Bulk rejection remarks"
                className="h-[34px] flex-1 rounded-lg border border-white/20 bg-white/10 px-3 text-xs text-white outline-none placeholder:text-white/40" />
              <button onClick={handleBulkReject} disabled={bulkLoading || !bulkRemarks.trim()}
                className="h-[34px] rounded-lg bg-danger px-3.5 text-xs font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50">
                {bulkLoading ? "Rejecting…" : "Confirm Reject"}
              </button>
              <button onClick={() => { setBulkRejectOpen(false); setBulkRemarks(""); }} aria-label="Cancel bulk rejection"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-lg text-white/60 hover:text-white/80">
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setConfirmBulkApprove(true)} disabled={bulkLoading}
                className="flex h-[34px] items-center gap-1.5 rounded-lg bg-brand px-3.5 text-xs font-semibold text-white transition-opacity disabled:opacity-50">
                <CheckCheck size={13} />{bulkLoading ? "Approving…" : `Approve ${selectedIds.size}`}
              </button>
              <button onClick={() => setBulkRejectOpen(true)} disabled={bulkLoading}
                className="flex h-[34px] items-center gap-1.5 rounded-lg bg-danger px-3.5 text-xs font-semibold text-white transition-opacity disabled:opacity-50">
                <Ban size={13} />Reject {selectedIds.size}
              </button>
            </>
          )}
        </div>
      )}

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
        {loadError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-danger">Failed to load loan applications</p>
            <p className="mt-1 text-xs text-ink-3">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={load} className="mt-4">Retry</Button>
          </div>
        ) : loading ? (
          <div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3.5 border-b border-edge-2 px-5 py-3.5 last:border-0">
                <div className="h-3.5 w-3.5 animate-pulse rounded bg-surface-muted" />
                <div className="h-7 w-7 animate-pulse rounded-lg bg-surface-muted" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-2.5 w-28 animate-pulse rounded-md bg-surface-muted" />
                  <div className="h-2 w-16 animate-pulse rounded-md bg-surface-muted" />
                </div>
                <div className="h-2.5 w-16 animate-pulse rounded-md bg-surface-muted" />
                <div className="h-[18px] w-20 animate-pulse rounded-full bg-surface-muted" />
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <ClipboardList size={18} className="text-brand" />
            </div>
            <p className="text-sm font-medium text-ink-3">No requests found</p>
            <p className="mt-1 text-xs text-ink-4">Try changing your filter or search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-sm">
              <colgroup>
                <col style={{ width: "3%" }} /><col style={{ width: "13%" }} /><col style={{ width: "20%" }} />
                <col style={{ width: "13%" }} /><col style={{ width: "13%" }} /><col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} /><col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-edge-2 bg-surface-raised">
                  <th className="w-11 px-4 py-3.5">
                    <input type="checkbox" checked={allPageSelected} onChange={toggleAll} disabled={reviewableOnPage.length === 0}
                      title={allPageSelected ? "Deselect all reviewable requests on this page" : "Select all reviewable requests on this page"}
                      aria-label={allPageSelected ? "Deselect all reviewable requests on this page" : "Select all reviewable requests on this page"}
                      className="h-3.5 w-3.5 cursor-pointer rounded accent-brand disabled:cursor-not-allowed disabled:opacity-30" />
                  </th>
                  {["Application No.", "Employee", "Requested", "Approved", "Status", "Date", ""].map(h => (
                    <th key={h} className="whitespace-nowrap px-4 py-3.5 text-left text-2xs font-semibold uppercase tracking-[0.06em] text-ink-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => {
                  const isReviewable = REVIEWABLE.has(r.status);
                  const isChecked    = selectedIds.has(r.id);
                  const isSelected   = selected?.id === r.id;
                  return (
                    <tr key={r.id}
                      className={`cursor-pointer border-b border-edge-2 transition-colors last:border-0 ${
                        isSelected ? "bg-brand-soft/70" : isChecked ? "bg-brand-soft/40" : "hover:bg-surface-raised"
                      }`}>
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        {isReviewable ? (
                          <input type="checkbox" checked={isChecked} onChange={() => toggleRow(r.id)}
                            aria-label={`Select application ${r.applicationNumber}`}
                            className="h-3.5 w-3.5 cursor-pointer rounded accent-brand" />
                        ) : <div className="h-3.5 w-3.5" />}
                      </td>
                      <td className="px-4 py-4 font-semibold text-ink-2" onClick={() => openRequest(r)}>{r.applicationNumber}</td>
                      <td className="px-4 py-4" onClick={() => openRequest(r)}>
                        <p className="truncate text-[13.5px] font-medium text-ink">{r.employeeName}</p>
                        <p className="mt-0.5 font-mono text-2xs text-ink-4">{r.employeeCode}</p>
                      </td>
                      <td className="px-4 py-4 font-semibold tabular-nums text-ink" onClick={() => openRequest(r)}>{formatCurrency(r.requestedAmount)}</td>
                      <td className="px-4 py-4 tabular-nums text-ink-3" onClick={() => openRequest(r)}>
                        {r.employerApprovedAmount ? formatCurrency(r.employerApprovedAmount) : "—"}
                      </td>
                      <td className="px-4 py-4" onClick={() => openRequest(r)}><StatusPill status={r.status} /></td>
                      <td className="px-4 py-4 tabular-nums text-xs text-ink-4" onClick={() => openRequest(r)}>{formatDate(r.submittedAt)}</td>
                      <td className="px-4 py-4" onClick={() => openRequest(r)}>
                        <span className={`flex h-[30px] w-fit items-center gap-1 rounded-lg px-3.5 text-xs font-semibold ${
                          isSelected ? "bg-brand text-white" : "bg-brand-soft text-brand"
                        }`}>
                          Review <ChevronRight size={11} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-edge-2 bg-surface-raised px-5 py-3">
            <p className="text-xs text-ink-4">{filtered.length} {filtered.length === 1 ? "application" : "applications"}</p>
            <Pagination page={safePage} totalPages={totalPages} total={filtered.length} limit={PAGE_SIZE} onPage={setPage} />
          </div>
        )}
      </div>

      {/* Drawer */}
      <DrawerPanel open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div className="flex items-start justify-between border-b border-edge px-5 py-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xs font-semibold uppercase tracking-[0.07em] text-ink-4">{selected.applicationNumber}</span>
                  <StatusPill status={selected.status} />
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                    {selected.employeeName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-none text-ink">{selected.employeeName}</p>
                    <p className="mt-1 text-2xs text-ink-4">{selected.employeeCode}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close panel"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-edge text-ink-3 transition-colors hover:bg-surface-raised">
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                {[{ label: "Requested", val: formatCurrency(selected.requestedAmount) }, { label: "Employer Approved", val: selected.employerApprovedAmount ? formatCurrency(selected.employerApprovedAmount) : "—" }].map(({ label, val }) => (
                  <div key={label} className="rounded-xl border border-edge bg-canvas p-3.5">
                    <p className="mb-1 text-2xs text-ink-4">{label}</p>
                    <p className="text-lg font-bold tabular-nums text-ink">{val}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5 rounded-xl border border-edge bg-brand-soft p-3.5">
                <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-brand" />
                <div>
                  <p className="text-xs font-bold text-ink">Employer review context</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-3">
                    Your approval confirms salary and policy eligibility. MobPae admin still completes the final review and disbursal.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-edge bg-surface px-4">
                <InfoRow label="Purpose" value={selected.purpose || "—"} />
                <InfoRow label="Submitted" value={formatDate(selected.submittedAt)} />
                {selected.reviewerNote && <InfoRow label="Reviewer note" value={selected.reviewerNote} />}
              </div>

              {history.length > 0 && (
                <div>
                  <p className="mb-3 text-2xs font-semibold uppercase tracking-[0.07em] text-ink-3">Approval history</p>
                  <HistoryTimeline events={history} />
                </div>
              )}

              {canReview && (
                <div className="flex flex-col gap-3 rounded-xl border border-warning-bg bg-warning-soft p-4">
                  <p className="text-xs font-semibold text-warning">Review this application</p>
                  <div>
                    <label className="mb-1.5 block text-2xs font-medium text-ink-3">Rejection remarks (required to reject)</label>
                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Employee not eligible…" rows={3}
                      className="w-full resize-none rounded-lg border border-edge bg-surface px-3 py-2 text-xs text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleApprove} disabled={Boolean(action)}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand text-xs font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50">
                      <Check size={13} />{action === "APPROVE" ? "Approving…" : "Approve for review"}
                    </button>
                    <button onClick={handleReject} disabled={Boolean(action) || !remarks.trim()}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-danger text-xs font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40">
                      <X size={13} />{action === "REJECT" ? "Rejecting…" : "Reject"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DrawerPanel>

      <ConfirmModal
        open={confirmBulkApprove}
        title={`Approve ${selectedIds.size} request${selectedIds.size !== 1 ? "s" : ""}?`}
        description={`This will approve ${selectedIds.size} submitted loan application${selectedIds.size !== 1 ? "s" : ""} on behalf of your company. MobPae admin will still complete final review and disbursal.`}
        confirmLabel={`Approve ${selectedIds.size}`}
        confirmClass="bg-brand hover:bg-[#2048EE] text-white"
        loading={bulkLoading}
        onConfirm={() => { setConfirmBulkApprove(false); void handleBulkApprove(); }}
        onCancel={() => setConfirmBulkApprove(false)}
      />
    </div>
  );
}
