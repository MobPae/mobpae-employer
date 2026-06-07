import { CalendarDays, CircleDollarSign, Scissors, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { RecoveryTable } from "../../components/payroll/RecoveryTable";
import { MetricCard } from "../../components/ui/MetricCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { payrollService } from "../../services/payroll.service";
import type { PayrollSummary, Repayment } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

export function PayrollPage() {
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [recoveries, setRecoveries] = useState<Repayment[]>([]);

  useEffect(() => {
    Promise.all([payrollService.getPayrollSummary(), payrollService.getUpcomingRecoveries()]).then(([nextSummary, nextRecoveries]) => {
      setSummary(nextSummary);
      setRecoveries(nextRecoveries);
    });
  }, []);

  return (
    <>
      <PageHeader eyebrow="Payroll cycle" title="Payroll Overview" description="Prepare recovery schedules before payroll cutoff and keep deductions traceable." />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Payroll Date" value={summary ? formatDate(summary.payrollDate) : "-"} icon={<CalendarDays size={19} />} />
        <MetricCard label="Payroll Cutoff Date" value={summary ? formatDate(summary.payrollCutoffDate) : "-"} icon={<Scissors size={19} />} />
        <MetricCard label="Employees Due" value={summary?.employeesDue ?? "-"} icon={<UsersRound size={19} />} />
        <MetricCard label="Total Recovery Amount" value={formatCurrency(summary?.totalRecoveryAmount ?? 0)} icon={<CircleDollarSign size={19} />} />
      </section>

      <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-blue-950">Repayment Schedule</h2>
          <p className="mt-1 text-sm text-blue-900/65">Upcoming recoveries to include in the current payroll file.</p>
        </div>
        <RecoveryTable recoveries={recoveries} />
      </section>
    </>
  );
}
