import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  Clock3,
  Landmark,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { MetricCard } from "../../components/ui/MetricCard";
import { dashboardService } from "../../services/dashboard.service";
import type { DashboardStats, LoanApplication } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

// ─── Hero — greeting card ───────────────────────────────────────────────────
function Hero({ greeting, companyName }: { greeting: string; companyName?: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8 sm:py-8"
      style={{
        background: "linear-gradient(160deg, #3A65FF 0%, #315eff 55%, #2549DA 100%)",
        boxShadow: "0 8px 32px -8px rgba(30,22,54,0.18), 0 1px 0 rgba(30,22,54,0.04)",
      }}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/[0.06]" />
      <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
            {companyName || "MobPae Employer Portal"}
          </p>
          <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-white">
            Welcome back, {greeting}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
            Here's the state of approvals, repayments, and settlements for your team today.
          </p>
        </div>
        <p className="flex-shrink-0 text-sm font-medium text-white/60">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>
    </div>
  );
}

// ─── Alert banner ─────────────────────────────────────────────────────────
function AlertBanner({ tone, count, noun, to }: { tone: "danger" | "warning"; count: number; noun: string; to: string }) {
  if (count <= 0) return null;
  const cls = tone === "danger"
    ? "border-danger-bg bg-danger-soft text-danger"
    : "border-warning-bg bg-warning-soft text-warning-dark";
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${cls}`}>
      <AlertTriangle size={14} className="flex-shrink-0" />
      <p>
        <span className="font-semibold">{count}</span> overdue {noun}{count !== 1 ? "s" : ""}.{" "}
        <Link to={to} className="font-medium underline underline-offset-2">Review now</Link>
      </p>
    </div>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-edge bg-surface shadow-card ${className}`}>
      {children}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────
function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-ink-3">{label}</span>
        <span className="text-xs font-semibold text-brand">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────
function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-muted ${className}`} />;
}

// ─── Recent activity table ───────────────────────────────────────────────
function RecentActivity({ rows }: { rows: LoanApplication[] }) {
  if (!rows.length) return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10">
        <WalletCards size={16} className="text-brand" />
      </div>
      <p className="text-sm font-medium text-ink-3">No recent activity</p>
      <p className="mt-1 text-xs text-ink-4">Loan applications will appear here</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-edge-2">
            <th className="px-5 py-2.5 text-left text-2xs font-semibold uppercase tracking-[0.06em] text-ink-4">Employee</th>
            <th className="px-5 py-2.5 text-right text-2xs font-semibold uppercase tracking-[0.06em] text-ink-4">Amount</th>
            <th className="px-5 py-2.5 text-left text-2xs font-semibold uppercase tracking-[0.06em] text-ink-4">Status</th>
            <th className="px-5 py-2.5 text-right text-2xs font-semibold uppercase tracking-[0.06em] text-ink-4">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b border-edge-2 last:border-0">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-2xs font-bold text-brand">
                    {(r.employeeName ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium leading-none text-ink">{r.employeeName}</p>
                    <p className="mt-1 text-2xs text-ink-4">{r.applicationNumber}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 text-right font-semibold tabular-nums text-ink">{formatCurrency(r.requestedAmount)}</td>
              <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-5 py-3 text-right tabular-nums text-ink-4">{formatDate(r.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, loading: statsLoading, error: statsError, refresh: refreshStats } =
    useFetch<DashboardStats>(() => dashboardService.getDashboardStats(), []);

  const recentActivity   = stats?.recentActivity ?? [];
  const activationRate   = stats && stats.totalEmployees > 0 ? Math.round((stats.appActivatedEmployees / stats.totalEmployees) * 100) : 0;
  const totalRequests    = (stats?.approvedRequests ?? 0) + (stats?.disbursedRequests ?? 0) + (stats?.pendingLoanApplications ?? 0);
  const recoveryTotal    = (stats?.scheduledRecoveries ?? 0) + (stats?.overdueRecoveries ?? 0);
  const recoveryDone     = stats?.scheduledRecoveries ?? 0;

  const greeting = user?.name && !user.name.includes("@")
    ? user.name
    : user?.companyName || "there";

  if (statsError) return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-danger-bg bg-danger-soft px-5 py-4">
      <p className="text-sm text-danger">Failed to load dashboard. {statsError}</p>
      <button
        onClick={() => void refreshStats()}
        className="h-9 flex-shrink-0 rounded-lg border border-danger-bg bg-surface px-4 text-xs font-semibold text-danger transition-colors hover:bg-danger-soft"
      >
        Try again
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <Hero greeting={greeting} companyName={user?.companyName} />

      <AlertBanner tone="danger"  count={stats?.overdueRecoveries ?? 0}  noun="repayment"  to="/repayments" />
      <AlertBanner tone="warning" count={stats?.overdueSettlements ?? 0} noun="settlement" to="/settlements" />

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Employees" value={stats?.totalEmployees ?? 0} loading={statsLoading}
          helper={`${activationRate}% on app`} icon={<UsersRound size={18} strokeWidth={1.8} />}
          iconBg="bg-brand/10" iconColor="text-brand"
        />
        <MetricCard
          label="App Activated" value={stats?.appActivatedEmployees ?? 0} loading={statsLoading}
          helper="used MobPae app" icon={<BadgeCheck size={18} strokeWidth={1.8} />}
          iconBg="bg-success/10" iconColor="text-success"
        />
        <MetricCard
          label="Pending Requests" value={stats?.pendingLoanApplications ?? 0} loading={statsLoading}
          helper="awaiting approval" icon={<Clock3 size={18} strokeWidth={1.8} />}
          iconBg="bg-warning/10" iconColor="text-warning"
        />
        <MetricCard
          label="Settlement Due" value={formatCurrency(stats?.outstandingAmount ?? 0)} loading={statsLoading}
          helper="payable to MobPae" icon={<CircleDollarSign size={18} strokeWidth={1.8} />}
          iconBg="bg-danger/10" iconColor="text-danger"
        />
      </div>

      {/* Repayment cycle + Recent activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <div className="px-5 py-4">
            <p className="text-[15px] font-semibold text-ink">Repayment cycle</p>
            <p className="mt-0.5 text-xs text-ink-3">Salary deductions in progress</p>
          </div>
          <div className="flex flex-col gap-0 px-5 pb-2">
            {[
              { icon: <RefreshCcw size={13} className="text-brand" />, label: "Scheduled", value: stats?.scheduledRecoveries ?? 0, badge: "on track", tone: "bg-success/10 text-success", show: (stats?.scheduledRecoveries ?? 0) > 0 },
              { icon: <AlertTriangle size={13} className="text-danger" />, label: "Overdue", value: stats?.overdueRecoveries ?? 0, badge: "action needed", tone: "bg-danger/10 text-danger", show: (stats?.overdueRecoveries ?? 0) > 0 },
              { icon: <Landmark size={13} className="text-warning" />, label: "Pending settlements", value: stats?.pendingSettlements ?? 0, badge: "due soon", tone: "bg-warning/10 text-warning", show: (stats?.pendingSettlements ?? 0) > 0 },
              { icon: <CircleDollarSign size={13} className="text-ink-3" />, label: "Amount due", value: formatCurrency(stats?.recoveryAmountDue ?? 0), badge: null, tone: "", show: false },
            ].map((row, i, arr) => (
              <div key={i} className={`flex items-center justify-between py-2.5 ${i < arr.length - 1 ? "border-b border-edge-2" : ""}`}>
                <span className="flex items-center gap-2 text-xs text-ink-3">{row.icon}{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-ink">{row.value}</span>
                  {row.badge && row.show && (
                    <span className={`rounded-full px-2 py-0.5 text-2xs font-medium ${row.tone}`}>{row.badge}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!statsLoading && (
            <div className="px-5 pb-5 pt-2">
              <ProgressBar value={recoveryDone} max={recoveryTotal} label="Repayment coverage" />
            </div>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between border-b border-edge px-5 py-4">
            <div>
              <p className="text-[15px] font-semibold text-ink">Recent activity</p>
              <p className="mt-0.5 text-xs text-ink-3">Latest loan applications</p>
            </div>
            <Link to="/loan-applications" className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {statsLoading ? (
            <div className="flex flex-col gap-2 px-5 py-4">
              {[0, 1, 2, 3].map(i => <Sk key={i} className="h-9" />)}
            </div>
          ) : <RecentActivity rows={recentActivity} />}
        </Card>
      </div>

      {/* Insight strip */}
      <div className="flex items-center gap-3 rounded-2xl border border-brand-muted bg-brand-soft px-5 py-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-brand">
          <Sparkles size={14} />
        </div>
        <p className="flex-1 text-sm leading-relaxed text-ink-2">
          {activationRate >= 70
            ? <>App activation at <span className="font-semibold text-brand">{activationRate}%</span> — great adoption across your team!</>
            : activationRate > 0
            ? <>Only <span className="font-semibold text-brand">{activationRate}%</span> of employees have activated the app. Nudge the rest for faster processing.</>
            : <>Encourage employees to activate MobPae for instant advance access.</>
          }
        </p>
        <Link to="/employees" className="flex flex-shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline">
          View employees <ArrowRight size={11} />
        </Link>
      </div>

      {/* Summary mini-cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="mb-4 text-2xs font-semibold uppercase tracking-[0.06em] text-ink-4">Employees</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total", val: stats?.totalEmployees ?? 0, icon: <UsersRound size={13} />, tone: "bg-brand/10 text-brand" },
              { label: "Active", val: stats?.activeEmployees ?? 0, icon: <ShieldCheck size={13} />, tone: "bg-success/10 text-success" },
              { label: "On App", val: stats?.appActivatedEmployees ?? 0, icon: <BadgeCheck size={13} />, tone: "bg-warning/10 text-warning" },
            ].map(({ label, val, icon, tone }) => (
              <div key={label} className="text-center">
                <div className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
                <p className="text-lg font-bold tabular-nums leading-none text-ink">{val}</p>
                <p className="mt-1.5 text-2xs text-ink-4">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-4 text-2xs font-semibold uppercase tracking-[0.06em] text-ink-4">Loan Applications</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Pending", val: stats?.pendingLoanApplications ?? 0, color: "text-warning" },
              { label: "Approved", val: stats?.approvedRequests ?? 0, color: "text-brand" },
              { label: "Disbursed", val: stats?.disbursedRequests ?? 0, color: "text-success" },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center">
                <p className="text-lg font-bold tabular-nums leading-none text-ink">{val}</p>
                <p className={`mt-1.5 text-2xs ${color}`}>{label}</p>
                <p className="text-2xs text-ink-disabled">
                  {totalRequests > 0 ? Math.round((val / totalRequests) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-4 text-2xs font-semibold uppercase tracking-[0.06em] text-ink-4">Settlements</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Pending", val: String(stats?.pendingSettlements ?? 0), color: "text-warning" },
              { label: "Overdue", val: String(stats?.overdueSettlements ?? 0), color: "text-danger" },
              { label: "Outstanding", val: formatCurrency(stats?.outstandingAmount ?? 0), color: "text-brand" },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center">
                <p className="break-all text-sm font-bold leading-tight tabular-nums text-ink">{val}</p>
                <p className={`mt-1.5 text-2xs ${color}`}>{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
