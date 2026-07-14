import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
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
import { Button } from "../../components/ui/Button";
import { exportToCsv } from "../../utils/exportCsv";

// ── status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT:          { label: "Processing",       bg: "bg-surface-muted", text: "text-ink-3",   dot: "bg-ink-3" },
  GENERATED:      { label: "Awaiting Payment",  bg: "bg-warning-bg",    text: "text-warning", dot: "bg-warning" },
  PARTIALLY_PAID: { label: "Partially Paid",    bg: "bg-info-bg",       text: "text-info",    dot: "bg-info" },
  PAID:           { label: "Paid",              bg: "bg-success-bg",    text: "text-success", dot: "bg-success" },
  OVERDUE:        { label: "Overdue",           bg: "bg-danger-bg",     text: "text-danger",  dot: "bg-danger" },
  CANCELLED:      { label: "Cancelled",         bg: "bg-surface-muted", text: "text-ink-3",   dot: "bg-ink-3" },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status as SettlementStatus] ?? { label: status, bg: "bg-surface-muted", text: "text-ink-3", dot: "bg-ink-4" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${c.dot}`} />
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
  { label: "All",              value: "ALL"            },
  { label: "Awaiting Payment", value: "GENERATED"      },
  { label: "Overdue",          value: "OVERDUE"        },
  { label: "Partially Paid",   value: "PARTIALLY_PAID" },
  { label: "Paid",             value: "PAID"           },
];

// ── stat card ─────────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon, iconBg, iconColor, highlight, sub }: {
  label: string; value: React.ReactNode; icon: React.ReactNode;
  iconBg: string; iconColor: string; highlight?: boolean; sub?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl p-4 ${
        highlight
          ? "border border-brand-hover bg-brand shadow-brand"
          : "border border-edge bg-surface shadow-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${highlight ? "text-white/60" : "text-ink-3"}`}>{label}</span>
        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>{icon}</div>
      </div>
      <div>
        <p className={`text-[22px] font-bold leading-none tracking-tight ${highlight ? "text-white" : "text-ink"}`}>{value}</p>
        {sub && <p className={`mt-1.5 text-2xs ${highlight ? "text-white/50" : "text-ink-3"}`}>{sub}</p>}
      </div>
    </div>
  );
}

// ── settlement timeline ───────────────────────────────────────────────────────

function Timeline({ settlement }: { settlement: EmployerSettlement }) {
  const steps = [
    { label: "Settlement generated", date: settlement.generatedAt ?? settlement.createdAt, done: true },
    { label: "Payment due",          date: settlement.dueDate,      done: settlement.status !== "GENERATED" && settlement.status !== "DRAFT" },
    { label: "Grace period ends",    date: settlement.gracePeriodEnd ?? null, done: settlement.status === "OVERDUE" || settlement.status === "PAID" || settlement.status === "PARTIALLY_PAID", skip: !settlement.gracePeriodEnd },
    { label: "Settled",              date: settlement.paidDate,     done: settlement.status === "PAID" },
  ].filter(s => !s.skip);

  return (
    <div>
      {steps.map((step, i) => (
        <div key={step.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${step.done ? "border-brand bg-brand-soft" : "border-edge bg-surface"}`}>
              {step.done ? <CheckCircle2 size={12} className="text-brand" /> : <span className="h-2 w-2 rounded-full bg-edge-strong" />}
            </div>
            {i < steps.length - 1 && <div className={`my-1 w-px flex-1 ${step.done ? "bg-brand-muted" : "bg-surface-muted"}`} style={{ minHeight: 20 }} />}
          </div>
          <div className="pb-4">
            <p className={`text-xs font-medium leading-none ${step.done ? "text-ink" : "text-ink-3"}`}>{step.label}</p>
            {step.date && <p className="mt-0.5 text-2xs text-ink-3">{formatDate(step.date)}</p>}
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
      <div className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-[480px] flex-col border-l border-edge bg-surface shadow-overlay transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}>
        {children}
      </div>
    </>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-edge-2 py-2.5 last:border-0">
      <span className="text-xs text-ink-3">{label}</span>
      <span className={`text-xs font-medium ${accent ? "text-danger" : "text-ink"}`}>{value}</span>
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
      <div className="rounded-2xl border border-danger-bg bg-surface px-6 py-14 text-center">
        <p className="text-sm font-medium text-danger">Failed to load settlements</p>
        <p className="mt-1 text-xs text-ink-3">{error}</p>
        <Button variant="secondary" size="sm" onClick={refresh} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Settlements</h1>
          <p className="mt-1.5 text-sm text-ink-3">Track amounts owed to MobPae by salary cycle</p>
        </div>
        <Button
          variant="secondary" size="md" icon={<Download size={14} />}
          onClick={() => exportToCsv(filtered.map(s => ({
            SettlementNumber: s.settlementNumber, SalaryCycle: formatCycleDate(s.cycleDate),
            TotalAmount: s.totalAmount, OutstandingAmount: s.outstandingAmount, LateFee: s.lateFeeAmount,
            DueDate: s.dueDate ? new Date(s.dueDate).toLocaleDateString() : "", Status: s.status,
          })), `settlements-${Date.now()}`)}
        >
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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
          iconBg="bg-warning-bg" iconColor="text-warning"
          sub={summary?.nextDueDate ? `Due ${formatDate(summary.nextDueDate)}` : "awaiting payment"}
        />
        <SummaryCard
          label="Grace Period"
          value={summary ? (gracePeriodOver ? "Expired" : `${summary.daysRemaining}d left`) : "—"}
          icon={<CalendarClock size={14} />}
          iconBg={gracePeriodOver ? "bg-danger-soft" : "bg-info-bg"}
          iconColor={gracePeriodOver ? "text-danger" : "text-info"}
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
          <div className="flex items-start gap-3 rounded-xl border border-danger-bg bg-danger-soft px-4 py-3">
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-danger" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-danger">Grace period has expired</p>
              <p className="mt-0.5 text-xs text-danger">
                A late fee of {summary.lateFeePercentage}% applies.
                Amount payable is now{" "}
                <strong>{formatCurrency(summary.amountPayableAfterGracePeriod)}</strong>
                {" "}(includes {formatCurrency(summary.estimatedLateFeeAmount)} late fee).
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-brand-muted bg-brand-soft/70 px-4 py-3">
            <CalendarClock size={15} className="mt-0.5 flex-shrink-0 text-info" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-info">
                Grace period active — {summary.daysRemaining} day{summary.daysRemaining !== 1 ? "s" : ""} remaining
              </p>
              <p className="mt-0.5 text-xs text-info">
                Pay {formatCurrency(summary.outstandingAmount)} before the grace period ends to avoid a{" "}
                {summary.lateFeePercentage}% late fee ({formatCurrency(summary.estimatedLateFeeAmount)}).
                Amount after grace period: <strong>{formatCurrency(summary.amountPayableAfterGracePeriod)}</strong>.
              </p>
            </div>
            {riskGood && (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-brand-muted bg-brand-soft px-2 py-0.5 text-2xs font-semibold text-info">
                <ShieldCheck size={11} /> Good standing
              </span>
            )}
          </div>
        )
      )}

      {/* Business flow info */}
      <div className="flex items-start gap-3 rounded-xl border border-edge bg-brand-soft/60 px-4 py-3">
        <Landmark size={15} className="mt-0.5 flex-shrink-0 text-brand" />
        <p className="text-xs leading-relaxed text-info">
          Settlements represent the salary deductions your company owes to MobPae. Once MobPae confirms payment, linked salary deductions are marked recovered automatically.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-ink text-white"
                : "border border-edge bg-surface text-ink-3 hover:border-edge-strong"
            }`}
          >
            {f.label}
            {counts[f.value] !== undefined && (
              <span className={`text-2xs font-bold ${filter === f.value ? "text-white/60" : "text-ink-3"}`}>
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
        {loading ? (
          <div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-edge-2 px-5 py-3.5 last:border-0">
                <div className="h-7 w-7 flex-shrink-0 animate-pulse rounded-lg bg-surface-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-28 animate-pulse rounded bg-surface-muted" />
                  <div className="h-2 w-20 animate-pulse rounded bg-surface-muted" />
                </div>
                <div className="h-2.5 w-20 animate-pulse rounded bg-surface-muted" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-surface-muted" />
                <div className="h-4 w-16 animate-pulse rounded-full bg-surface-muted" />
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted">
              <CreditCard size={18} className="text-ink-3" />
            </div>
            {settlements.length === 0 ? (
              <>
                <p className="text-sm font-medium text-ink-3">No settlements yet</p>
                <p className="mx-auto mt-1 max-w-xs text-xs text-ink-4">Settlements appear here once MobPae processes your employees' salary deductions at the end of each payroll cycle.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-ink-3">No {filter === "ALL" ? "" : FILTERS.find(f => f.value === filter)?.label.toLowerCase() + " "}settlements found</p>
                <p className="mt-1 text-xs text-ink-4">Try selecting a different status filter above.</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-edge-2 bg-surface-raised">
                  {["Settlement No.", "Salary Cycle", "Total Amount", "Outstanding", "Late Fee", "Due Date", "Grace Period", "Status", ""].map(h => (
                    <th key={h} className="whitespace-nowrap px-5 py-3.5 text-left text-2xs font-semibold uppercase tracking-[0.06em] text-ink-4">{h}</th>
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
                      className={`cursor-pointer border-b border-edge-2 transition-colors last:border-0 ${
                        isSelected ? "bg-brand-soft/30" : overdue ? "bg-danger-soft/30" : "hover:bg-surface-raised"
                      }`}
                    >
                      <td className="px-5 py-4 font-mono text-xs text-ink-2">{s.settlementNumber || "—"}</td>
                      <td className="px-5 py-4 text-[13.5px] font-semibold text-ink">{formatCycleDate(s.cycleDate)}</td>
                      <td className="px-5 py-4 text-[13.5px] font-bold tabular-nums text-ink">{formatCurrency(s.totalAmount)}</td>
                      <td className={`px-5 py-4 text-[13.5px] font-semibold tabular-nums ${s.outstandingAmount > 0 ? "text-danger" : "text-brand"}`}>
                        {s.outstandingAmount > 0 ? formatCurrency(s.outstandingAmount) : "No dues"}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-[13.5px] text-ink-3">
                        {s.lateFeeAmount > 0 ? formatCurrency(s.lateFeeAmount) : "—"}
                      </td>
                      <td className={`px-5 py-4 text-sm tabular-nums ${overdue ? "font-semibold text-danger" : "text-ink-3"}`}>
                        {formatDate(s.dueDate)}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-sm text-ink-3">
                        {s.gracePeriodEnd ? formatDate(s.gracePeriodEnd) : "—"}
                      </td>
                      <td className="px-5 py-4"><StatusPill status={s.status} /></td>
                      <td className="px-5 py-4">
                        <span className={`flex h-[30px] w-fit items-center gap-1 rounded-lg px-3.5 text-xs font-semibold ${
                          isSelected ? "bg-brand text-white" : "bg-brand-soft text-brand"
                        }`}>
                          Details <ChevronRight size={11} />
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
          <div className="border-t border-edge-2 bg-surface-raised px-5 py-3">
            <p className="text-xs text-ink-4">{filtered.length} {filtered.length === 1 ? "settlement" : "settlements"}</p>
          </div>
        )}
      </div>

      {/* Drawer */}
      <DrawerPanel open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <>
            {/* Header */}
            <div className="border-b border-edge px-5 pb-4 pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                    <StatusPill status={selected.status} />
                    {selected.settlementNumber && (
                      <span className="rounded bg-surface-muted px-2 py-0.5 font-mono text-2xs font-medium text-ink-3">
                        {selected.settlementNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-base font-bold leading-tight text-ink">
                    {formatCycleDate(selected.cycleDate)}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-3">Settlement period</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close panel"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-edge text-ink-3 transition-colors hover:bg-surface-raised"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {/* Overdue warning */}
              {selected.status === "OVERDUE" && (
                <div className="flex items-start gap-3 rounded-xl border border-danger-bg bg-danger-soft p-3.5">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-danger" />
                  <div>
                    <p className="text-xs font-semibold text-danger">Payment overdue</p>
                    <p className="mt-0.5 text-2xs leading-relaxed text-danger">
                      This settlement is past its due date. Late fees may apply. Please remit payment immediately.
                    </p>
                  </div>
                </div>
              )}

              {/* Amount breakdown */}
              <div>
                <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.07em] text-ink-3">Amount Breakdown</p>
                <div className="rounded-xl border border-edge bg-surface px-4 py-1">
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
                  <div className="mt-1 flex items-center justify-between border-t border-edge py-3">
                    <span className="text-xs font-semibold text-ink">Total amount</span>
                    <span className="text-sm font-bold tabular-nums text-ink">{formatCurrency(selected.totalAmount)}</span>
                  </div>
                  {selected.outstandingAmount > 0 && (
                    <div className="flex items-center justify-between border-t border-danger-bg py-2.5">
                      <span className="text-xs font-semibold text-danger">Outstanding</span>
                      <span className="text-sm font-bold tabular-nums text-danger">{formatCurrency(selected.outstandingAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div>
                <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.07em] text-ink-3">Key Dates</p>
                <div className="rounded-xl border border-edge bg-surface px-4 py-1">
                  <InfoRow label="Due date"          value={formatDate(selected.dueDate)} accent={isOverdue(selected)} />
                  {selected.gracePeriodEnd && (
                    <InfoRow label="Grace period ends" value={formatDate(selected.gracePeriodEnd)} />
                  )}
                  {selected.paidDate && (
                    <InfoRow label="Paid on"           value={formatDate(selected.paidDate)} />
                  )}
                  {selected.generatedAt && (
                    <InfoRow label="Generated"         value={formatDate(selected.generatedAt)} />
                  )}
                  {selected.employeeCount > 0 && (
                    <InfoRow label="Employees"         value={`${selected.employeeCount}`} />
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="mb-3 text-2xs font-semibold uppercase tracking-[0.07em] text-ink-3">Status timeline</p>
                <Timeline settlement={selected} />
              </div>

              {/* Notes */}
              {selected.notes && (
                <div>
                  <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.07em] text-ink-3">Notes</p>
                  <div className="rounded-xl border border-edge bg-surface-raised px-4 py-3">
                    <p className="text-xs leading-relaxed text-ink-3">{selected.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="space-y-3 border-t border-edge px-5 py-4">
              <button
                onClick={() => void handleSendReport()}
                disabled={sendingReport}
                className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-edge text-xs font-medium text-ink-3 transition-colors hover:bg-surface-raised disabled:opacity-40"
              >
                {sendingReport
                  ? <Loader2 size={12} className="animate-spin" />
                  : <FileText size={12} />}
                {sendingReport ? "Sending…" : "Send Report via Email"}
              </button>

              {/* Payment guidance panel — only when outstanding */}
              {selected.status !== "PAID" && selected.status !== "CANCELLED" && (
                <div className="flex items-start gap-3 rounded-xl border border-edge bg-brand-soft px-4 py-3.5">
                  <Info size={15} className="mt-0.5 flex-shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs font-semibold text-info">Payment guidance</p>
                    <p className="text-xs leading-relaxed text-info">
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
                      <p className="mt-1.5 text-2xs font-medium text-danger">
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
