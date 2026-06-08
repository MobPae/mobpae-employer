import { CalendarDays, CircleDollarSign, Clock3, Save, Scissors, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { RecoveryTable } from "../../components/payroll/RecoveryTable";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { MetricCard } from "../../components/ui/MetricCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api-errors";
import { payrollService } from "../../services/payroll.service";
import type { PayrollSettingsPayload, PayrollSummary, Repayment } from "../../types";
import { formatCurrency, formatPayrollDay } from "../../utils/formatters";

export function PayrollPage() {
  const toast = useToast();
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [recoveries, setRecoveries] = useState<Repayment[]>([]);
  const [settings, setSettings] = useState<PayrollSettingsPayload>({ payrollDate: 28, payrollCutoffDate: 21 });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([payrollService.getPayrollSummary(), payrollService.getUpcomingRecoveries()])
      .then(([nextSummary, nextRecoveries]) => {
        setSummary(nextSummary);
        setRecoveries(nextRecoveries);
        setSettings({
          payrollDate: nextSummary.payrollDate ?? 28,
          payrollCutoffDate: nextSummary.payrollCutoffDate ?? 21
        });
      })
      .catch((error) => {
        const message = getApiErrorMessage(error, "Unable to load payroll data.");
        setError(message);
        toast.error("Unable to load payroll data", message);
      });
  }, []);

  const setSetting = (key: keyof PayrollSettingsPayload, value: string) => {
    setSaved(false);
    setError("");
    setSettings((current) => ({ ...current, [key]: Number(value) }));
  };

  return (
    <>
      <PageHeader eyebrow="Payroll cycle" title="Payroll Overview" description="Prepare recovery schedules before payroll cutoff and keep deductions traceable." />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Payroll Date" value={formatPayrollDay(summary?.payrollDate)} icon={<CalendarDays size={19} />} />
        <MetricCard label="Payroll Cutoff Date" value={formatPayrollDay(summary?.payrollCutoffDate)} icon={<Scissors size={19} />} />
        <MetricCard label="Employees Due" value={summary?.employeesDue ?? "-"} icon={<UsersRound size={19} />} />
        <MetricCard label="Total Recovery Amount" value={formatCurrency(summary?.totalRecoveryAmount ?? 0)} icon={<CircleDollarSign size={19} />} />
      </section>

      <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-base font-bold text-slate-950">Payroll Settings</h2>
            <p className="mt-1 text-sm text-slate-500">Configure the monthly payroll and recovery cutoff days for this employer.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
            <Clock3 size={15} />
            {summary?.pendingRecoveries ?? 0} pending / {summary?.completedRecoveries ?? 0} completed
          </div>
        </div>

        <form
          className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");

            if (settings.payrollDate < 1 || settings.payrollDate > 31 || settings.payrollCutoffDate < 1 || settings.payrollCutoffDate > 31) {
              setSaved(false);
              setError("Payroll and cutoff days must be between 1 and 31.");
              return;
            }

            try {
              setSaving(true);
              const updatedSummary = await payrollService.updatePayrollSettings(settings);
              const nextRecoveries = await payrollService.getUpcomingRecoveries();
              setSummary(updatedSummary);
              setRecoveries(nextRecoveries);
              setSaved(true);
              toast.success("Payroll settings updated");
            } catch (error) {
              setSaved(false);
              const message = getApiErrorMessage(error, "Unable to update payroll settings. Please try again.");
              setError(message);
              toast.error("Unable to update payroll settings", message);
            } finally {
              setSaving(false);
            }
          }}
        >
          <Input label="Payroll Day" type="number" min={1} max={31} value={settings.payrollDate} onChange={(event) => setSetting("payrollDate", event.target.value)} />
          <Input label="Cutoff Day" type="number" min={1} max={31} value={settings.payrollCutoffDate} onChange={(event) => setSetting("payrollCutoffDate", event.target.value)} />
          <div className="flex items-end">
            <Button icon={<Save size={16} />} type="submit" className="w-full md:w-auto" disabled={saving}>
              {saving ? "Saving..." : "Save Payroll"}
            </Button>
          </div>
        </form>
        {saved ? <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Payroll settings updated.</p> : null}
        {error ? <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
      </section>

      <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-950">Repayment Schedule</h2>
          <p className="mt-1 text-sm text-slate-500">Upcoming recoveries to include in the current payroll file.</p>
        </div>
        <RecoveryTable recoveries={recoveries} />
      </section>
    </>
  );
}
