import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Info,
  Landmark,
  ShieldCheck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { settlementService } from "../../services/settlement.service";
import type { EmployerSettlement, SettlementStatus } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

// ── status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<SettlementStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
  PENDING:        { label: "Pending",        bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   border: "border-amber-200" },
  PARTIALLY_PAID: { label: "Partially Paid", bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-400",     border: "border-sky-200"   },
  PAID:           { label: "Paid",           bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", border: "border-emerald-200"},
  OVERDUE:        { label: "Overdue",        bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400",     border: "border-red-200"   },
};

function StatusPill({ status }: { status: SettlementStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-[500] ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ── payroll month formatting ───────────────────────────────────────────────────

function formatPayrollMonth(raw: string): string {
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
    <div className={`rounded-xl p-4 flex flex-col gap-3 border ${highlight ? "bg-[#c4522a] border-[#a8411f]" : "bg-white border-slate-100"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[12px] font-[500] ${highlight ? "text-white/50" : "text-slate-500"}`}>{label}</span>
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>{icon}</div>
      </div>
      <div>
        <p className={`text-[22px] font-[700] tracking-[-0.02em] leading-none ${highlight ? "text-white" : "text-slate-900"}`}>{value}</p>
        {sub && <p className={`text-[11px] mt-1 ${highlight ? "text-white/40" : "text-slate-400"}`}>{sub}</p>}
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
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 border-2 ${step.done ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"}`}>
              {step.done ? <CheckCircle2 size={12} className="text-emerald-600" /> : <span className="w-2 h-2 rounded-full bg-slate-300" />}
            </div>
            {i < steps.length - 1 && <div className={`w-px flex-1 my-1 ${step.done ? "bg-emerald-200" : "bg-slate-100"}`} style={{ minHeight: 20 }} />}
          </div>
          <div className="pb-4">
            <p className={`text-[12px] font-[500] leading-none ${step.done ? "text-slate-800" : "text-slate-400"}`}>{step.label}</p>
            {step.date && <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(step.date)}</p>}
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
      <div className={`fixed inset-y-0 right-0 z-40 w-[460px] bg-white border-l border-slate-200 shadow-xl flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}>
        {children}
      </div>
    </>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className={`text-[12px] font-[500] ${accent ? "text-red-600" : "text-slate-800"}`}>{value}</span>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function SettlementsPage() {
  const [filter,   setFilter]   = useState<"ALL" | SettlementStatus>("ALL");
  const [selected, setSelected] = useState<EmployerSettlement | null>(null);

  const { data: summaryRaw } =
    useFetch(() => settlementService.getSettlementSummary(), []);
  const { data: settlementsRaw, loading, error } =
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
      <div className="bg-red-50 border border-red-100 rounded-xl p-5">
        <p className="text-[13px] font-[500] text-red-700">Failed to load settlements</p>
        <p className="text-[12px] text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
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
              <span className="inline-flex items-center gap-1 text-[11px] font-[600] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">
                <ShieldCheck size={11} /> Good standing
              </span>
            )}
          </div>
        )
      )}

      {/* Business flow info */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
        <Landmark size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-[12px] text-blue-700 leading-relaxed">
          Settlements represent amounts your company owes to MobPae. Remit payment to MobPae directly — your MobPae account manager will confirm receipt and mark it as paid.
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
                ? "bg-[#c4522a] text-white"
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
            <p className="text-[13px] text-slate-400">Loading settlements…</p>
          </div>
        ) : !filtered.length ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3 mx-auto">
              <CreditCard size={18} className="text-slate-400" />
            </div>
            <p className="text-[13px] font-[500] text-slate-500">No settlements found</p>
            <p className="text-[12px] text-slate-400 mt-1">Settlements appear here once employees' recovered amounts are due to MobPae</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-[12px]">
              <colgroup>
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100">
                  {["Payroll Month", "Total Amount", "Outstanding", "Late Fee", "Due Date", "Grace Period", "Status", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-[500] text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(s => (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={`cursor-pointer hover:bg-slate-50/60 transition-colors ${selected?.id === s.id ? "bg-blue-50/30" : ""} ${isOverdue(s) ? "bg-red-50/20" : ""}`}
                  >
                    <td className="px-5 py-3 font-[500] text-slate-800">{formatPayrollMonth(s.payrollMonth)}</td>
                    <td className="px-5 py-3 tabular-nums font-[600] text-slate-800">{formatCurrency(s.totalAmount)}</td>
                    <td className={`px-5 py-3 tabular-nums font-[600] ${s.outstandingAmount > 0 ? "text-red-600" : "text-slate-400"}`}>
                      {s.outstandingAmount > 0 ? formatCurrency(s.outstandingAmount) : "—"}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-500">
                      {s.lateFeeAmount > 0 ? formatCurrency(s.lateFeeAmount) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className={`px-5 py-3 tabular-nums font-[500] ${isOverdue(s) ? "text-red-600" : "text-slate-600"}`}>
                      {formatDate(s.dueDate)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-500">
                      {s.gracePeriodEnd ? formatDate(s.gracePeriodEnd) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3"><StatusPill status={s.status} /></td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-[12px] font-[500] text-blue-500">
                        Details <ChevronRight size={12} />
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
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusPill status={selected.status} />
                    {selected.referenceNumber && (
                      <span className="text-[10px] font-[500] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Ref: {selected.referenceNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-[16px] font-[700] text-slate-900 leading-tight">
                    {formatPayrollMonth(selected.payrollMonth)}
                  </p>
                  <p className="text-[12px] text-slate-400 mt-0.5">Settlement period</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
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
                <p className="text-[11px] font-[600] text-slate-400 uppercase tracking-[0.07em] mb-2">Amount Breakdown</p>
                <div className="bg-white border border-slate-100 rounded-xl px-4 py-1">
                  <InfoRow label="Principal amount"   value={formatCurrency(selected.principalAmount)} />
                  <InfoRow label="Interest amount"    value={formatCurrency(selected.interestAmount)} />
                  {selected.lateFeeAmount > 0 && (
                    <InfoRow label="Late fee"         value={formatCurrency(selected.lateFeeAmount)} accent />
                  )}
                  <div className="flex items-center justify-between py-3 border-t border-slate-100 mt-1">
                    <span className="text-[12px] font-[600] text-slate-800">Total amount</span>
                    <span className="text-[14px] font-[700] text-slate-900 tabular-nums">{formatCurrency(selected.totalAmount)}</span>
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
                <p className="text-[11px] font-[600] text-slate-400 uppercase tracking-[0.07em] mb-2">Key Dates</p>
                <div className="bg-white border border-slate-100 rounded-xl px-4 py-1">
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
                <p className="text-[11px] font-[600] text-slate-400 uppercase tracking-[0.07em] mb-3">Status timeline</p>
                <Timeline settlement={selected} />
              </div>

              {/* Notes */}
              {selected.notes && (
                <div>
                  <p className="text-[11px] font-[600] text-slate-400 uppercase tracking-[0.07em] mb-2">Notes</p>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <p className="text-[12px] text-slate-600 leading-relaxed">{selected.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer — Pay Now info panel */}
            {selected.status !== "PAID" && (
              <div className="px-5 py-4 border-t border-slate-100">
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5 flex items-start gap-3">
                  <Info size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-[600] text-blue-800 mb-1">Pay Now</p>
                    <p className="text-[12px] text-blue-700 leading-relaxed">
                      Remit{" "}
                      <strong>
                        {formatCurrency(
                          gracePeriodOver && summary
                            ? summary.amountPayableAfterGracePeriod
                            : (selected.outstandingAmount || selected.totalAmount)
                        )}
                      </strong>{" "}
                      to MobPae via bank transfer or your agreed payment method.
                      Once received, your MobPae account manager will mark this settlement as paid.
                    </p>
                    {gracePeriodOver && summary && (
                      <p className="text-[11px] text-red-600 mt-1.5 font-[500]">
                        Includes {summary.lateFeePercentage}% late fee ({formatCurrency(summary.estimatedLateFeeAmount)})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </DrawerPanel>
    </div>
  );
}
