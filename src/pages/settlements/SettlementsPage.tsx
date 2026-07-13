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
  DRAFT:          { label: "Processing",     bg: "var(--color-surface-muted)", text: "var(--color-ink-3)" },
  GENERATED:      { label: "Awaiting Payment", bg: "var(--color-warning-bg)", text: "var(--color-warning)" },
  PARTIALLY_PAID: { label: "Partially Paid", bg: "var(--color-info-bg)", text: "var(--color-info)" },
  PAID:           { label: "Paid",           bg: "var(--color-success-bg)", text: "var(--color-success)" },
  OVERDUE:        { label: "Overdue",        bg: "var(--color-danger-bg)", text: "var(--color-danger)" },
  CANCELLED:      { label: "Cancelled",      bg: "var(--color-surface-muted)", text: "var(--color-ink-3)" },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status as SettlementStatus] ?? { label: status, bg: "var(--color-surface-muted)", text: "var(--color-ink-3)" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 500, background: c.bg, color: c.text }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.text, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

// ── cycle date formatting ─────────────────────────────────────────────────────

/** Format cycleDate (ISO DateTime, first of month) as "July 2026" */
function formatCycleDate(raw: string): string {
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  } catch {
    return raw;
  }
}

// ── filter chips ──────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: "ALL" | SettlementStatus }[] = [
  { label: "All",             value: "ALL"           },
  { label: "Awaiting Payment",value: "GENERATED"     },
  { label: "Overdue",         value: "OVERDUE"       },
  { label: "Partially Paid",  value: "PARTIALLY_PAID"},
  { label: "Paid",            value: "PAID"          },
];

// ── stat card ─────────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon, iconBg, iconColor, highlight, sub }: {
  label: string; value: React.ReactNode; icon: React.ReactNode;
  iconBg: string; iconColor: string; highlight?: boolean; sub?: string;
}) {
  return (
    <div style={{
      borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 12,
      background: highlight ? "var(--color-brand)" : "var(--color-surface)",
      border: highlight ? "1px solid #2048EE" : "1px solid #E5E7EB",
      boxShadow: highlight ? "0 4px 14px rgba(49,94,255,0.25)" : "0 1px 4px rgba(17,24,39,0.04)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: highlight ? "rgba(255,255,255,0.6)" : "#6B7280" }}>{label}</span>
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`} style={{ flexShrink: 0 }}>{icon}</div>
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, color: highlight ? "white" : "var(--color-ink)" }}>{value}</p>
        {sub && <p style={{ fontSize: 11, marginTop: 4, color: highlight ? "rgba(255,255,255,0.5)" : "#6B7280" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── settlement timeline ───────────────────────────────────────────────────────

function Timeline({ settlement }: { settlement: EmployerSettlement }) {
  const steps = [
    { label: "Settlement generated", date: settlement.generatedAt ?? settlement.createdAt, done: true, icon: "📋" },
    { label: "Payment due",          date: settlement.dueDate,      done: settlement.status !== "GENERATED" && settlement.status !== "DRAFT", icon: "📅" },
    { label: "Grace period ends",    date: settlement.gracePeriodEnd ?? null, done: settlement.status === "OVERDUE" || settlement.status === "PAID" || settlement.status === "PARTIALLY_PAID", icon: "⏳", skip: !settlement.gracePeriodEnd },
    { label: "Settled",              date: settlement.paidDate,     done: settlement.status === "PAID", icon: "✅" },
  ].filter(s => !s.skip);

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 border-2 ${step.done ? "border-brand bg-brand-soft" : "border-edge bg-white"}`}>
              {step.done ? <CheckCircle2 size={12} className="text-brand" /> : <span className="w-2 h-2 rounded-full bg-[#D4D5E0]" />}
            </div>
            {i < steps.length - 1 && <div className={`w-px flex-1 my-1 ${step.done ? "bg-[#C8C9FF]" : "bg-surface-muted"}`} style={{ minHeight: 20 }} />}
          </div>
          <div className="pb-4">
            <p className={`text-[12px] font-[500] leading-none ${step.done ? "text-ink" : "text-ink-3"}`}>{step.label}</p>
            {step.date && <p className="text-[11px] text-ink-3 mt-0.5">{formatDate(step.date)}</p>}
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
      <div className={`fixed inset-y-0 right-0 z-40 w-full max-w-[480px] bg-white border-l border-edge shadow-xl flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}>
        {children}
      </div>
    </>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F9FAFB] last:border-0">
      <span className="text-[12px] text-ink-3">{label}</span>
      <span className={`text-[12px] font-[500] ${accent ? "text-danger" : "text-ink"}`}>{value}</span>
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

  const isOverdue       = (s: EmployerSettlement) => s.status === "OVERDUE";
  const gracePeriodOver = summary ? summary.daysRemaining <= 0 : false;
  const riskGood        = summary?.riskStatus === "GOOD";

  if (error) {
    return (
      <div className="bg-white border border-red-100 rounded-xl px-6 py-14 text-center">
        <p className="text-[13px] font-[500] text-danger">Failed to load settlements</p>
        <p className="text-[12px] text-ink-3 mt-1">{error}</p>
        <button onClick={refresh} className="mt-4 h-8 px-4 text-[12px] font-[500] bg-white border border-edge rounded-lg hover:bg-surface-raised transition-colors text-ink-3">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-ink)", letterSpacing: "-0.025em", margin: 0 }}>Settlements</h1>
        <p style={{ fontSize: 13, color: "var(--color-ink-3)", marginTop: 4 }}>Track amounts owed to MobPae by salary cycle</p>
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
          iconBg="bg-amber-50" iconColor="text-warning"
          sub={summary?.nextDueDate ? `Due ${formatDate(summary.nextDueDate)}` : "awaiting payment"}
        />
        <SummaryCard
          label="Grace Period"
          value={summary ? (gracePeriodOver ? "Expired" : `${summary.daysRemaining}d left`) : "—"}
          icon={<CalendarClock size={14} />}
          iconBg={gracePeriodOver ? "bg-danger-soft" : "bg-sky-50"}
          iconColor={gracePeriodOver ? "text-danger" : "text-sky-600"}
          sub={gracePeriodOver
            ? `Late fee: ${formatCurrency(summary?.estimatedLateFeeAmount ?? 0)}`
            : `${summary?.gracePeriodDays ?? 0} day grace period`}
        />
        <SummaryCard
          label="Paid Settlements"
          value={summary?.paidSettlements ?? 0}
          icon={<CheckCircle2 size={14} />}
          iconBg="bg-brand-soft" iconColor="text-brand"
          sub="settled with MobPae"
        />
      </div>

      {/* Grace period / late fee warning */}
      {summary && summary.outstandingAmount > 0 && (
        gracePeriodOver ? (
          <div className="bg-danger-soft border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={15} className="text-danger mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-[600] text-red-700">Grace period has expired</p>
              <p className="text-[12px] text-danger mt-0.5">
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
              <span className="inline-flex items-center gap-1 text-[11px] font-[600] text-[#2048EE] bg-brand-soft border border-[#C8C9FF] px-2 py-0.5 rounded-full flex-shrink-0">
                <ShieldCheck size={11} /> Good standing
              </span>
            )}
          </div>
        )
      )}

      {/* Business flow info */}
      <div className="bg-brand-soft/60 border border-edge rounded-xl px-4 py-3 flex items-start gap-3">
        <Landmark size={15} className="text-brand mt-0.5 flex-shrink-0" />
        <p className="text-[12px] text-[#2048EE] leading-relaxed">
          Settlements represent the salary deductions your company owes to MobPae. Once MobPae confirms payment, linked salary deductions are marked recovered automatically.
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
                : "bg-white border border-edge text-ink-3 hover:border-edge"
            }`}
          >
            {f.label}
            {counts[f.value] !== undefined && (
              <span className={`text-[11px] font-[700] ${filter === f.value ? "text-white/60" : "text-ink-3"}`}>
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
                <div className="w-7 h-7 rounded-lg bg-surface-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-28 bg-surface-muted rounded animate-pulse" />
                  <div className="h-2 w-20 bg-surface-muted rounded animate-pulse" />
                </div>
                <div className="h-2.5 w-20 bg-surface-muted rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-surface-muted rounded animate-pulse" />
                <div className="h-4 w-16 bg-surface-muted rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center mb-3 mx-auto">
              <CreditCard size={18} className="text-ink-3" />
            </div>
            {settlements.length === 0 ? (
              <>
                <p className="text-[13px] font-[500] text-ink-3">No settlements yet</p>
                <p className="text-[12px] text-ink-4 mt-1 max-w-xs mx-auto">Settlements appear here once MobPae processes your employees' salary deductions at the end of each payroll cycle.</p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-[500] text-ink-3">No {filter === "ALL" ? "" : FILTERS.find(f => f.value === filter)?.label.toLowerCase() + " "}settlements found</p>
                <p className="text-[12px] text-ink-4 mt-1">Try selecting a different status filter above.</p>
              </>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-raised)", borderBottom: "1px solid var(--color-edge-2)" }}>
                  {["Settlement No.", "Salary Cycle", "Total Amount", "Outstanding", "Late Fee", "Due Date", "Grace Period", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "var(--color-ink-4)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
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
                      style={{ borderBottom: "1px solid #F9FAFB", background: isSelected ? "#EEF2FF4D" : overdue ? "#FFF1F14D" : "transparent", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--color-surface-raised)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? "#EEF2FF4D" : overdue ? "#FFF1F14D" : "transparent"; }}
                    >
                      <td style={{ padding: "16px 20px", fontSize: 12, fontFamily: "ui-monospace, monospace", color: "var(--color-ink-2)", verticalAlign: "middle" }}>{s.settlementNumber || "—"}</td>
                      <td style={{ padding: "16px 20px", fontSize: 13.5, fontWeight: 600, color: "var(--color-ink)", verticalAlign: "middle" }}>{formatCycleDate(s.cycleDate)}</td>
                      <td style={{ padding: "16px 20px", fontSize: 13.5, fontWeight: 700, color: "var(--color-ink)", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>{formatCurrency(s.totalAmount)}</td>
                      <td style={{ padding: "16px 20px", fontSize: 13.5, fontWeight: 600, color: s.outstandingAmount > 0 ? "var(--color-danger)" : "var(--color-brand)", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>
                        {s.outstandingAmount > 0 ? formatCurrency(s.outstandingAmount) : "No dues"}
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 13.5, color: "var(--color-ink-3)", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>
                        {s.lateFeeAmount > 0 ? formatCurrency(s.lateFeeAmount) : "—"}
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: overdue ? 600 : 400, color: overdue ? "var(--color-danger)" : "var(--color-ink-3)", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>
                        {formatDate(s.dueDate)}
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--color-ink-3)", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>
                        {s.gracePeriodEnd ? formatDate(s.gracePeriodEnd) : "—"}
                      </td>
                      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}><StatusPill status={s.status} /></td>
                      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                        <button style={{ height: 30, padding: "0 14px", background: isSelected ? "var(--color-brand)" : "var(--color-brand-soft)", color: isSelected ? "white" : "var(--color-brand)", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
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
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-edge-2)", background: "var(--color-surface-raised)" }}>
            <p style={{ fontSize: 12, color: "var(--color-ink-4)", margin: 0 }}>{filtered.length} {filtered.length === 1 ? "settlement" : "settlements"}</p>
          </div>
        )}
      </div>

      {/* Drawer */}
      <DrawerPanel open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-edge">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusPill status={selected.status} />
                    {selected.settlementNumber && (
                      <span className="text-[11px] font-[500] text-ink-3 bg-surface-muted px-2 py-0.5 rounded font-mono">
                        {selected.settlementNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-[16px] font-[700] text-ink leading-tight">
                    {formatCycleDate(selected.cycleDate)}
                  </p>
                  <p className="text-[12px] text-ink-3 mt-0.5">Settlement period</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-edge text-ink-3 hover:text-ink-3 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Overdue warning */}
              {selected.status === "OVERDUE" && (
                <div className="bg-danger-soft border border-red-100 rounded-xl p-3.5 flex items-start gap-3">
                  <AlertTriangle size={14} className="text-danger mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[12px] font-[600] text-red-700">Payment overdue</p>
                    <p className="text-[11px] text-danger mt-0.5 leading-relaxed">
                      This settlement is past its due date. Late fees may apply. Please remit payment immediately.
                    </p>
                  </div>
                </div>
              )}

              {/* Amount breakdown */}
              <div>
                <p className="text-[11px] font-[600] text-ink-3 uppercase tracking-[0.07em] mb-2">Amount Breakdown</p>
                <div className="bg-white border border-edge rounded-xl px-4 py-1">
                  <InfoRow label="Principal amount"   value={formatCurrency(selected.principalAmount)} />
                  <InfoRow label="Interest amount"    value={formatCurrency(selected.interestAmount)} />
                  {selected.processingFeeAmount > 0 && (
                    <InfoRow label="Processing fee"   value={formatCurrency(selected.processingFeeAmount)} />
                  )}
                  {selected.gstAmount > 0 && (
                    <InfoRow label="GST"              value={formatCurrency(selected.gstAmount)} />
                  )}
                  {selected.lateFeeAmount > 0 && (
                    <InfoRow label="Late fee"         value={formatCurrency(selected.lateFeeAmount)} accent />
                  )}
                  <div className="flex items-center justify-between py-3 border-t border-edge mt-1">
                    <span className="text-[12px] font-[600] text-ink">Total amount</span>
                    <span className="text-[14px] font-[700] text-ink tabular-nums">{formatCurrency(selected.totalAmount)}</span>
                  </div>
                  {selected.outstandingAmount > 0 && (
                    <div className="flex items-center justify-between py-2.5 border-t border-red-100">
                      <span className="text-[12px] font-[600] text-danger">Outstanding</span>
                      <span className="text-[14px] font-[700] text-danger tabular-nums">{formatCurrency(selected.outstandingAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div>
                <p className="text-[11px] font-[600] text-ink-3 uppercase tracking-[0.07em] mb-2">Key Dates</p>
                <div className="bg-white border border-edge rounded-xl px-4 py-1">
                  <InfoRow label="Due date"         value={formatDate(selected.dueDate)} accent={isOverdue(selected)} />
                  {selected.gracePeriodEnd && (
                    <InfoRow label="Grace period ends" value={formatDate(selected.gracePeriodEnd)} />
                  )}
                  {selected.paidDate && (
                    <InfoRow label="Paid on"          value={formatDate(selected.paidDate)} />
                  )}
                  {selected.generatedAt && (
                    <InfoRow label="Generated"        value={formatDate(selected.generatedAt)} />
                  )}
                  {selected.employeeCount > 0 && (
                    <InfoRow label="Employees"        value={`${selected.employeeCount}`} />
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-[11px] font-[600] text-ink-3 uppercase tracking-[0.07em] mb-3">Status timeline</p>
                <Timeline settlement={selected} />
              </div>

              {/* Notes */}
              {selected.notes && (
                <div>
                  <p className="text-[11px] font-[600] text-ink-3 uppercase tracking-[0.07em] mb-2">Notes</p>
                  <div className="bg-surface-raised border border-edge rounded-xl px-4 py-3">
                    <p className="text-[12px] text-ink-3 leading-relaxed">{selected.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-edge space-y-3">
              {/* Send Report button — always visible */}
              <button
                onClick={() => void handleSendReport()}
                disabled={sendingReport}
                className="w-full h-8 rounded-md border border-edge text-[12px] font-[500] text-ink-3 hover:bg-surface-raised flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
              >
                {sendingReport
                  ? <Loader2 size={12} className="animate-spin" />
                  : <FileText size={12} />}
                {sendingReport ? "Sending…" : "Send Report via Email"}
              </button>

              {/* Payment guidance panel — only when outstanding */}
              {selected.status !== "PAID" && selected.status !== "CANCELLED" && (
                <div className="bg-brand-soft border border-edge rounded-xl px-4 py-3.5 flex items-start gap-3">
                  <Info size={15} className="text-brand mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-[600] text-[#2048EE] mb-1">Payment guidance</p>
                    <p className="text-[12px] text-[#2048EE] leading-relaxed">
                      Remit{" "}
                      <strong>
                        {formatCurrency(
                          gracePeriodOver && summary
                            ? summary.amountPayableAfterGracePeriod
                            : (selected.outstandingAmount || selected.totalAmount)
                        )}
                      </strong>{" "}
                      to MobPae via bank transfer or your agreed payment method.
                      Once received, your MobPae account manager will mark this settlement as paid and linked salary deductions as recovered.
                    </p>
                    {gracePeriodOver && summary && (
                      <p className="text-[11px] text-danger mt-1.5 font-[500]">
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
