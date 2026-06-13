import { ArrowDownCircle, CircleDollarSign, Clock3, Search, UsersRound } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { payrollService } from "../../services/payroll.service";
import type { Repayment } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { useMemo, useState } from "react";

// ── status pill ───────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: { label: "Pending",  bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
  PAID:    { label: "Recovered",bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  OVERDUE: { label: "Overdue",  bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400"     },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? { label: status, bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-[500] ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ── filter chips ──────────────────────────────────────────────────────────────

const FILTERS = [
  { label: "All",       value: "ALL"     },
  { label: "Pending",   value: "PENDING" },
  { label: "Recovered", value: "PAID"    },
  { label: "Overdue",   value: "OVERDUE" },
] as const;

type FilterValue = "ALL" | "PENDING" | "PAID" | "OVERDUE";

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, iconBg, iconColor, sub }: {
  label: string; value: React.ReactNode; icon: React.ReactNode;
  iconBg: string; iconColor: string; sub?: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-[500] text-slate-500">{label}</span>
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>{icon}</div>
      </div>
      <div>
        <p className="text-[20px] font-[700] text-slate-900 tracking-[-0.02em] leading-none">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function RecoveriesPage() {
  const [query,  setQuery]  = useState("");
  const [filter, setFilter] = useState<FilterValue>("ALL");

  const { data: summary } = useFetch(() => payrollService.getPayrollSummary(), []);
  const { data: recoveriesRaw, loading, error } = useFetch<Repayment[]>(
    () => payrollService.getUpcomingRecoveries(), []
  );
  const recoveries = recoveriesRaw ?? [];

  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: recoveries.length };
    recoveries.forEach(r => { m[r.status] = (m[r.status] ?? 0) + 1; });
    return m;
  }, [recoveries]);

  const filtered = useMemo(() =>
    recoveries.filter(r => {
      const q = `${r.employeeName} ${r.salaryRequestId}`.toLowerCase();
      return q.includes(query.toLowerCase()) && (filter === "ALL" || r.status === filter);
    }),
    [recoveries, query, filter]
  );

  const totalPending  = recoveries.filter(r => r.status !== "PAID").reduce((s, r) => s + r.totalAmount, 0);
  const totalRecovered = recoveries.filter(r => r.status === "PAID").reduce((s, r) => s + r.totalAmount, 0);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-5">
        <p className="text-[13px] font-[500] text-red-700">Failed to load recoveries</p>
        <p className="text-[12px] text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
        <ArrowDownCircle size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-[12px] text-blue-700 leading-relaxed">
          Recoveries are deducted automatically from employee payroll. MobPae settles these amounts with your company each payroll cycle.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Employees due"
          value={summary?.employeesDue ?? "—"}
          icon={<UsersRound size={14} />}
          iconBg="bg-slate-100" iconColor="text-slate-600"
        />
        <StatCard
          label="Pending recovery"
          value={formatCurrency(totalPending)}
          icon={<Clock3 size={14} />}
          iconBg="bg-amber-50" iconColor="text-amber-600"
          sub="to be deducted"
        />
        <StatCard
          label="Recovered"
          value={formatCurrency(totalRecovered)}
          icon={<CircleDollarSign size={14} />}
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
          sub="this cycle"
        />
        <StatCard
          label="Total exposure"
          value={formatCurrency(summary?.totalRecoveryAmount ?? 0)}
          icon={<CircleDollarSign size={14} />}
          iconBg="bg-violet-50" iconColor="text-violet-600"
          sub="all active advances"
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[280px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search employee or request…"
            className="w-full h-9 pl-8 pr-3 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder-slate-400 text-slate-800"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`h-7 px-3 rounded-full text-[12px] font-[500] transition-colors flex items-center gap-1.5 ${
              filter === f.value
                ? "bg-slate-900 text-white"
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
            <p className="text-[13px] text-slate-400">Loading recoveries…</p>
          </div>
        ) : !filtered.length ? (
          <div className="py-16 text-center">
            <p className="text-[13px] font-[500] text-slate-500">No recoveries found</p>
            <p className="text-[12px] text-slate-400 mt-1">Payroll deductions will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-[12px]">
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100">
                  {["Employee", "Salary Request", "Principal", "Interest", "Total Deduction", "Due Date", "Status"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-[500] text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-[700] text-slate-500 flex-shrink-0">
                          {r.employeeName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-[500] text-slate-800 truncate">{r.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 truncate">{r.salaryRequestId}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-600">{formatCurrency(r.principalAmount)}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-500">{formatCurrency(r.interestAmount)}</td>
                    <td className="px-5 py-3 tabular-nums font-[600] text-slate-800">{formatCurrency(r.totalAmount)}</td>
                    <td className={`px-5 py-3 tabular-nums ${r.status === "OVERDUE" ? "text-red-600 font-[500]" : "text-slate-500"}`}>
                      {formatDate(r.dueDate)}
                    </td>
                    <td className="px-5 py-3"><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
