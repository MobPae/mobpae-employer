import { Calendar, Check, ChevronRight, Download, Search, X, CheckCheck, Ban, ShieldCheck } from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Pagination } from "../../components/ui/Pagination";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

const PAGE_SIZE = 15;
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage, isForbidden } from "../../services/api-errors";
import { salaryRequestService } from "../../services/salary-request.service";
import type { LoanApplication, LoanApplicationStatus } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

// ── status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:             { label: "Pending",          bg: "var(--color-warning-bg)", text: "var(--color-warning)" },
  SUBMITTED:           { label: "Submitted",         bg: "var(--color-warning-bg)", text: "var(--color-warning)" },
  UNDER_REVIEW:        { label: "Under review",      bg: "var(--color-warning-bg)", text: "var(--color-warning)" },
  EMPLOYER_APPROVED:           { label: "Approved by you",      bg: "var(--color-info-bg)", text: "var(--color-info)" },
  EMPLOYER_REJECTED:           { label: "Rejected by you",      bg: "var(--color-danger-bg)", text: "var(--color-danger)" },
  AWAITING_MEMBERSHIP_PAYMENT: { label: "Platform fee pending",  bg: "var(--color-warning-bg)", text: "var(--color-warning)" },
  AWAITING_PLATFORM_FEE_PAYMENT: { label: "Platform fee pending",  bg: "var(--color-warning-bg)", text: "var(--color-warning)" },
  APPROVED:                    { label: "Admin approved",        bg: "var(--color-info-bg)", text: "var(--color-info)" },
  REJECTED:            { label: "Rejected",          bg: "var(--color-danger-bg)", text: "var(--color-danger)" },
  READY_FOR_DISBURSAL: { label: "Ready to disburse", bg: "var(--color-success-bg)", text: "var(--color-success)" },
  DISBURSED:           { label: "Disbursed",         bg: "var(--color-success-bg)", text: "var(--color-success)" },
  REPAYMENT_SCHEDULED: { label: "Repaying",          bg: "var(--color-warning-bg)", text: "var(--color-warning)" },
  REPAID:              { label: "Repaid",             bg: "var(--color-success-soft)", text: "var(--color-success-dark)" },
  CANCELLED:           { label: "Cancelled",          bg: "var(--color-surface-muted)", text: "var(--color-ink-3)" },
  EXPIRED:             { label: "Expired",            bg: "var(--color-surface-muted)", text: "var(--color-ink-3)" },
};

// Employer can only review SUBMITTED requests
const REVIEWABLE = new Set(["SUBMITTED"]);

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? { label: status, bg: "var(--color-surface-muted)", text: "var(--color-ink-3)" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 500, background: c.bg, color: c.text }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.text, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

// ── filter chips ──────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: "ALL" | LoanApplicationStatus }[] = [
  { label: "All",             value: "ALL"                },
  { label: "Submitted",       value: "SUBMITTED"          },
  { label: "Approved by you",   value: "EMPLOYER_APPROVED"           },
  { label: "Rejected by you",   value: "EMPLOYER_REJECTED"           },
  { label: "Platform fee", value: "AWAITING_PLATFORM_FEE_PAYMENT" },
  { label: "Disbursed",         value: "DISBURSED"                   },
  { label: "Repaying",        value: "REPAYMENT_SCHEDULED"},
  { label: "Repaid",          value: "REPAID"             },
];

// ── drawer ────────────────────────────────────────────────────────────────────

function DrawerPanel({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />}
      <div className={`fixed inset-y-0 right-0 z-40 w-[440px] bg-white flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ borderLeft: "1px solid #E5E7EB", boxShadow: "0 8px 40px rgba(17,24,39,0.10)" }}>
        {children}
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F9FAFB" }}>
      <span style={{ fontSize: 12, color: "var(--color-ink-3)" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-ink)" }}>{value}</span>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function SalaryRequestsPage() {
  const toast = useToast();
  const [requests,  setRequests]  = useState<LoanApplication[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected,  setSelected]  = useState<LoanApplication | null>(null);
  const [query,     setQuery]     = useState("");
  const [filter,    setFilter]    = useState<"ALL" | LoanApplicationStatus>("ALL");
  const [page,      setPage]      = useState(1);
  const [action,    setAction]    = useState<"APPROVE" | "REJECT" | null>(null);
  const [remarks,   setRemarks]   = useState("");

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

  // counts per status for chips
  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: requests.length };
    requests.forEach(r => { m[r.status] = (m[r.status] ?? 0) + 1; });
    return m;
  }, [requests]);

  const canReview = selected && REVIEWABLE.has(selected.status);
  const openRequest = (request: LoanApplication) => {
    setRemarks("");
    setSelected(request);
  };

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

  
  
  
  
  
  const T1  = "var(--color-ink)";
  const T2  = "var(--color-ink-3)";
  const T3  = "var(--color-ink-4)";
  const P   = "var(--color-brand)";
  const PS  = "var(--color-brand-soft)";
  const BDR = "1px solid var(--color-edge)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "Inter, ui-sans-serif, sans-serif" }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T1, letterSpacing: "-0.025em", margin: 0 }}>Loan Applications</h1>
          <p style={{ fontSize: 14, color: T2, marginTop: 6 }}>Approve eligible applications and send them to MobPae admin for final review.</p>
        </div>
        <button
          onClick={() => exportToCsv(filtered.map(r => ({ ApplicationNumber: r.applicationNumber, Employee: r.employeeName, EmployeeCode: r.employeeCode, RequestedAmount: r.requestedAmount, EmployerApprovedAmount: r.employerApprovedAmount ?? "", Status: r.status, Date: r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "" })), `loan-applications-${Date.now()}`)}
          style={{ height: 36, padding: "0 14px", display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, color: T2, background: "white", border: BDR, borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
          <Download size={14} />Export CSV
        </button>
      </div>

      {/* Search + date filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T3 }} />
          <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Search by name, code, ID…"
            style={{ width: "100%", height: 38, paddingLeft: 36, paddingRight: 12, fontSize: 13, background: "white", border: BDR, borderRadius: 8, color: T1, outline: "none", fontFamily: "inherit" }}
            onFocus={e => (e.target.style.borderColor = P)} onBlur={e => (e.target.style.borderColor = "var(--color-edge)")} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={13} color={T3} />
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            style={{ height: 34, padding: "0 10px", fontSize: 12, background: "white", border: BDR, borderRadius: 8, outline: "none", color: T2, fontFamily: "inherit" }} />
          <span style={{ fontSize: 12, color: T3 }}>–</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            style={{ height: 34, padding: "0 10px", fontSize: 12, background: "white", border: BDR, borderRadius: 8, outline: "none", color: T2, fontFamily: "inherit" }} />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
              style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--color-surface-muted)", border: "none", cursor: "pointer", color: T2 }}>
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
            style={{ height: 30, padding: "0 12px", borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "all 0.15s",
              background: filter === f.value ? T1 : "white", color: filter === f.value ? "white" : T2, border: filter === f.value ? `1px solid ${T1}` : BDR }}>
            {f.label}
            {counts[f.value] !== undefined && (
              <span style={{ fontSize: 11, fontWeight: 700, color: filter === f.value ? "rgba(255,255,255,0.5)" : T3 }}>{counts[f.value]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {hasBulkSelection && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: T1, borderRadius: 12, color: "white" }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{selectedIds.size} selected</span>
          <button onClick={() => setSelectedIds(new Set())} style={{ fontSize: 12, color: T3, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
          <div style={{ flex: 1 }} />
          {bulkRejectOpen ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, maxWidth: 380 }}>
              <input autoFocus value={bulkRemarks} onChange={e => setBulkRemarks(e.target.value)} placeholder="Rejection remarks (required)…"
                style={{ flex: 1, height: 34, padding: "0 12px", fontSize: 12, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "white", outline: "none", fontFamily: "inherit" }} />
              <button onClick={handleBulkReject} disabled={bulkLoading || !bulkRemarks.trim()}
                style={{ height: 34, padding: "0 14px", fontSize: 12, fontWeight: 600, background: "var(--color-danger)", color: "white", border: "none", borderRadius: 8, cursor: bulkLoading || !bulkRemarks.trim() ? "not-allowed" : "pointer", opacity: bulkLoading || !bulkRemarks.trim() ? 0.5 : 1, fontFamily: "inherit" }}>
                {bulkLoading ? "Rejecting…" : "Confirm Reject"}
              </button>
              <button onClick={() => { setBulkRejectOpen(false); setBulkRemarks(""); }}
                style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: T3 }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setConfirmBulkApprove(true)} disabled={bulkLoading}
                style={{ height: 34, padding: "0 14px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, background: P, color: "white", border: "none", borderRadius: 8, cursor: "pointer", opacity: bulkLoading ? 0.5 : 1, fontFamily: "inherit" }}>
                <CheckCheck size={13} />{bulkLoading ? "Approving…" : `Approve ${selectedIds.size}`}
              </button>
              <button onClick={() => setBulkRejectOpen(true)} disabled={bulkLoading}
                style={{ height: 34, padding: "0 14px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, background: "var(--color-danger)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", opacity: bulkLoading ? 0.5 : 1, fontFamily: "inherit" }}>
                <Ban size={13} />Reject {selectedIds.size}
              </button>
            </>
          )}
        </div>
      )}

      {/* Table card */}
      <div style={{ background: "white", borderRadius: 16, border: BDR, boxShadow: "0 1px 4px rgba(17,24,39,0.04)", overflow: "hidden" }}>
        {loadError ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-danger)" }}>Failed to load loan applications</p>
            <p style={{ fontSize: 12, color: T2, marginTop: 4 }}>{loadError}</p>
            <button onClick={load} style={{ marginTop: 16, height: 34, padding: "0 16px", fontSize: 12, fontWeight: 500, background: "white", border: BDR, borderRadius: 8, cursor: "pointer", color: T2, fontFamily: "inherit" }}>Retry</button>
          </div>
        ) : loading ? (
          <div>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < 7 ? "1px solid #F9FAFB" : "none" }}>
                <div className="animate-pulse" style={{ width: 14, height: 14, borderRadius: 3, background: "var(--color-surface-muted)" }} />
                <div className="animate-pulse" style={{ width: 28, height: 28, borderRadius: 8, background: "var(--color-surface-muted)" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <div className="animate-pulse" style={{ height: 10, width: 112, background: "var(--color-surface-muted)", borderRadius: 6 }} />
                  <div className="animate-pulse" style={{ height: 8, width: 64, background: "var(--color-surface-muted)", borderRadius: 6 }} />
                </div>
                <div className="animate-pulse" style={{ height: 10, width: 64, background: "var(--color-surface-muted)", borderRadius: 6 }} />
                <div className="animate-pulse" style={{ height: 18, width: 80, background: "var(--color-surface-muted)", borderRadius: 999 }} />
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div style={{ padding: "56px 0", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: PS, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <span style={{ fontSize: 18 }}>📋</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: T2 }}>No requests found</p>
            <p style={{ fontSize: 12, color: T3, marginTop: 4 }}>Try changing your filter or search</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: 13 }}>
              <colgroup>
                <col style={{ width: "3%" }} /><col style={{ width: "13%" }} /><col style={{ width: "20%" }} />
                <col style={{ width: "13%" }} /><col style={{ width: "13%" }} /><col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} /><col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "var(--color-surface-raised)", borderBottom: "1px solid var(--color-edge-2)" }}>
                  <th style={{ padding: "14px 16px", width: 44 }}>
                    <input type="checkbox" checked={allPageSelected} onChange={toggleAll} disabled={reviewableOnPage.length === 0}
                      style={{ width: 14, height: 14, accentColor: P, cursor: reviewableOnPage.length === 0 ? "not-allowed" : "pointer", opacity: reviewableOnPage.length === 0 ? 0.3 : 1 }} />
                  </th>
                  {["Application No.", "Employee", "Requested", "Approved", "Status", "Date", ""].map(h => (
                    <th key={h} style={{ padding: "14px 20px 14px 0", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => {
                  const isReviewable = REVIEWABLE.has(r.status);
                  const isChecked    = selectedIds.has(r.id);
                  const isSelected   = selected?.id === r.id;
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F9FAFB", background: isSelected ? `${PS}80` : isChecked ? `${PS}60` : "transparent", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => { if (!isSelected && !isChecked) (e.currentTarget as HTMLElement).style.background = "var(--color-surface-raised)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? `${PS}80` : isChecked ? `${PS}60` : "transparent"; }}>
                      <td style={{ padding: "16px 16px", verticalAlign: "middle" }} onClick={e => e.stopPropagation()}>
                        {isReviewable ? (
                          <input type="checkbox" checked={isChecked} onChange={() => toggleRow(r.id)} style={{ width: 14, height: 14, accentColor: P, cursor: "pointer" }} />
                        ) : <div style={{ width: 14, height: 14 }} />}
                      </td>
                      <td style={{ padding: "16px 20px 16px 0", fontWeight: 600, color: T2, fontSize: 13.5, verticalAlign: "middle" }} onClick={() => openRequest(r)}>{r.applicationNumber}</td>
                      <td style={{ padding: "16px 20px 16px 0", verticalAlign: "middle" }} onClick={() => openRequest(r)}>
                        <p style={{ fontSize: 13.5, fontWeight: 500, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{r.employeeName}</p>
                        <p style={{ fontSize: 11.5, color: T3, margin: "2px 0 0", fontFamily: "ui-monospace, monospace" }}>{r.employeeCode}</p>
                      </td>
                      <td style={{ padding: "16px 20px 16px 0", fontWeight: 600, color: T1, fontVariantNumeric: "tabular-nums", fontSize: 13.5, verticalAlign: "middle" }} onClick={() => openRequest(r)}>{formatCurrency(r.requestedAmount)}</td>
                      <td style={{ padding: "16px 20px 16px 0", color: T2, fontVariantNumeric: "tabular-nums", fontSize: 13.5, verticalAlign: "middle" }} onClick={() => openRequest(r)}>
                        {r.employerApprovedAmount ? formatCurrency(r.employerApprovedAmount) : "—"}
                      </td>
                      <td style={{ padding: "16px 20px 16px 0", verticalAlign: "middle" }} onClick={() => openRequest(r)}><StatusPill status={r.status} /></td>
                      <td style={{ padding: "16px 20px 16px 0", color: T3, fontVariantNumeric: "tabular-nums", fontSize: 13, verticalAlign: "middle" }} onClick={() => openRequest(r)}>{formatDate(r.submittedAt)}</td>
                      <td style={{ padding: "16px 20px 16px 0", verticalAlign: "middle" }} onClick={() => openRequest(r)}>
                        <button style={{ height: 30, padding: "0 14px", background: isSelected ? P : PS, color: isSelected ? "white" : P, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                          Review <ChevronRight size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Footer strip */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-edge-2)", background: "var(--color-surface-raised)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 12, color: T3, margin: 0 }}>{filtered.length} {filtered.length === 1 ? "application" : "applications"}</p>
            <Pagination page={safePage} totalPages={totalPages} total={filtered.length} limit={PAGE_SIZE} onPage={setPage} />
          </div>
        )}
      </div>

      {/* Drawer */}
      <DrawerPanel open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div style={{ padding: "18px 20px 16px", borderBottom: BDR, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.07em" }}>{selected.applicationNumber}</span>
                  <StatusPill status={selected.status} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: PS, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: P, flexShrink: 0 }}>
                    {selected.employeeName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: T1, lineHeight: 1 }}>{selected.employeeName}</p>
                    <p style={{ fontSize: 11, color: T3, marginTop: 3 }}>{selected.employeeCode}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: BDR, background: "transparent", cursor: "pointer", color: T2 }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[{ label: "Requested", val: formatCurrency(selected.requestedAmount) }, { label: "Employer Approved", val: selected.employerApprovedAmount ? formatCurrency(selected.employerApprovedAmount) : "—" }].map(({ label, val }) => (
                  <div key={label} style={{ background: "var(--color-canvas)", border: BDR, borderRadius: 12, padding: 14 }}>
                    <p style={{ fontSize: 11, color: T3, marginBottom: 4 }}>{label}</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: T1, fontVariantNumeric: "tabular-nums" }}>{val}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: "var(--color-brand-soft)", border: "1px solid #E5E7EB", borderRadius: 12, padding: 14, display: "flex", gap: 10 }}>
                <ShieldCheck size={16} color={P} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T1, margin: 0 }}>Employer review context</p>
                  <p style={{ fontSize: 12, color: T2, lineHeight: 1.55, marginTop: 4 }}>
                    Your approval confirms salary and policy eligibility. MobPae admin still completes the final review and disbursal.
                  </p>
                </div>
              </div>

              <div style={{ background: "white", border: BDR, borderRadius: 12, padding: "2px 16px" }}>
                <InfoRow label="Purpose" value={selected.purpose || "—"} />
                <InfoRow label="Submitted" value={formatDate(selected.submittedAt)} />
                {selected.reviewerNote && <InfoRow label="Reviewer note" value={selected.reviewerNote} />}
              </div>

              {canReview && (
                <div style={{ background: "var(--color-warning-soft)", border: "1px solid var(--color-warning-bg)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-warning)", margin: 0 }}>Review this application</p>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: T2, marginBottom: 6 }}>Rejection remarks (required to reject)</label>
                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Employee not eligible…" rows={3}
                      style={{ width: "100%", padding: "8px 12px", fontSize: 12, background: "white", border: BDR, borderRadius: 8, color: T1, outline: "none", resize: "none", fontFamily: "inherit" }}
                      onFocus={e => (e.target.style.borderColor = P)} onBlur={e => (e.target.style.borderColor = "var(--color-edge)")} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button onClick={handleApprove} disabled={Boolean(action)}
                      style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 8, background: P, color: "white", border: "none", fontSize: 12, fontWeight: 600, cursor: Boolean(action) ? "not-allowed" : "pointer", opacity: Boolean(action) ? 0.5 : 1, fontFamily: "inherit" }}>
                      <Check size={13} />{action === "APPROVE" ? "Approving…" : "Approve for review"}
                    </button>
                    <button onClick={handleReject} disabled={Boolean(action) || !remarks.trim()}
                      style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 8, background: "var(--color-danger)", color: "white", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: Boolean(action) || !remarks.trim() ? 0.4 : 1, fontFamily: "inherit" }}>
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
