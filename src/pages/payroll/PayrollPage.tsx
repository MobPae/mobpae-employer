import {
  CalendarDays,
  CheckCircle2,
  Minus,
  Save,
  Scissors,
  TrendingDown,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api-errors";
import { employeeService } from "../../services/employee.service";
import { payrollService } from "../../services/payroll.service";
import type { PayrollSettingsPayload } from "../../types";
import { formatCurrency, formatPayrollDay } from "../../utils/formatters";

// ── per-employee payroll row ──────────────────────────────────────────────────

interface PayrollRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  email: string;
  phone: string;
  salaryInHand: number;
  advanceAmount: number;       // principalAmount from recovery
  interestAmount: number;
  totalRecoveryAmount: number; // totalAmount from recovery
  netSalaryPayable: number;    // salaryInHand - totalRecoveryAmount
}

// ── helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full h-9 px-3 text-[13px] bg-white border border-slate-200 rounded-lg " +
  "text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 " +
  "focus:ring-blue-100 transition tabular-nums";

// ── summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  icon,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 flex items-start gap-3 ${
        accent
          ? "bg-[#0f1729] border border-slate-700"
          : "bg-white border border-slate-100"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          accent ? "bg-white/10 text-white/70" : "bg-slate-100 text-slate-600"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className={`text-[11px] font-[500] ${
            accent ? "text-white/40" : "text-slate-400"
          }`}
        >
          {label}
        </p>
        <p
          className={`text-[20px] font-[700] leading-tight mt-0.5 tabular-nums ${
            accent ? "text-white" : "text-slate-900"
          }`}
        >
          {value}
        </p>
        {sub && (
          <p
            className={`text-[11px] mt-0.5 ${
              accent ? "text-white/30" : "text-slate-400"
            }`}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function PayrollPage() {
  const toast = useToast();

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryErr,
  } = useFetch(() => payrollService.getPayrollSummary(), []);

  const {
    data: recoveries,
    loading: recLoading,
  } = useFetch(() => payrollService.getUpcomingRecoveries(), []);

  const {
    data: employees,
    loading: empLoading,
  } = useFetch(() => employeeService.getEmployees(), []);

  // Payroll settings form state
  const [settings, setSettings] = useState<PayrollSettingsPayload>({
    payrollDate: summary?.payrollDate ?? 28,
    payrollCutoffDate: summary?.payrollCutoffDate ?? 21,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync settings inputs from loaded summary (once)
  useMemo(() => {
    if (summary) {
      setSettings({
        payrollDate: summary.payrollDate ?? 28,
        payrollCutoffDate: summary.payrollCutoffDate ?? 21,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?.payrollDate, summary?.payrollCutoffDate]);

  // Group recoveries by employeeId (an employee may have multiple)
  const recoveryMap = useMemo(() => {
    const map = new Map<string, { advance: number; interest: number; total: number }>();
    (recoveries ?? []).forEach((rec) => {
      const existing = map.get(rec.employeeId) ?? { advance: 0, interest: 0, total: 0 };
      map.set(rec.employeeId, {
        advance:  existing.advance  + rec.principalAmount,
        interest: existing.interest + rec.interestAmount,
        total:    existing.total    + rec.totalAmount,
      });
    });
    return map;
  }, [recoveries]);

  // All employees → PayrollRow (recovery defaults to 0 when none exists)
  const rows: PayrollRow[] = useMemo(() => {
    if (!employees) return [];
    return employees.map((emp) => {
      const rec = recoveryMap.get(emp.id) ?? { advance: 0, interest: 0, total: 0 };
      return {
        employeeId:          emp.id,
        employeeName:        emp.name,
        employeeCode:        emp.employeeCode,
        email:               emp.email,
        phone:               emp.phone,
        salaryInHand:        emp.salaryInHand,
        advanceAmount:       rec.advance,
        interestAmount:      rec.interest,
        totalRecoveryAmount: rec.total,
        netSalaryPayable:    emp.salaryInHand - rec.total,
      };
    });
  }, [employees, recoveryMap]);

  // Aggregate totals
  const totals = useMemo(() => {
    const grossPayroll      = rows.reduce((s, r) => s + r.salaryInHand,       0);
    const totalRecovery     = rows.reduce((s, r) => s + r.totalRecoveryAmount, 0);
    const netPayroll        = rows.reduce((s, r) => s + r.netSalaryPayable,    0);
    const employeesWithRec  = rows.filter((r) => r.totalRecoveryAmount > 0).length;
    return { grossPayroll, totalRecovery, netPayroll, employeesWithRec };
  }, [rows]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      [settings.payrollDate, settings.payrollCutoffDate].some(
        (d) => d < 1 || d > 31
      )
    ) {
      toast.error("Validation error", "Days must be between 1 and 31");
      return;
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

  const loading = summaryLoading || recLoading || empLoading;

  return (
    <div className="space-y-5">
      {summaryErr && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-[12px] text-red-700">{summaryErr}</p>
        </div>
      )}

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Gross Payroll"
          value={loading ? "—" : formatCurrency(totals.grossPayroll)}
          sub="Sum of all salary in hand"
          icon={<Wallet size={16} />}
          accent
        />
        <SummaryCard
          label="Total Recovery Amount"
          value={loading ? "—" : formatCurrency(totals.totalRecovery)}
          sub="Advance + interest deductions"
          icon={<TrendingDown size={16} />}
        />
        <SummaryCard
          label="Total Net Payroll Payable"
          value={loading ? "—" : formatCurrency(totals.netPayroll)}
          sub="After all MobPae recoveries"
          icon={<Minus size={16} />}
        />
        <SummaryCard
          label="Employees With Recoveries"
          value={loading ? "—" : totals.employeesWithRec}
          sub="Active recovery this cycle"
          icon={<Users size={16} />}
        />
      </div>

      {/* ── Payroll settings ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-[600] text-slate-900 flex items-center gap-2">
              <CalendarDays size={14} className="text-slate-400" />
              Payroll settings
            </p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Payroll day: {formatPayrollDay(summary?.payrollDate)} ·
              Cutoff: {formatPayrollDay(summary?.payrollCutoffDate)}
            </p>
          </div>
          {summary && (
            <div className="flex items-center gap-3 text-[12px] text-slate-500">
              <span>
                <span className="font-[600] text-amber-600">
                  {summary.pendingRecoveries}
                </span>{" "}
                pending
              </span>
              <span className="text-slate-200">|</span>
              <span>
                <span className="font-[600] text-emerald-600">
                  {summary.completedRecoveries}
                </span>{" "}
                completed
              </span>
            </div>
          )}
        </div>
        <form onSubmit={handleSave} className="px-5 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-[500] text-slate-500 mb-1">
                Payroll day (1–31)
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={settings.payrollDate}
                onChange={(e) => {
                  setSaved(false);
                  setSettings((s) => ({
                    ...s,
                    payrollDate: Number(e.target.value),
                  }));
                }}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-[500] text-slate-500 mb-1">
                Cutoff day (1–31)
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={settings.payrollCutoffDate}
                onChange={(e) => {
                  setSaved(false);
                  setSettings((s) => ({
                    ...s,
                    payrollCutoffDate: Number(e.target.value),
                  }));
                }}
                className={inputCls}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="h-9 px-4 flex items-center gap-2 rounded-lg bg-[#0f1729] hover:bg-slate-800 text-white text-[12px] font-[600] disabled:opacity-50 transition-colors flex-shrink-0"
              >
                <Save size={13} />
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 h-9 px-3 text-[11px] text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <Scissors size={12} />
              </button>
            </div>
          </div>
          {saved && (
            <div className="mt-3 flex items-center gap-2 text-[12px] text-emerald-700 font-[500]">
              <CheckCircle2 size={13} />
              Settings saved
            </div>
          )}
        </form>
      </div>

      {/* ── Employee payroll table ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[13px] font-[600] text-slate-900">
            Employee Payroll — Salary Payout Breakdown
          </p>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Net Salary Payable = Salary In Hand − Total Recovery Amount
          </p>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <div className="h-2.5 w-32 bg-slate-100 rounded animate-pulse" />
                <div className="h-2.5 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="h-2.5 w-24 bg-slate-100 rounded animate-pulse ml-auto" />
                <div className="h-2.5 w-24 bg-slate-100 rounded animate-pulse" />
                <div className="h-6 w-28 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users size={18} className="text-slate-400" />
            </div>
            <p className="text-[13px] font-[500] text-slate-500">
              No recoveries scheduled this payroll cycle
            </p>
            <p className="text-[12px] text-slate-400 mt-1">
              All salaries will be paid in full
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3 text-left text-[11px] font-[600] text-slate-400 uppercase tracking-[0.06em] whitespace-nowrap">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-[600] text-slate-400 uppercase tracking-[0.06em] whitespace-nowrap">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-[600] text-slate-400 uppercase tracking-[0.06em] whitespace-nowrap">
                    Salary In Hand
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-[600] text-slate-400 uppercase tracking-[0.06em] whitespace-nowrap">
                    Advance
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-[600] text-slate-400 uppercase tracking-[0.06em] whitespace-nowrap">
                    Interest
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-[600] text-slate-400 uppercase tracking-[0.06em] whitespace-nowrap">
                    Total Recovery
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-[600] text-slate-400 uppercase tracking-[0.06em] whitespace-nowrap pr-5">
                    Net Payable
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row) => (
                  <tr
                    key={row.employeeId}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Employee */}
                    <td className="px-5 py-3.5">
                      <p className="font-[600] text-slate-800 leading-snug">
                        {row.employeeName}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-[500]">
                        {row.employeeCode}
                      </p>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5">
                      <p className="text-slate-600 leading-snug truncate max-w-[160px]">
                        {row.email}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {row.phone}
                      </p>
                    </td>

                    {/* Salary In Hand */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="tabular-nums font-[500] text-slate-700">
                        {formatCurrency(row.salaryInHand)}
                      </span>
                    </td>

                    {/* Advance */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="tabular-nums text-amber-700">
                        {formatCurrency(row.advanceAmount)}
                      </span>
                    </td>

                    {/* Interest */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="tabular-nums text-orange-600">
                        {formatCurrency(row.interestAmount)}
                      </span>
                    </td>

                    {/* Total Recovery */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center justify-end gap-1 tabular-nums font-[600] text-red-600">
                        <span className="text-[10px] font-[400] text-slate-400">−</span>
                        {formatCurrency(row.totalRecoveryAmount)}
                      </span>
                    </td>

                    {/* Net Payable — prominent */}
                    <td className="px-4 py-3.5 pr-5 text-right">
                      <div
                        className={`inline-flex flex-col items-end px-3 py-1.5 rounded-lg ${
                          row.netSalaryPayable >= 0
                            ? "bg-emerald-50"
                            : "bg-red-50"
                        }`}
                      >
                        <span
                          className={`text-[13px] font-[700] tabular-nums leading-none ${
                            row.netSalaryPayable >= 0
                              ? "text-emerald-700"
                              : "text-red-700"
                          }`}
                        >
                          {formatCurrency(row.netSalaryPayable)}
                        </span>
                        <span className="text-[9px] font-[500] text-slate-400 mt-0.5 leading-none">
                          net payable
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Totals footer */}
              {rows.length > 1 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={2} className="px-5 py-3.5">
                      <span className="text-[11px] font-[700] text-slate-500 uppercase tracking-[0.06em]">
                        Total ({rows.length} employees · {totals.employeesWithRec} with recoveries)
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-[700] text-slate-800">
                      {formatCurrency(totals.grossPayroll)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-[700] text-amber-700">
                      {formatCurrency(rows.reduce((s, r) => s + r.advanceAmount, 0))}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-[700] text-orange-600">
                      {formatCurrency(rows.reduce((s, r) => s + r.interestAmount, 0))}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-[700] text-red-600">
                      {formatCurrency(totals.totalRecovery)}
                    </td>
                    <td className="px-4 py-3.5 pr-5 text-right tabular-nums font-[700] text-emerald-700 text-[14px]">
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
