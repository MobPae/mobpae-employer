import {
  ArrowDownCircle,
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { dashboardService } from "../../services/dashboard.service";
import type { DashboardStats, SalaryRequest } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

// ── status pill ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING:              { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
  SUBMITTED:            { bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-400"     },
  UNDER_REVIEW:         { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400"  },
  APPROVED:             { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  REJECTED:             { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400"     },
  DISBURSED:            { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400"    },
  REPAID:               { bg: "bg-slate-100",  text: "text-slate-500",   dot: "bg-slate-400"   },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  const label = status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-[500] ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, iconBg, iconColor, sub }: {
  label: string; value: string | number; icon: React.ReactNode;
  iconBg: string; iconColor: string; sub?: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-[500] text-slate-500">{label}</span>
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>{icon}</div>
      </div>
      <div>
        <p className="text-[22px] font-[700] text-slate-900 tracking-[-0.02em] leading-none">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── recent requests table ─────────────────────────────────────────────────────

function RecentRequests({ requests }: { requests: SalaryRequest[] }) {
  if (!requests.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
          <WalletCards size={18} className="text-slate-400" />
        </div>
        <p className="text-[13px] font-[500] text-slate-600">No recent requests</p>
        <p className="text-[12px] text-slate-400 mt-1">Salary requests will appear here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left pb-2.5 text-[11px] font-[500] text-slate-400 pr-4">Employee</th>
            <th className="text-right pb-2.5 text-[11px] font-[500] text-slate-400 pr-4">Requested</th>
            <th className="text-right pb-2.5 text-[11px] font-[500] text-slate-400 pr-4">Approved</th>
            <th className="text-left pb-2.5 text-[11px] font-[500] text-slate-400 pr-4">Status</th>
            <th className="text-right pb-2.5 text-[11px] font-[500] text-slate-400">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {requests.map(r => (
            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-[700] text-slate-500 flex-shrink-0">
                    {r.employeeName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-[500] text-slate-800 leading-none">{r.employeeName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{r.requestId}</p>
                  </div>
                </div>
              </td>
              <td className="py-2.5 pr-4 text-right font-[600] text-slate-700 tabular-nums">{formatCurrency(r.requestedAmount)}</td>
              <td className="py-2.5 pr-4 text-right font-[600] text-slate-700 tabular-nums">
                {r.approvedAmount ? formatCurrency(r.approvedAmount) : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-2.5 pr-4"><StatusPill status={r.status} /></td>
              <td className="py-2.5 text-right text-slate-400 tabular-nums">{formatDate(r.createdDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: stats, loading, error } = useFetch<DashboardStats>(
    () => dashboardService.getDashboardStats(), []
  );

  const recentRequests = stats?.recentSalaryRequests ?? [];
  const activationRate = stats && stats.totalEmployees > 0
    ? Math.round((stats.appActivatedEmployees / stats.totalEmployees) * 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border border-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-5">
        <p className="text-[13px] font-[500] text-red-700">Failed to load dashboard</p>
        <p className="text-[12px] text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
        <StatCard label="Total Employees"   value={stats?.totalEmployees ?? 0}
          icon={<UsersRound size={14} />}      iconBg="bg-slate-100"  iconColor="text-slate-600" />
        <StatCard label="Active Employees"  value={stats?.activeEmployees ?? 0}
          icon={<ShieldCheck size={14} />}     iconBg="bg-emerald-50" iconColor="text-emerald-600" sub="on payroll" />
        <StatCard label="App Activated"     value={stats?.appActivatedEmployees ?? 0}
          icon={<BadgeCheck size={14} />}      iconBg="bg-blue-50"    iconColor="text-blue-600" sub={`${activationRate}% of total`} />
        <StatCard label="Pending Requests"  value={stats?.pendingSalaryRequests ?? 0}
          icon={<Clock3 size={14} />}          iconBg="bg-amber-50"   iconColor="text-amber-600" sub="awaiting approval" />
        <StatCard label="Approved Requests" value={stats?.approvedRequests ?? 0}
          icon={<ArrowDownCircle size={14} />} iconBg="bg-violet-50"  iconColor="text-violet-600" sub="in recovery" />
        <StatCard label="Recovery Exposure" value={formatCurrency(stats?.outstandingAmount ?? 0)}
          icon={<CircleDollarSign size={14} />} iconBg="bg-rose-50"   iconColor="text-rose-600" sub="total outstanding" />
      </div>

      {/* Recent salary requests */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-[600] text-slate-900">Recent Salary Requests</p>
            <p className="text-[12px] text-slate-400 mt-0.5">Latest EWA activity from your team</p>
          </div>
          <Link to="/salary-requests" className="flex items-center gap-1.5 text-[12px] font-[500] text-blue-600 hover:text-blue-700 transition-colors">
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div className="px-5 py-3">
          <RecentRequests requests={recentRequests} />
        </div>
      </div>
    </div>
  );
}
