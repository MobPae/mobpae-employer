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
  "w-full h-9 px-3 text-[13px] bg-white border border-slate-200 rounded-lg " +
  "text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 " +
  "focus:ring-blue-100 transition tabular-nums";

// ── summary card — uniform white ──────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  icon,
  iconBg = "bg-slate-100",
  iconColor = "text-slate-500",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-[500] text-slate-400">{label}</p>
        <p className="text-[20px] font-[700] leading-tight mt-0.5 tabular-nums text-slate-900">
          {value}
        </p>
        {sub && <p className="text-[11px] mt-0.5 text-slate-400">{sub}</p>}
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
    return <span className="tabular-nums text-slate-300">—</span>;
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
          <div className="px-5 pt-5 pb-4 flex items-start justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[14px] font-[700] text-slate-900 leading-tight">Process Payroll Recoveries</p>
                <p className="text-[12px] text-slate-400 mt-0.5">This will mark scheduled recoveries as recovered</p>
              </div>
            </div>
            {!processing && (
              <button type="button" onClick={onCancel}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-[500] text-slate-400 mb-0.5">Employees affected</p>
                <p className="text-[22px] font-[700] text-slate-900 tabular-nums leading-none">{employeesAffected}</p>
              </div>
              <div>
                <p className="text-[11px] font-[500] text-slate-400 mb-0.5">Total recovery</p>
                <p className="text-[22px] font-[700] text-slate-900 tabular-nums leading-none">{formatCurrency(totalAmount)}</p>
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
              className="flex-1 h-10 rounded-lg border border-slate-200 text-[13px] font-[600] text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={onConfirm} disabled={processing}
              className="flex-1 h-10 rounded-lg bg-[#c4522a] hover:bg-[#a8411f] text-white text-[13px] font-[600] flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
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
  const { data: recoveries, loading: recLoading, refresh: refreshRecoveries } =
    useFetch(() => payrollService.getUpcomingRecoveries(), []);
  const { data: employees, loading: empLoading, refresh: refreshEmployees } =
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
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-[12px] text-red-700">{summaryErr}</p>
        </div>
      )}

      {/* ── Payroll header ─────────────────────────────────────────────────── */}
      <div className="bg-[#c4522a] rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-[600] text-white/50 uppercase tracking-[0.1em] mb-1">Current Cycle</p>
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
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-[13px] font-[700] text-emerald-900">Payroll processed successfully</p>
                <p className="text-[12px] text-emerald-600 mt-0.5">
                  {processResult.processedCount} repayment{processResult.processedCount !== 1 ? "s" : ""} marked as recovered
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setProcessResult(null)} className="text-emerald-400 hover:text-emerald-600">
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
              <div key={label} className="bg-white rounded-xl px-3 py-2.5 border border-emerald-100">
                <p className="text-[10px] font-[500] text-emerald-500 mb-0.5">{label}</p>
                <p className="text-[12px] font-[700] text-emerald-900 tabular-nums truncate">{value}</p>
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
          iconBg="bg-[#fdf3ee]"
          iconColor="text-[#c4522a]"
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
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <SummaryCard
          label="With Recoveries"
          value={loading ? "—" : totals.employeesWithRec}
          sub="Employees this cycle"
          icon={<Users size={16} />}
          iconBg="bg-slate-100"
          iconColor="text-slate-500"
        />
      </div>

      {/* ── Payroll settings + process button ─────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-[600] text-slate-900 flex items-center gap-2">
              <CalendarDays size={14} className="text-slate-400" />
              Payroll Schedule
            </p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Configure your payroll and cutoff dates
            </p>
          </div>
          {summary && (
            <div className="flex items-center gap-3 text-[12px] text-slate-500 flex-shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="font-[600] text-slate-700">{summary.pendingRecoveries}</span> scheduled
              </span>
              <span className="w-px h-3 bg-slate-200" />
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-[600] text-slate-700">{summary.completedRecoveries}</span> recovered
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="px-5 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-[500] text-slate-500 mb-1.5">
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
              <label className="block text-[11px] font-[500] text-slate-500 mb-1.5">
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
              className="h-9 px-4 flex items-center gap-2 rounded-lg bg-[#c4522a] hover:bg-[#a8411f] text-white text-[12px] font-[600] disabled:opacity-50 transition-colors flex-shrink-0"
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
          {saved && (
            <div className="mt-3 flex items-center gap-1.5 text-[12px] text-emerald-600 font-[500]">
              <CheckCircle2 size={13} /> Settings saved
            </div>
          )}
        </form>
      </div>

      {/* ── Employee payroll table ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-[600] text-slate-900">
              {hasScheduled ? "Current Cycle — Payout Breakdown" : `Next Payroll · ${nextPayrollMonth()}`}
            </p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              {hasScheduled
                ? "Net Payable = Salary In Hand − Total Recovery"
                : "No recoveries this cycle — all salaries paid in full"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!hasScheduled && (
              <span className="text-[11px] font-[600] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
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
              className="h-8 px-3.5 flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-[600] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={11} />
              Process Payroll
            </button>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <div className="h-2.5 w-32 bg-slate-100 rounded animate-pulse" />
                <div className="h-2.5 w-20 bg-slate-100 rounded animate-pulse ml-auto" />
                <div className="h-2.5 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="h-2.5 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="h-2.5 w-24 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users size={18} className="text-slate-400" />
            </div>
            <p className="text-[13px] font-[500] text-slate-700">No payroll records available</p>
            <p className="text-[12px] text-slate-400 mt-1">Payroll information will appear after employees are onboarded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3 text-left text-[10px] font-[700] text-slate-400 uppercase tracking-[0.08em]">Employee</th>
                  <th className="px-4 py-3 text-right text-[10px] font-[700] text-slate-400 uppercase tracking-[0.08em]">Salary</th>
                  <th className="px-4 py-3 text-right text-[10px] font-[700] text-slate-400 uppercase tracking-[0.08em]">Advance</th>
                  <th className="px-4 py-3 text-right text-[10px] font-[700] text-slate-400 uppercase tracking-[0.08em]">Interest</th>
                  <th className="px-4 py-3 text-right text-[10px] font-[700] text-slate-400 uppercase tracking-[0.08em]">Recovery</th>
                  <th className="px-5 py-3 text-right text-[10px] font-[700] text-slate-400 uppercase tracking-[0.08em]">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row) => {
                  const hasRecovery = row.totalRecoveryAmount > 0;
                  return (
                    <tr key={row.employeeId} className={`hover:bg-slate-50/60 transition-colors ${hasRecovery ? "bg-amber-50/20" : ""}`}>
                      {/* Employee */}
                      <td className="px-5 py-3.5">
                        <p className="font-[600] text-slate-800 leading-snug">{row.employeeName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-[500]">{row.employeeCode}</p>
                      </td>

                      {/* Salary In Hand */}
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-700 font-[500]">
                        {formatCurrency(row.salaryInHand)}
                      </td>

                      {/* Advance */}
                      <td className="px-4 py-3.5 text-right">
                        <AmountCell amount={row.advanceAmount} activeColor="text-amber-600" />
                      </td>

                      {/* Interest */}
                      <td className="px-4 py-3.5 text-right">
                        <AmountCell amount={row.interestAmount} activeColor="text-amber-700" />
                      </td>

                      {/* Total Recovery */}
                      <td className="px-4 py-3.5 text-right">
                        <AmountCell amount={row.totalRecoveryAmount} activeColor="text-red-500" prefix="−" />
                      </td>

                      {/* Net Payable */}
                      <td className="px-5 py-3.5 text-right">
                        <span className={`tabular-nums font-[700] text-[13px] ${row.netSalaryPayable >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                          {formatCurrency(row.netSalaryPayable)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {rows.length > 1 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-100 bg-slate-50">
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-[700] text-slate-500">
                        {rows.length} employees · {totals.employeesWithRec} with recovery
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-[700] text-slate-700">
                      {formatCurrency(totals.grossPayroll)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-[700] text-amber-600">
                      {totals.totalRecovery > 0 ? formatCurrency(rows.reduce((s, r) => s + r.advanceAmount, 0)) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-[700] text-amber-700">
                      {totals.totalRecovery > 0 ? formatCurrency(rows.reduce((s, r) => s + r.interestAmount, 0)) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-[700] text-red-500">
                      {totals.totalRecovery > 0 ? `−${formatCurrency(totals.totalRecovery)}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-[700] text-emerald-700 text-[13px]">
                      {formatCurrency(totals.netPayroll)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
