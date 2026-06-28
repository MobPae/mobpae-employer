import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  Info,
  Landmark,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { useToast } from "../../hooks/useToast";
import { settlementService } from "../../services/settlement.service";
import type { EmployerSettlement, SettlementStatus } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { getApiErrorMessage } from "../../services/api-errors";

// ── status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  NO_DUES:        { label: "N/A",            bg: "#F3F4F6", text: "#6B7280" },
  PENDING:        { label: "Pending",        bg: "#FEF3C7", text: "#D97706" },
  PARTIALLY_PAID: { label: "Partially Paid", bg: "#DBEAFE", text: "#1D4ED8" },
  PAID:           { label: "Paid",           bg: "#DCFCE7", text: "#16A34A" },
  OVERDUE:        { label: "Overdue",        bg: "#FEE2E2", text: "#DC2626" },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status as SettlementStatus] ?? { label: status, bg: "#F3F4F6", text: "#6B7280" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 500, background: c.bg, color: c.text }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.text, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

// ── salary cycle formatting ───────────────────────────────────────────────────

function formatSalaryCycle(raw: string): string {
  if (!raw) return "—";
  // "2024-01" → "January 2024"
  const match = raw.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const [, year, month] = match;
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }
  return raw;
}

// ── filter chips ──────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: "ALL" | SettlementStatus }[] = [
  { label: "All",           value: "ALL"           },
  { label: "Pending",       value: "PENDING"       },
  { label: "Overdue",       value: "OVERDUE"       },
  { label: "Partially Paid",value: "PARTIALLY_PAID"},
  { label: "Paid",          value: "PAID"          },
];

// ── stat card ─────────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon, iconBg, iconColor, highlight, sub }: {
  label: string; value: React.ReactNode; icon: React.ReactNode;
  iconBg: string; iconColor: string; highlight?: boolean; sub?: string;
}) {
  return (
    <div style={{
      borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 12,
      background: highlight ? "#6C4CFF" : "white",
      border: highlight ? "1px solid #5B34FF" : "1px solid #E5E7EB",
      boxShadow: highlight ? "0 4px 14px rgba(108,76,255,0.25)" : "0 1px 4px rgba(17,24,39,0.04)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: highlight ? "rgba(255,255,255,0.6)" : "#6B7280" }}>{label}</span>
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`} style={{ flexShrink: 0 }}>{icon}</div>
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, color: highlight ? "white" : "#111827" }}>{value}</p>
        {sub && <p style={{ fontSize: 11, marginTop: 4, color: highlight ? "rgba(255,255,255,0.5)" : "#6B7280" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── settlement timeline ───────────────────────────────────────────────────────

function Timeline({ settlement }: { settlement: EmployerSettlement }) {
  const steps = [
    { label: "Settlement created",  date: settlement.createdAt,  done: true,                               icon: "📋" },
    { label: "Payment due",         date: settlement.dueDate,    done: settlement.status !== "PENDING",    icon: "📅" },
    { label: "Grace period ends",   date: settlement.gracePeriodEnd ?? null, done: settlement.status === "OVERDUE" || settlement.status === "PAID" || settlement.status === "PARTIALLY_PAID", icon: "⏳", skip: !settlement.gracePeriodEnd },
    { label: "Settled",             date: settlement.paidDate,   done: settlement.status === "PAID",       icon: "✅" },
  ].filter(s => !s.skip);

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 border-2 ${step.done ? "border-[#6C4CFF] bg-[#F3F0FF]" : "border-[#E5E7EB] bg-white"}`}>
              {step.done ? <CheckCircle2 size={12} className="text-[#6C4CFF]" /> : <span className="w-2 h-2 rounded-full bg-[#D4D5E0]" />}
            </div>
            {i < steps.length - 1 && <div className={`w-px flex-1 my-1 ${step.done ? "bg-[#C8C9FF]" : "bg-[#F3F4F6]"}`} style={{ minHeight: 20 }} />}
          </div>
          <div className="pb-4">
            <p className={`text-[12px] font-[500] leading-none ${step.done ? "text-[#111827]" : "text-[#6B7280]"}`}>{step.label}</p>
            {step.date && <p className="text-[11px] text-[#6B7280] mt-0.5">{formatDate(step.date)}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── drawer ────────────────────────────────────────────────────────────────────

function DrawerPanel({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />}
      <div className={`fixed inset-y-0 right-0 z-40 w-[460px] bg-white border-l border-[#E5E7EB] shadow-xl flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}>
        {children}
      </div>
    </>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F9FAFB] last:border-0">
      <span className="text-[12px] text-[#6B7280]">{label}</span>
      <span className={`text-[12px] font-[500] ${accent ? "text-red-600" : "text-[#111827]"}`}>{value}</span>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function SettlementsPage() {
  const toast = useToast();
  const [filter,        setFilter]        = useState<"ALL" | SettlementStatus>("ALL");
  const [selected,      setSelected]      = useState<EmployerSettlement | null>(null);
  const [sendingReport, setSendingReport] = useState(false);

  const handleSendReport = async () => {
    if (!selected) return;
    setSendingReport(true);
    try {
      await settlementService.sendReport(selected.id);
      toast.success("Report sent", "Settlement report emailed to your account.");
    } catch (err) {
      toast.error("Failed to send report", getApiErrorMessage(err));
    } finally {
      setSendingReport(false);
    }
  };

  const { data: summaryRaw } =
    useFetch(() => settlementService.getSettlementSummary(), []);
  const { data: settlementsRaw, loading, error, refresh } =
    useFetch(() => settlementService.getSettlements(), []);

  const summary     = summaryRaw    ?? null;
  const settlements = settlementsRaw ?? [];

  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: settlements.length };
    settlements.forEach(s => { m[s.status] = (m[s.status] ?? 0) + 1; });
    return m;
  }, [settlements]);

  const filtered = useMemo(() =>
    settlements.filter(s => filter === "ALL" || s.status === filter),
    [settlements, filter]
  );

  const isOverdue      = (s: EmployerSettlement) => s.status === "OVERDUE";
  const gracePeriodOver = summary ? summary.daysRemaining <= 0 : false;
  const riskGood        = summary?.riskStatus === "GOOD";

  if (error) {
    return (
      <div className="bg-white border border-red-100 rounded-xl px-6 py-14 text-center">
        <p className="text-[13px] font-[500] text-red-600">Failed to load settlements</p>
        <p className="text-[12px] text-[#6B7280] mt-1">{error}</p>
        <button onClick={refresh} className="mt-4 h-8 px-4 text-[12px] font-[500] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F7F7FB] transition-colors text-[#6B7280]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", letterSpacing: "-0.025em", margin: 0 }}>Settlements</h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Track amounts owed to MobPae by salary cycle</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <SummaryCard
          label="Outstanding Amount"
          value={formatCurrency(summary?.outstandingAmount ?? 0)}
          icon={<CircleDollarSign size={14} />}
          iconBg="bg-white/10" iconColor="text-white/80"
          highlight
          sub="total owed to MobPae"
        />
        <SummaryCard
          label="Pending Settlements"
          value={summary?.pendingSettlements ?? 0}
          icon={<Clock3 size={14} />}
          iconBg="bg-amber-50" iconColor="text-amber-600"
          sub={summary?.nextDueDate ? `Due ${formatDate(summary.nextDueDate)}` : "awaiting payment"}
        />
        <SummaryCard
          label="Grace Period"
          value={summary ? (gracePeriodOver ? "Expired" : `${summary.daysRemaining}d left`) : "—"}
          icon={<CalendarClock size={14} />}
          iconBg={gracePeriodOver ? "bg-red-50" : "bg-sky-50"}
          iconColor={gracePeriodOver ? "text-red-600" : "text-sky-600"}
          sub={gracePeriodOver
            ? `Late fee: ${formatCurrency(summary?.estimatedLateFeeAmount ?? 0)}`
            : `${summary?.gracePeriodDays ?? 0} day grace period`}
        />
        <SummaryCard
          label="Paid Settlements"
          value={summary?.paidSettlements ?? 0}
          icon={<CheckCircle2 size={14} />}
          iconBg="bg-[#F3F0FF]" iconColor="text-[#6C4CFF]"
          sub="settled with MobPae"
        />
      </div>

      {/* Grace period / late fee warning */}
      {summary && summary.outstandingAmount > 0 && (
        gracePeriodOver ? (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-[600] text-red-700">Grace period has expired</p>
              <p className="text-[12px] text-red-600 mt-0.5">
                A late fee of {summary.lateFeePercentage}% applies.
                Amount payable is now{" "}
                <strong>{formatCurrency(summary.amountPayableAfterGracePeriod)}</strong>
                {" "}(includes {formatCurrency(summary.estimatedLateFeeAmount)} late fee).
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-sky-50/70 border border-sky-100 rounded-xl px-4 py-3 flex items-start gap-3">
            <CalendarClock size={15} className="text-sky-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-[600] text-sky-800">
                Grace period active — {summary.daysRemaining} day{summary.daysRemaining !== 1 ? "s" : ""} remaining
              </p>
              <p className="text-[12px] text-sky-600 mt-0.5">
                Pay {formatCurrency(summary.outstandingAmount)} before the grace period ends to avoid a{" "}
                {summary.lateFeePercentage}% late fee ({formatCurrency(summary.estimatedLateFeeAmount)}).
                Amount after grace period: <strong>{formatCurrency(summary.amountPayableAfterGracePeriod)}</strong>.
              </p>
            </div>
            {riskGood && (
              <span className="inline-flex items-center gap-1 text-[11px] font-[600] text-[#5B34FF] bg-[#F3F0FF] border border-[#C8C9FF] px-2 py-0.5 rounded-full flex-shrink-0">
                <ShieldCheck size={11} /> Good standing
              </span>
            )}
          </div>
        )
      )}

      {/* Business flow info */}
      <div className="bg-[#F3F0FF]/60 border border-[#E5E7EB] rounded-xl px-4 py-3 flex items-start gap-3">
        <Landmark size={15} className="text-[#6C4CFF] mt-0.5 flex-shrink-0" />
        <p className="text-[12px] text-[#5B34FF] leading-relaxed">
          Settlements represent the recoveries your company owes to MobPae. Once MobPae confirms payment, linked recoveries are marked recovered automatically.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`h-7 px-3 rounded-full text-[12px] font-[500] transition-colors flex items-center gap-1.5 ${
              filter === f.value
                ? "bg-[#111827] text-white"
                : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#E5E7EB]"
            }`}
          >
            {f.label}
            {counts[f.value] !== undefined && (
              <span className={`text-[11px] font-[700] ${filter === f.value ? "text-white/60" : "text-[#6B7280]"}`}>
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(17,24,39,0.04)" }}>
        {loading ? (
          <div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#F9FAFB] last:border-0">
                <div className="w-7 h-7 rounded-lg bg-[#F3F4F6] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-28 bg-[#F3F4F6] rounded animate-pulse" />
                  <div className="h-2 w-20 bg-[#F3F4F6] rounded animate-pulse" />
                </div>
                <div className="h-2.5 w-20 bg-[#F3F4F6] rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-[#F3F4F6] rounded animate-pulse" />
                <div className="h-4 w-16 bg-[#F3F4F6] rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center mb-3 mx-auto">
              <CreditCard size={18} className="text-[#6B7280]" />
            </div>
            <p className="text-[13px] font-[500] text-[#6B7280]">No settlements found</p>
            <p className="text-[12px] text-[#6B7280] mt-1">Settlements appear here once salary-cycle recoveries are due to MobPae</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                  {["Salary Cycle", "Total Amount", "Outstanding", "Late Fee", "Due Date", "Grace Period", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const isSelected = selected?.id === s.id;
                  const overdue = isOverdue(s);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelected(s)}
                      style={{ borderBottom: "1px solid #F9FAFB", background: isSelected ? "#F3F0FF4D" : overdue ? "#FFF1F14D" : "transparent", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#FAFAFC"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? "#F3F0FF4D" : overdue ? "#FFF1F14D" : "transparent"; }}
                    >
                      <td style={{ padding: "16px 20px", fontSize: 13.5, fontWeight: 600, color: "#111827", verticalAlign: "middle" }}>{formatSalaryCycle(s.payrollMonth)}</td>
                      <td style={{ padding: "16px 20px", fontSize: 13.5, fontWeight: 700, color: "#111827", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>{formatCurrency(s.totalAmount)}</td>
                      <td style={{ padding: "16px 20px", fontSize: 13.5, fontWeight: 600, color: s.outstandingAmount > 0 ? "#DC2626" : "#6C4CFF", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>
                        {s.outstandingAmount > 0 ? formatCurrency(s.outstandingAmount) : "No dues"}
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 13.5, color: "#6B7280", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>
                        {s.lateFeeAmount > 0 ? formatCurrency(s.lateFeeAmount) : "—"}
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: overdue ? 600 : 400, color: overdue ? "#DC2626" : "#6B7280", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>
                        {formatDate(s.dueDate)}
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 13, color: "#6B7280", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>
                        {s.gracePeriodEnd ? formatDate(s.gracePeriodEnd) : "—"}
                      </td>
                      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}><StatusPill status={s.status} /></td>
                      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                        <button style={{ height: 30, padding: "0 14px", background: isSelected ? "#6C4CFF" : "#F3F0FF", color: isSelected ? "white" : "#6C4CFF", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                          Details <ChevronRight size={11} />
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
          <div style={{ padding: "12px 20px", borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>{filtered.length} {filtered.length === 1 ? "settlement" : "settlements"}</p>
          </div>
        )}
      </div>

      {/* Drawer */}
      <DrawerPanel open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-[#E5E7EB]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusPill status={selected.status} />
                    {selected.referenceNumber && (
                      <span className="text-[11px] font-[500] text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">
                        Ref: {selected.referenceNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-[16px] font-[700] text-[#111827] leading-tight">
                    {formatSalaryCycle(selected.payrollMonth)}
                  </p>
                  <p className="text-[12px] text-[#6B7280] mt-0.5">Settlement period</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#6B7280] transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Overdue warning */}
              {selected.status === "OVERDUE" && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-start gap-3">
                  <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[12px] font-[600] text-red-700">Payment overdue</p>
                    <p className="text-[11px] text-red-500 mt-0.5 leading-relaxed">
                      This settlement is past its due date. Late fees may apply. Please remit payment immediately.
                    </p>
                  </div>
                </div>
              )}

              {/* Amount breakdown */}
              <div>
                <p className="text-[11px] font-[600] text-[#6B7280] uppercase tracking-[0.07em] mb-2">Amount Breakdown</p>
                <div className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-1">
                  <InfoRow label="Principal amount"   value={formatCurrency(selected.principalAmount)} />
                  <InfoRow label="Interest amount"    value={formatCurrency(selected.interestAmount)} />
                  {selected.lateFeeAmount > 0 && (
                    <InfoRow label="Late fee"         value={formatCurrency(selected.lateFeeAmount)} accent />
                  )}
                  <div className="flex items-center justify-between py-3 border-t border-[#E5E7EB] mt-1">
                    <span className="text-[12px] font-[600] text-[#111827]">Total amount</span>
                    <span className="text-[14px] font-[700] text-[#111827] tabular-nums">{formatCurrency(selected.totalAmount)}</span>
                  </div>
                  {selected.outstandingAmount > 0 && (
                    <div className="flex items-center justify-between py-2.5 border-t border-red-100">
                      <span className="text-[12px] font-[600] text-red-600">Outstanding</span>
                      <span className="text-[14px] font-[700] text-red-600 tabular-nums">{formatCurrency(selected.outstandingAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div>
                <p className="text-[11px] font-[600] text-[#6B7280] uppercase tracking-[0.07em] mb-2">Key Dates</p>
                <div className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-1">
                  <InfoRow label="Due date"         value={formatDate(selected.dueDate)} accent={isOverdue(selected)} />
                  {selected.gracePeriodEnd && (
                    <InfoRow label="Grace period ends" value={formatDate(selected.gracePeriodEnd)} />
                  )}
                  {selected.paidDate && (
                    <InfoRow label="Paid on"          value={formatDate(selected.paidDate)} />
                  )}
                  <InfoRow label="Created"            value={formatDate(selected.createdAt)} />
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-[11px] font-[600] text-[#6B7280] uppercase tracking-[0.07em] mb-3">Status timeline</p>
                <Timeline settlement={selected} />
              </div>

              {/* Notes */}
              {selected.notes && (
                <div>
                  <p className="text-[11px] font-[600] text-[#6B7280] uppercase tracking-[0.07em] mb-2">Notes</p>
                  <div className="bg-[#F7F7FB] border border-[#E5E7EB] rounded-xl px-4 py-3">
                    <p className="text-[12px] text-[#6B7280] leading-relaxed">{selected.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#E5E7EB] space-y-3">
              {/* Send Report button — always visible */}
              <button
                onClick={() => void handleSendReport()}
                disabled={sendingReport}
                className="w-full h-8 rounded-md border border-[#E5E7EB] text-[12px] font-[500] text-[#6B7280] hover:bg-[#F7F7FB] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
              >
                {sendingReport
                  ? <Loader2 size={12} className="animate-spin" />
                  : <FileText size={12} />}
                {sendingReport ? "Sending…" : "Send Report via Email"}
              </button>

              {/* Payment guidance panel — only when outstanding */}
              {selected.status !== "PAID" && (
                <div className="bg-[#F3F0FF] border border-[#E5E7EB] rounded-xl px-4 py-3.5 flex items-start gap-3">
                  <Info size={15} className="text-[#6C4CFF] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-[600] text-[#5B34FF] mb-1">Payment guidance</p>
                    <p className="text-[12px] text-[#5B34FF] leading-relaxed">
                      Remit{" "}
                      <strong>
                        {formatCurrency(
                          gracePeriodOver && summary
                            ? summary.amountPayableAfterGracePeriod
                            : (selected.outstandingAmount || selected.totalAmount)
                        )}
                      </strong>{" "}
                      to MobPae via bank transfer or your agreed payment method.
                      Once received, your MobPae account manager will mark this settlement as paid and linked recoveries as recovered.
                    </p>
                    {gracePeriodOver && summary && (
                      <p className="text-[11px] text-red-600 mt-1.5 font-[500]">
                        Includes {summary.lateFeePercentage}% late fee ({formatCurrency(summary.estimatedLateFeeAmount)})
                      </p>
                    )}
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
