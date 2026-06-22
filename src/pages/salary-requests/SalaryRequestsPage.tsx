import { Calendar, Check, ChevronRight, Download, Search, X, CheckCheck, Ban } from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Pagination } from "../../components/ui/Pagination";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

const PAGE_SIZE = 15;
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage, isForbidden } from "../../services/api-errors";
import { salaryRequestService } from "../../services/salary-request.service";
import type { SalaryRequest, SalaryRequestStatus } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

// ── status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING:             { label: "Pending", dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  SUBMITTED:           { label: "Submitted", dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  UNDER_REVIEW:        { label: "Under review", dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  EMPLOYER_APPROVED:   { label: "Approved by you", dot: "bg-[#378ADD]", text: "text-[#185FA5]", bg: "bg-[#E7F1FC]" },
  EMPLOYER_REJECTED:   { label: "Rejected by you", dot: "bg-red-400", text: "text-red-600", bg: "bg-red-50" },
  APPROVED:            { label: "Admin approved", dot: "bg-[#378ADD]", text: "text-[#185FA5]", bg: "bg-[#E7F1FC]" },
  REJECTED:            { label: "Rejected", dot: "bg-red-400", text: "text-red-600", bg: "bg-red-50" },
  READY_FOR_DISBURSAL: { label: "Ready to disburse", dot: "bg-lime-500", text: "text-lime-700", bg: "bg-lime-50" },
  DISBURSED:           { label: "Disbursed", dot: "bg-[#4E8A18]", text: "text-[#3B6D11]", bg: "bg-[#EBF6E3]" },
  REPAYMENT_SCHEDULED: { label: "Repaying", dot: "bg-[#D45F18]", text: "text-[#9A4910]", bg: "bg-[#FEF1E7]" },
  REPAID:              { label: "Repaid", dot: "bg-[#287A68]", text: "text-[#1A5944]", bg: "bg-[#D4EDE5]" },
};

// Employer can only review SUBMITTED requests
const REVIEWABLE = new Set(["SUBMITTED"]);

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? { label: status, bg: "bg-[#F0F0F8]", text: "text-[#62657A]", dot: "bg-[#B7B9C7]" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-[500] ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ── filter chips ──────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: "ALL" | SalaryRequestStatus }[] = [
  { label: "All",             value: "ALL"                },
  { label: "Submitted",       value: "SUBMITTED"          },
  { label: "Approved by you", value: "EMPLOYER_APPROVED"  },
  { label: "Rejected by you", value: "EMPLOYER_REJECTED"  },
  { label: "Disbursed",       value: "DISBURSED"          },
  { label: "Repaying",        value: "REPAYMENT_SCHEDULED"},
  { label: "Repaid",          value: "REPAID"             },
];

// ── drawer ────────────────────────────────────────────────────────────────────

function DrawerPanel({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />}
      <div className={`fixed inset-y-0 right-0 z-40 w-[440px] bg-white border-l border-[#E4E4EF] shadow-xl flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}>
        {children}
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F0F0F8] last:border-0">
      <span className="text-[12px] text-[#62657A]">{label}</span>
      <span className="text-[12px] font-[500] text-[#191A2E]">{value}</span>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function SalaryRequestsPage() {
  const toast = useToast();
  const [requests,       setRequests]       = useState<SalaryRequest[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [loadError,      setLoadError]      = useState<string | null>(null);
  const [selected,       setSelected]       = useState<SalaryRequest | null>(null);
  const [query,          setQuery]          = useState("");
  const [filter,         setFilter]         = useState<"ALL" | SalaryRequestStatus>("ALL");
  const [page,           setPage]           = useState(1);
  const [action,         setAction]         = useState<"APPROVE" | "REJECT" | null>(null);
  const [remarks,        setRemarks]        = useState("");
  const [approvedAmount, setApprovedAmount] = useState<string>("");

  // bulk selection
  const [selectedIds,         setSelectedIds]         = useState<Set<string>>(new Set());
  const [bulkLoading,         setBulkLoading]         = useState(false);
  const [bulkRejectOpen,      setBulkRejectOpen]      = useState(false);
  const [bulkRemarks,         setBulkRemarks]         = useState("");
  const [confirmBulkApprove,  setConfirmBulkApprove]  = useState(false);
  const [dateFrom,            setDateFrom]            = useState("");
  const [dateTo,              setDateTo]              = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    salaryRequestService.getSalaryRequests()
      .then(data => { setRequests(data); setSelectedIds(new Set()); })
      .catch(err => { setLoadError(getApiErrorMessage(err)); toast.error("Failed to load", getApiErrorMessage(err)); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() =>
    requests.filter(r => {
      const q = `${r.requestId} ${r.employeeName} ${r.employeeCode}`.toLowerCase();
      const matchSearch = q.includes(query.toLowerCase());
      const matchStatus = filter === "ALL" || r.status === filter;
      const created = r.createdDate ? new Date(r.createdDate) : null;
      const matchFrom = !dateFrom || (created !== null && created >= new Date(dateFrom));
      const matchTo   = !dateTo   || (created !== null && created <= new Date(dateTo + "T23:59:59"));
      return matchSearch && matchStatus && matchFrom && matchTo;
    }),
    [requests, query, filter, dateFrom, dateTo]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // counts per status for chips
  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: requests.length };
    requests.forEach(r => { m[r.status] = (m[r.status] ?? 0) + 1; });
    return m;
  }, [requests]);

  const canReview = selected && REVIEWABLE.has(selected.status);

  // reviewable rows on current page (for select-all)
  const reviewableOnPage = paginated.filter(r => REVIEWABLE.has(r.status));
  const allPageSelected  = reviewableOnPage.length > 0 && reviewableOnPage.every(r => selectedIds.has(r.id));

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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
      const parsedAmount = parseFloat(approvedAmount);
      const amount = !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : undefined;
      await salaryRequestService.approveRequest(selected.id, amount);
      load();
      toast.success("Request approved", selected.requestId);
      setSelected(null);
      setApprovedAmount("");
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
      toast.success("Request rejected", selected.requestId);
      setSelected(null);
      setRemarks("");
      setApprovedAmount("");
    } catch (err) {
      const msg = isForbidden(err)
        ? "You don't have permission to reject this request."
        : getApiErrorMessage(err);
      toast.error("Rejection failed", msg);
    } finally { setAction(null); }
  };

  // ── bulk actions ─────────────────────────────────────────────────────────────
  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkLoading(true);
    try {
      const result = await salaryRequestService.bulkAction("APPROVE", ids);
      const s = result.succeeded.length;
      const f = result.failed.length;
      if (s > 0) toast.success(`${s} request${s > 1 ? "s" : ""} approved`, f > 0 ? `${f} failed` : undefined);
      else        toast.error("Bulk approval failed", "No requests were approved");
      load();
    } catch (err) {
      toast.error("Bulk approval failed", getApiErrorMessage(err));
    } finally { setBulkLoading(false); }
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length || !bulkRemarks.trim()) return;
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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[280px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#62657A]" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, code, ID…"
            className="w-full h-9 pl-8 pr-3 text-[13px] bg-white border border-[#E4E4EF] rounded-lg focus:outline-none focus:border-[#7679FF] focus:ring-2 focus:ring-[#7679FF]/10 transition placeholder-[#B7B9C7] text-[#191A2E]"
          />
        </div>
        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-[#62657A]" />
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="h-8 px-2 text-[11px] bg-white border border-[#E4E4EF] rounded-md outline-none focus:border-[#7679FF] transition-colors text-[#62657A]"
          />
          <span className="text-[11px] text-[#62657A]">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="h-8 px-2 text-[11px] bg-white border border-[#E4E4EF] rounded-md outline-none focus:border-[#7679FF] transition-colors text-[#62657A]"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-[#F0F0F8] text-[#62657A] hover:bg-[#E4E4EF] transition-colors"
            >
              <X size={10} />
            </button>
          )}
        </div>
        <button
          onClick={() => exportToCsv(filtered.map(r => ({
            RequestID:       r.requestId,
            Employee:        r.employeeName,
            EmployeeCode:    r.employeeCode,
            RequestedAmount: r.requestedAmount,
            ApprovedAmount:  r.approvedAmount ?? "",
            Status:          r.status,
            Date:            r.createdDate ? new Date(r.createdDate).toLocaleDateString() : "",
          })), `salary-requests-${Date.now()}`)}
          className="h-8 px-3 flex items-center gap-1.5 text-[12px] font-[500] text-[#62657A] bg-white border border-[#E4E4EF] rounded-lg hover:bg-[#F7F7FB] transition-colors flex-shrink-0"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`h-7 px-3 rounded-full text-[12px] font-[500] transition-colors flex items-center gap-1.5 ${
              filter === f.value
                ? "bg-[#191A2E] text-white"
                : "bg-white border border-[#E4E4EF] text-[#62657A] hover:border-[#E4E4EF]"
            }`}
          >
            {f.label}
            {counts[f.value] !== undefined && (
              <span className={`text-[11px] font-[700] ${filter === f.value ? "text-white/60" : "text-[#62657A]"}`}>
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {hasBulkSelection && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#191A2E] text-white rounded-xl">
          <span className="text-[12px] font-[500]">{selectedIds.size} selected</span>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-[11px] text-[#62657A] hover:text-white transition-colors"
          >
            Clear
          </button>
          <div className="flex-1" />
          {bulkRejectOpen ? (
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <input
                autoFocus
                value={bulkRemarks}
                onChange={e => setBulkRemarks(e.target.value)}
                placeholder="Rejection remarks (required)…"
                className="flex-1 h-8 px-3 text-[12px] bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#B7B9C7] focus:outline-none focus:border-white/40"
              />
              <button
                onClick={handleBulkReject}
                disabled={bulkLoading || !bulkRemarks.trim()}
                className="h-8 px-3 text-[12px] font-[600] bg-red-500 hover:bg-red-400 text-white rounded-lg disabled:opacity-40 transition-colors flex-shrink-0"
              >
                {bulkLoading ? "Rejecting…" : "Confirm Reject"}
              </button>
              <button
                onClick={() => { setBulkRejectOpen(false); setBulkRemarks(""); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#62657A] hover:text-white transition-colors flex-shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setConfirmBulkApprove(true)}
                disabled={bulkLoading}
                className="h-8 px-4 flex items-center gap-1.5 text-[12px] font-[600] bg-[#7679FF] hover:bg-[#9091FF] text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                <CheckCheck size={13} />
                {bulkLoading ? "Approving…" : `Approve ${selectedIds.size}`}
              </button>
              <button
                onClick={() => setBulkRejectOpen(true)}
                disabled={bulkLoading}
                className="h-8 px-4 flex items-center gap-1.5 text-[12px] font-[600] bg-red-500 hover:bg-red-400 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                <Ban size={13} />
                Reject {selectedIds.size}
              </button>
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#E4E4EF] rounded-xl overflow-hidden">
        {loadError ? (
          <div className="py-14 text-center">
            <p className="text-[13px] font-[500] text-red-600">Failed to load salary requests</p>
            <p className="text-[12px] text-[#62657A] mt-1">{loadError}</p>
            <button onClick={load} className="mt-4 h-8 px-4 text-[12px] font-[500] bg-white border border-[#E4E4EF] rounded-lg hover:bg-[#F7F7FB] transition-colors text-[#62657A]">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#F0F0F8] last:border-0">
                <div className="w-3.5 h-3.5 rounded bg-[#F0F0F8] animate-pulse flex-shrink-0" />
                <div className="w-7 h-7 rounded-lg bg-[#F0F0F8] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-28 bg-[#F0F0F8] rounded animate-pulse" />
                  <div className="h-2 w-16 bg-[#F0F0F8] rounded animate-pulse" />
                </div>
                <div className="h-2.5 w-16 bg-[#F0F0F8] rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-[#F0F0F8] rounded animate-pulse" />
                <div className="h-4 w-20 bg-[#F0F0F8] rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="py-14 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#F0F0F8] flex items-center justify-center mb-3 mx-auto">
              <span className="text-[#62657A] text-[18px]">📋</span>
            </div>
            <p className="text-[13px] font-[500] text-[#62657A]">No requests found</p>
            <p className="text-[12px] text-[#62657A] mt-1">Try changing your filter or search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-[12px]">
              <colgroup>
                <col style={{ width: "3%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-[#E4E4EF]">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleAll}
                      disabled={reviewableOnPage.length === 0}
                      className="w-3.5 h-3.5 rounded border-[#E4E4EF] accent-[#7679FF] cursor-pointer disabled:opacity-30"
                    />
                  </th>
                  {["Request ID", "Employee", "Requested", "Approved", "Status", "Date", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-[500] text-[#62657A]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F8]">
                {paginated.map(r => {
                  const isReviewable = REVIEWABLE.has(r.status);
                  const isChecked    = selectedIds.has(r.id);
                  return (
                    <tr
                      key={r.id}
                      className={`cursor-pointer hover:bg-[#F7F7FB]/60 transition-colors ${selected?.id === r.id ? "bg-[#ECEBFF]/30" : ""} ${isChecked ? "bg-[#ECEBFF]/40" : ""}`}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {isReviewable ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRow(r.id)}
                            className="w-3.5 h-3.5 rounded border-[#E4E4EF] accent-[#7679FF] cursor-pointer"
                          />
                        ) : (
                          <div className="w-3.5 h-3.5" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-[600] text-[#62657A]" onClick={() => { setRemarks(""); setSelected(r); }}>{r.requestId}</td>
                      <td className="px-4 py-3" onClick={() => { setRemarks(""); setSelected(r); }}>
                        <p className="font-[500] text-[#191A2E] truncate">{r.employeeName}</p>
                        <p className="text-[11px] text-[#62657A]">{r.employeeCode}</p>
                      </td>
                      <td className="px-4 py-3 font-[600] text-[#62657A] tabular-nums" onClick={() => { setRemarks(""); setSelected(r); }}>{formatCurrency(r.requestedAmount)}</td>
                      <td className="px-4 py-3 tabular-nums text-[#62657A]" onClick={() => { setRemarks(""); setSelected(r); }}>
                        {r.approvedAmount ? formatCurrency(r.approvedAmount) : <span className="text-[#62657A]">—</span>}
                      </td>
                      <td className="px-4 py-3" onClick={() => { setRemarks(""); setSelected(r); }}><StatusPill status={r.status} /></td>
                      <td className="px-4 py-3 text-[#62657A] tabular-nums" onClick={() => { setRemarks(""); setSelected(r); }}>{formatDate(r.createdDate)}</td>
                      <td className="px-4 py-3" onClick={() => { setRemarks(""); setSelected(r); }}>
                        <span className="flex items-center gap-1 text-[12px] font-[500] text-[#7679FF] hover:text-[#5659D9]">
                          Review <ChevronRight size={12} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        total={filtered.length}
        limit={PAGE_SIZE}
        onPage={setPage}
      />

      {/* Drawer */}
      <DrawerPanel open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <>
            {/* Drawer header */}
            <div className="px-5 pt-5 pb-4 border-b border-[#E4E4EF]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-[600] text-[#62657A] uppercase tracking-[0.07em]">{selected.requestId}</span>
                    <StatusPill status={selected.status} />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#F0F0F8] flex items-center justify-center text-[11px] font-[700] text-[#62657A] flex-shrink-0">
                      {selected.employeeName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[14px] font-[600] text-[#191A2E] leading-none">{selected.employeeName}</p>
                      <p className="text-[11px] text-[#62657A] mt-0.5">{selected.employeeCode}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E4E4EF] text-[#62657A] hover:text-[#62657A] transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F7F7FB] border border-[#E4E4EF] rounded-xl p-4">
                  <p className="text-[11px] text-[#62657A] mb-1">Requested</p>
                  <p className="text-[18px] font-[700] text-[#191A2E] tabular-nums">{formatCurrency(selected.requestedAmount)}</p>
                </div>
                <div className="bg-[#F7F7FB] border border-[#E4E4EF] rounded-xl p-4">
                  <p className="text-[11px] text-[#62657A] mb-1">Approved</p>
                  <p className="text-[18px] font-[700] text-[#191A2E] tabular-nums">
                    {selected.approvedAmount ? formatCurrency(selected.approvedAmount) : <span className="text-[#62657A] font-[400]">—</span>}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="bg-white border border-[#E4E4EF] rounded-xl px-4 py-1">
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

                  {/* Approved amount input */}
                  <div>
                    <label className="block text-[11px] font-[500] text-[#62657A] mb-1">
                      Approved amount <span className="text-[#62657A] font-[400]">(leave blank to approve full requested amount)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#62657A]">₹</span>
                      <input
                        type="number"
                        min={1}
                        max={parseFloat(selected.requestedAmount as unknown as string) || undefined}
                        value={approvedAmount}
                        onChange={e => setApprovedAmount(e.target.value)}
                        placeholder={String(selected.requestedAmount ?? "")}
                        className="w-full pl-6 pr-3 py-2 text-[12px] bg-white border border-[#E4E4EF] rounded-lg text-[#191A2E] placeholder-[#B7B9C7] focus:outline-none focus:border-[#7679FF] focus:ring-2 focus:ring-[#ECEBFF] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-[500] text-[#62657A] mb-1">Rejection remarks (required to reject)</label>
                    <textarea
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Employee not eligible…"
                      rows={3}
                      className="w-full px-3 py-2 text-[12px] bg-white border border-[#E4E4EF] rounded-lg text-[#191A2E] placeholder-[#B7B9C7] focus:outline-none focus:border-[#7679FF] focus:ring-2 focus:ring-[#7679FF]/10 resize-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleApprove}
                      disabled={Boolean(action)}
                      className="h-9 flex items-center justify-center gap-2 rounded-lg bg-[#7679FF] hover:bg-[#5659D9] text-white text-[12px] font-[600] disabled:opacity-50 transition-colors"
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

      <ConfirmModal
        open={confirmBulkApprove}
        title={`Approve ${selectedIds.size} request${selectedIds.size !== 1 ? "s" : ""}?`}
        description={`This will approve ${selectedIds.size} salary advance request${selectedIds.size !== 1 ? "s" : ""} on behalf of your company. Approved requests proceed to admin review and disbursal.`}
        confirmLabel={`Approve ${selectedIds.size}`}
        confirmClass="bg-[#7679FF] hover:bg-[#5659D9] text-white"
        loading={bulkLoading}
        onConfirm={() => { setConfirmBulkApprove(false); void handleBulkApprove(); }}
        onCancel={() => setConfirmBulkApprove(false)}
      />
    </div>
  );
}
