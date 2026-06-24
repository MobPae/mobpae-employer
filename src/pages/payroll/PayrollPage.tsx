import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Play,
  Save,
  TrendingDown,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api-errors";
import { employeeService } from "../../services/employee.service";
import { payrollService } from "../../services/payroll.service";
import type { PayrollSettingsPayload } from "../../types";
import { formatCurrency, formatDate, formatPayrollDay } from "../../utils/formatters";

// ── helpers ───────────────────────────────────────────────────────────────────

function currentPayrollMonth(): string {
  return new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function nextPayrollMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function nextPayrollDate(day: number | null): Date {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), day ?? 28);
  if (target <= now) target.setMonth(target.getMonth() + 1);
  return target;
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

// ── per-employee payroll row ──────────────────────────────────────────────────

interface PayrollRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  email: string;
  phone: string;
  salaryInHand: number;
  advanceAmount: number;
  interestAmount: number;
  totalRecoveryAmount: number;
  netSalaryPayable: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full h-9 px-3 text-[13px] bg-white border border-[#E5E7EB] rounded-lg " +
  "text-[#111827] focus:outline-none focus:border-[#6C4CFF] focus:ring-2 " +
  "focus:ring-[#6C4CFF]/10 transition tabular-nums";

// ── summary card — uniform white ──────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  icon,
  iconBg = "bg-[#F3F4F6]",
  iconColor = "text-[#6B7280]",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 16, display: "flex", alignItems: "flex-start", gap: 12, boxShadow: "0 1px 4px rgba(17,24,39,0.04)" }}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: "#6B7280" }}>{label}</p>
        <p style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginTop: 2, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: 11, marginTop: 2, color: "#6B7280" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── zero-aware amount cell ────────────────────────────────────────────────────

function AmountCell({
  amount,
  activeColor,
  prefix,
}: {
  amount: number;
  activeColor: string;
  prefix?: string;
}) {
  if (amount === 0) {
    return <span className="tabular-nums text-[#6B7280]">—</span>;
  }
  return (
    <span className={`tabular-nums font-[500] ${activeColor}`}>
      {prefix}{formatCurrency(amount)}
    </span>
  );
}

// ── process payroll confirmation dialog ───────────────────────────────────────

function ProcessConfirmDialog({
  employeesAffected,
  totalAmount,
  processing,
  onConfirm,
  onCancel,
}: {
  employeesAffected: number;
  totalAmount: number;
  processing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={!processing ? onCancel : undefined} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden">
          <div className="px-5 pt-5 pb-4 flex items-start justify-between border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[14px] font-[700] text-[#111827] leading-tight">Process Payroll Recoveries</p>
                <p className="text-[12px] text-[#6B7280] mt-0.5">This will mark scheduled recoveries as recovered</p>
              </div>
            </div>
            {!processing && (
              <button type="button" onClick={onCancel}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#6B7280] transition-colors flex-shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="bg-[#F9FAFB] rounded-xl p-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-[500] text-[#6B7280] mb-0.5">Employees affected</p>
                <p className="text-[22px] font-[700] text-[#111827] tabular-nums leading-none">{employeesAffected}</p>
              </div>
              <div>
                <p className="text-[11px] font-[500] text-[#6B7280] mb-0.5">Total recovery</p>
                <p className="text-[22px] font-[700] text-[#111827] tabular-nums leading-none">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-[12px] text-amber-700 leading-relaxed">
                This will mark all eligible payroll recoveries as processed and generate employer settlement records.
                This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="px-5 pb-5 flex items-center gap-2">
            <button type="button" onClick={onCancel} disabled={processing}
              className="flex-1 h-10 rounded-lg border border-[#E5E7EB] text-[13px] font-[600] text-[#6B7280] hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={onConfirm} disabled={processing}
              className="flex-1 h-10 rounded-lg bg-[#6C4CFF] hover:bg-[#5B34FF] text-white text-[13px] font-[600] flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
              {processing ? (
                <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Processing…</>
              ) : (
                <><Play size={13} />Confirm &amp; Process</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function PayrollPage() {
  const toast = useToast();

  const { data: summary, loading: summaryLoading, error: summaryErr, refresh: refreshSummary } =
    useFetch(() => payrollService.getPayrollSummary(), []);
  const { data: recoveries, loading: recLoading, error: recErr, refresh: refreshRecoveries } =
    useFetch(() => payrollService.getUpcomingRecoveries(), []);
  const { data: employees, loading: empLoading, error: empErr, refresh: refreshEmployees } =
    useFetch(() => employeeService.getEmployees(), []);

  const [showConfirm, setShowConfirm]   = useState(false);
  const [processing,  setProcessing]    = useState(false);
  const [processResult, setProcessResult] = useState<{
    processedCount: number; totalAmount: number;
    settlementId: string; payrollMonth: string; dueDate: string;
  } | null>(null);

  const handleProcessPayroll = async () => {
    setProcessing(true);
    try {
      const result = await payrollService.processPayrollRecovery();
      setShowConfirm(false);
      setProcessResult(result);
      refreshSummary(); refreshRecoveries(); refreshEmployees();
      toast.success("Payroll processed", `${formatCurrency(result.totalAmount)} recovered · settlement created`);
    } catch (err) {
      toast.error("Processing failed", getApiErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const [settings, setSettings] = useState<PayrollSettingsPayload>({
    payrollDate: summary?.payrollDate ?? 28,
    payrollCutoffDate: summary?.payrollCutoffDate ?? 21,
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useMemo(() => {
    if (summary) setSettings({ payrollDate: summary.payrollDate ?? 28, payrollCutoffDate: summary.payrollCutoffDate ?? 21 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?.payrollDate, summary?.payrollCutoffDate]);

  const scheduledRecoveries = useMemo(
    () => (recoveries ?? []).filter(r => r.status === "SCHEDULED"),
    [recoveries]
  );

  const recoveryMap = useMemo(() => {
    const map = new Map<string, { advance: number; interest: number; total: number }>();
    scheduledRecoveries.forEach((rec) => {
      const e = map.get(rec.employeeId) ?? { advance: 0, interest: 0, total: 0 };
      map.set(rec.employeeId, {
        advance:  e.advance  + rec.principalAmount,
        interest: e.interest + rec.interestAmount,
        total:    e.total    + rec.totalAmount,
      });
    });
    return map;
  }, [scheduledRecoveries]);

  const rows: PayrollRow[] = useMemo(() => {
    if (!employees) return [];
    return employees.map((emp) => {
      const rec = recoveryMap.get(emp.id) ?? { advance: 0, interest: 0, total: 0 };
      return {
        employeeId: emp.id, employeeName: emp.name, employeeCode: emp.employeeCode,
        email: emp.email, phone: emp.phone, salaryInHand: emp.salaryInHand,
        advanceAmount: rec.advance, interestAmount: rec.interest,
        totalRecoveryAmount: rec.total,
        netSalaryPayable: emp.salaryInHand - rec.total,
      };
    });
  }, [employees, recoveryMap]);

  const totals = useMemo(() => ({
    grossPayroll:     rows.reduce((s, r) => s + r.salaryInHand,       0),
    totalRecovery:    rows.reduce((s, r) => s + r.totalRecoveryAmount, 0),
    netPayroll:       rows.reduce((s, r) => s + r.netSalaryPayable,    0),
    employeesWithRec: rows.filter((r) => r.totalRecoveryAmount > 0).length,
  }), [rows]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if ([settings.payrollDate, settings.payrollCutoffDate].some(d => d < 1 || d > 31)) {
      toast.error("Validation error", "Days must be between 1 and 31"); return;
    }
    setSaving(true);
    try {
      await payrollService.updatePayrollSettings(settings);
      setSaved(true);
      toast.success("Payroll settings saved");
    } catch (err) {
      toast.error("Save failed", getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const loading        = summaryLoading || recLoading || empLoading;
  const payrollDay     = summary?.payrollDate ?? 28;
  const isPayrollWindow = new Date().getDate() >= payrollDay;
  const hasScheduled   = totals.employeesWithRec > 0;
  const canProcess     = hasScheduled && isPayrollWindow;
  const nextPayDay     = nextPayrollDate(summary?.payrollDate ?? null);
  const daysToPayday   = daysUntil(nextPayDay);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", letterSpacing: "-0.025em", margin: 0 }}>Payroll</h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Review and process this cycle's payroll recoveries</p>
      </div>

      {showConfirm && (
        <ProcessConfirmDialog
          employeesAffected={totals.employeesWithRec}
          totalAmount={totals.totalRecovery}
          processing={processing}
          onConfirm={handleProcessPayroll}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {summaryErr && (
        <div className="bg-white border border-red-100 rounded-xl px-6 py-10 text-center">
          <p className="text-[13px] font-[500] text-red-600">Failed to load payroll summary</p>
          <p className="text-[12px] text-[#6B7280] mt-1">{summaryErr}</p>
          <button onClick={refreshSummary} className="mt-4 h-8 px-4 text-[12px] font-[500] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors text-[#6B7280]">
            Retry
          </button>
        </div>
      )}

      {/* ── Payroll header ─────────────────────────────────────────────────── */}
      <div className="bg-[#6C4CFF] rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-[600] text-white/50 uppercase tracking-[0.1em] mb-1">Current Cycle</p>
          <p className="text-[20px] font-[700] text-white leading-tight">
            Payroll for {currentPayrollMonth()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.12] border border-white/[0.15] text-[11px] font-[500] text-white/80">
            <CalendarDays size={11} />
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.12] border border-white/[0.15] text-[11px] font-[500] text-white/80">
            <CalendarCheck2 size={11} />
            Payroll · {formatPayrollDay(summary?.payrollDate)}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.12] border border-white/[0.15] text-[11px] font-[500] text-white/80">
            <CalendarClock size={11} />
            Cutoff · {formatPayrollDay(summary?.payrollCutoffDate)}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 border border-white/25 text-[11px] font-[700] text-white">
            <ArrowRight size={11} />
            {daysToPayday}d to payday
          </span>
        </div>
      </div>

      {/* ── Post-processing success ────────────────────────────────────────── */}
      {processResult && (
        <div className="bg-[#F3F0FF] border border-[#DDD6FE] rounded-xl px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={18} className="text-[#6C4CFF]" />
              </div>
              <div>
                <p className="text-[13px] font-[700] text-[#111827]">Payroll processed successfully</p>
                <p className="text-[12px] text-[#6C4CFF] mt-0.5">
                  {processResult.processedCount} repayment{processResult.processedCount !== 1 ? "s" : ""} marked as recovered
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setProcessResult(null)} className="text-[#A5A7FF] hover:text-[#6C4CFF]">
              <X size={14} />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Payroll month", value: (() => { const [y,m] = processResult.payrollMonth.split("-"); return new Date(Number(y), Number(m)-1).toLocaleDateString("en-IN", { month: "long", year: "numeric" }); })() },
              { label: "Settlement amount", value: formatCurrency(processResult.totalAmount) },
              { label: "Due date", value: formatDate(processResult.dueDate) },
              { label: "Settlement ID", value: processResult.settlementId.slice(0,8) + "…" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl px-3 py-2.5 border border-[#DDD6FE]">
                <p className="text-[11px] font-[500] text-[#6C4CFF] mb-0.5">{label}</p>
                <p className="text-[12px] font-[700] text-[#111827] tabular-nums truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Summary cards — all uniform white ─────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <SummaryCard
          label="Gross Payroll"
          value={loading ? "—" : formatCurrency(totals.grossPayroll)}
          sub="Total salary in hand"
          icon={<Wallet size={16} />}
          iconBg="bg-[#F3F0FF]"
          iconColor="text-[#6C4CFF]"
        />
        <SummaryCard
          label="Total Recovery"
          value={loading ? "—" : formatCurrency(totals.totalRecovery)}
          sub="Advance + interest"
          icon={<TrendingDown size={16} />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <SummaryCard
          label="Net Payroll Payable"
          value={loading ? "—" : formatCurrency(totals.netPayroll)}
          sub="After MobPae deductions"
          icon={<Wallet size={16} />}
          iconBg="bg-[#F3F0FF]"
          iconColor="text-[#6C4CFF]"
        />
        <SummaryCard
          label="With Recoveries"
          value={loading ? "—" : totals.employeesWithRec}
          sub="Employees this cycle"
          icon={<Users size={16} />}
          iconBg="bg-[#F3F4F6]"
          iconColor="text-[#6B7280]"
        />
      </div>

      {/* ── Payroll settings + process button ─────────────────────────────── */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(17,24,39,0.04)" }}>
        <div className="px-5 py-4 border-b border-[#F9FAFB] flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-[600] text-[#111827] flex items-center gap-2">
              <CalendarDays size={14} className="text-[#6B7280]" />
              Payroll Schedule
            </p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">
              Configure your payroll and cutoff dates
            </p>
          </div>
          {summary && (
            <div className="flex items-center gap-3 text-[12px] text-[#6B7280] flex-shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="font-[600] text-[#6B7280]">{summary.pendingRecoveries}</span> scheduled
              </span>
              <span className="w-px h-3 bg-[#E4E4EF]" />
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6C4CFF]" />
                <span className="font-[600] text-[#6B7280]">{summary.completedRecoveries}</span> recovered
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="px-5 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-[500] text-[#6B7280] mb-1.5">
                Payroll day (1–31)
              </label>
              <input
                type="number" min={1} max={31}
                value={settings.payrollDate}
                onChange={(e) => { setSaved(false); setSettings(s => ({ ...s, payrollDate: Number(e.target.value) })); }}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-[500] text-[#6B7280] mb-1.5">
                Cutoff day (1–31)
              </label>
              <input
                type="number" min={1} max={31}
                value={settings.payrollCutoffDate}
                onChange={(e) => { setSaved(false); setSettings(s => ({ ...s, payrollCutoffDate: Number(e.target.value) })); }}
                className={inputCls}
              />
            </div>
            <button
              type="submit" disabled={saving}
              className="h-9 px-4 flex items-center gap-2 rounded-lg bg-[#6C4CFF] hover:bg-[#5B34FF] text-white text-[12px] font-[600] disabled:opacity-50 transition-colors flex-shrink-0"
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
          {saved && (
            <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[#6C4CFF] font-[500]">
              <CheckCircle2 size={13} /> Settings saved
            </div>
          )}
        </form>
      </div>

      {/* ── Employee payroll table ─────────────────────────────────────────── */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(17,24,39,0.04)" }}>
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-[600] text-[#111827]">
              {hasScheduled ? "Current Cycle — Payout Breakdown" : `Next Payroll · ${nextPayrollMonth()}`}
            </p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">
              {hasScheduled
                ? "Net Payable = Salary In Hand − Total Recovery"
                : "No recoveries this cycle — all salaries paid in full"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!hasScheduled && (
              <span className="text-[11px] font-[600] text-[#6B7280] bg-[#F3F4F6] px-2.5 py-1 rounded-full">
                {daysToPayday}d away
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={!canProcess}
              title={
                !hasScheduled ? "No scheduled recoveries this cycle"
                : !isPayrollWindow ? `Available from the ${formatPayrollDay(payrollDay)}`
                : undefined
              }
              className="h-8 px-3.5 flex items-center gap-1.5 rounded-lg bg-[#6C4CFF] hover:bg-[#5B34FF] text-white text-[12px] font-[600] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={11} />
              Process Payroll
            </button>
          </div>
        </div>

        {(recErr || empErr) ? (
          <div className="py-10 text-center">
            <p className="text-[13px] font-[500] text-red-600">Failed to load payroll data</p>
            <p className="text-[12px] text-[#6B7280] mt-1">{recErr ?? empErr}</p>
            <button
              onClick={() => { if (recErr) refreshRecoveries(); if (empErr) refreshEmployees(); }}
              className="mt-4 h-8 px-4 text-[12px] font-[500] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors text-[#6B7280]"
            >
              Retry
            </button>
          </div>
        ) : (recLoading || empLoading) ? (
          <div className="divide-y divide-[#F9FAFB]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <div className="h-2.5 w-32 bg-[#F3F4F6] rounded animate-pulse" />
                <div className="h-2.5 w-20 bg-[#F3F4F6] rounded animate-pulse ml-auto" />
                <div className="h-2.5 w-20 bg-[#F3F4F6] rounded animate-pulse" />
                <div className="h-2.5 w-20 bg-[#F3F4F6] rounded animate-pulse" />
                <div className="h-2.5 w-24 bg-[#F3F4F6] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-3">
              <Users size={18} className="text-[#6B7280]" />
            </div>
            <p className="text-[13px] font-[500] text-[#6B7280]">No payroll records available</p>
            <p className="text-[12px] text-[#6B7280] mt-1">Payroll information will appear after employees are onboarded.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>Employee</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 11.5, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>Salary</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 11.5, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>Advance</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 11.5, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>Interest</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 11.5, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>Recovery</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 11.5, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>Net Payable</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const hasRecovery = row.totalRecoveryAmount > 0;
                  return (
                    <tr key={row.employeeId}
                      style={{ borderBottom: "1px solid #F9FAFB", background: hasRecovery ? "#FFFBEB40" : "transparent", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFC"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = hasRecovery ? "#FFFBEB40" : "transparent"}
                    >
                      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", margin: 0 }}>{row.employeeName}</p>
                        <p style={{ fontSize: 11.5, color: "#6B7280", margin: "2px 0 0", fontFamily: "ui-monospace, monospace" }}>{row.employeeCode}</p>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 13.5, color: "#6B7280", fontWeight: 500, verticalAlign: "middle" }}>
                        {formatCurrency(row.salaryInHand)}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right", verticalAlign: "middle" }}>
                        <AmountCell amount={row.advanceAmount} activeColor="text-amber-600" />
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right", verticalAlign: "middle" }}>
                        <AmountCell amount={row.interestAmount} activeColor="text-amber-700" />
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right", verticalAlign: "middle" }}>
                        <AmountCell amount={row.totalRecoveryAmount} activeColor="text-red-500" prefix="−" />
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right", verticalAlign: "middle" }}>
                        <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 13.5, color: row.netSalaryPayable >= 0 ? "#5B34FF" : "#DC2626" }}>
                          {formatCurrency(row.netSalaryPayable)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {rows.length > 1 && (
                <tfoot>
                  <tr style={{ borderTop: "2px solid #E5E7EB", background: "#FAFAFA" }}>
                    <td style={{ padding: "14px 20px", fontSize: 11.5, fontWeight: 700, color: "#6B7280" }}>
                      {rows.length} employees · {totals.employeesWithRec} with recovery
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#6B7280" }}>
                      {formatCurrency(totals.grossPayroll)}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#D97706" }}>
                      {totals.totalRecovery > 0 ? formatCurrency(rows.reduce((s, r) => s + r.advanceAmount, 0)) : "—"}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#B45309" }}>
                      {totals.totalRecovery > 0 ? formatCurrency(rows.reduce((s, r) => s + r.interestAmount, 0)) : "—"}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#EF4444" }}>
                      {totals.totalRecovery > 0 ? `−${formatCurrency(totals.totalRecovery)}` : "—"}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#5B34FF", fontSize: 13.5 }}>
                      {formatCurrency(totals.netPayroll)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
        {/* Footer strip */}
        {rows.length > 0 && !(recLoading || empLoading) && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>{rows.length} {rows.length === 1 ? "employee" : "employees"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
