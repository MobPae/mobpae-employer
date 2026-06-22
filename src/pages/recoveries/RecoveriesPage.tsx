import { ArrowDownCircle, CircleDollarSign, Clock3, Search, UsersRound } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { payrollService } from "../../services/payroll.service";
import type { Repayment } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { useMemo, useState } from "react";

// ── status pill ───────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  SCHEDULED: { label: "Scheduled", dot: "bg-[#D45F18]", text: "text-[#9A4910]", bg: "bg-[#FEF1E7]" },
  PENDING:   { label: "Scheduled", dot: "bg-[#D45F18]", text: "text-[#9A4910]", bg: "bg-[#FEF1E7]" },
  PAID:      { label: "Recovered", dot: "bg-[#4E8A18]", text: "text-[#3B6D11]", bg: "bg-[#EBF6E3]" },
  OVERDUE:   { label: "Overdue", dot: "bg-red-400", text: "text-red-600", bg: "bg-red-50" },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? { label: status, bg: "bg-[#F0F0F8]", text: "text-[#62657A]", dot: "bg-[#B7B9C7]" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-[500] ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ── filter chips ──────────────────────────────────────────────────────────────

const FILTERS = [
  { label: "All",       value: "ALL"       },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Recovered", value: "PAID"      },
  { label: "Overdue",   value: "OVERDUE"   },
] as const;

type FilterValue = "ALL" | "SCHEDULED" | "PAID" | "OVERDUE";

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, iconBg, iconColor, sub }: {
  label: string; value: React.ReactNode; icon: React.ReactNode;
  iconBg: string; iconColor: string; sub?: string;
}) {
  return (
    <div className="bg-white border border-[#E4E4EF] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-[500] text-[#62657A]">{label}</span>
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>{icon}</div>
      </div>
      <div>
        <p className="text-[20px] font-[700] text-[#191A2E] tracking-[-0.02em] leading-none">{value}</p>
        {sub && <p className="text-[11px] text-[#62657A] mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function RecoveriesPage() {
  const [query,  setQuery]  = useState("");
  const [filter, setFilter] = useState<FilterValue>("ALL");

  const { data: summary } = useFetch(() => payrollService.getPayrollSummary(), []);
  const { data: recoveriesRaw, loading, error, refresh } = useFetch<Repayment[]>(
    () => payrollService.getUpcomingRecoveries(), []
  );
  const recoveries = recoveriesRaw ?? [];

  // Normalise legacy PENDING → SCHEDULED so filters work correctly
  const normaliseStatus = (s: string) => (s === "PENDING" ? "SCHEDULED" : s);

  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: recoveries.length };
    recoveries.forEach(r => {
      const ns = normaliseStatus(r.status);
      m[ns] = (m[ns] ?? 0) + 1;
    });
    return m;
  }, [recoveries]);

  const filtered = useMemo(() =>
    recoveries.filter(r => {
      const q = `${r.employeeName} ${r.salaryRequestId}`.toLowerCase();
      const ns = normaliseStatus(r.status);
      return q.includes(query.toLowerCase()) && (filter === "ALL" || ns === filter);
    }),
    [recoveries, query, filter]
  );

  const totalPending  = recoveries.filter(r => r.status !== "PAID").reduce((s, r) => s + r.totalAmount, 0);
  const totalRecovered = recoveries.filter(r => r.status === "PAID").reduce((s, r) => s + r.totalAmount, 0);

  if (error) {
    return (
      <div className="bg-white border border-red-100 rounded-xl px-6 py-14 text-center">
        <p className="text-[13px] font-[500] text-red-600">Failed to load recoveries</p>
        <p className="text-[12px] text-[#62657A] mt-1">{error}</p>
        <button onClick={refresh} className="mt-4 h-8 px-4 text-[12px] font-[500] bg-white border border-[#E4E4EF] rounded-lg hover:bg-[#F7F7FB] transition-colors text-[#62657A]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-[#ECEBFF]/60 border border-[#E4E4EF] rounded-xl px-4 py-3 flex items-start gap-3">
        <ArrowDownCircle size={15} className="text-[#7679FF] mt-0.5 flex-shrink-0" />
        <p className="text-[12px] text-[#5659D9] leading-relaxed">
          Recoveries are deducted automatically from employee payroll. MobPae settles these amounts with your company each payroll cycle.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Employees due"
          value={summary?.employeesDue ?? "—"}
          icon={<UsersRound size={14} />}
          iconBg="bg-[#F0F0F8]" iconColor="text-[#62657A]"
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
          iconBg="bg-[#ECEBFF]" iconColor="text-[#7679FF]"
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
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#62657A]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search employee or request…"
            className="w-full h-9 pl-8 pr-3 text-[13px] bg-white border border-[#E4E4EF] rounded-lg focus:outline-none focus:border-[#7679FF] focus:ring-2 focus:ring-[#7679FF]/10 transition placeholder-[#B7B9C7] text-[#191A2E]"
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
                ? "bg-[#191A2E] text-white"
                : "bg-white border border-[#E4E4EF] text-[#62657A] hover:border-[#E4E4EF]"
            }`}
          >
            {f.label}
            {counts[f.value] !== undefined && (
              <span className={`text-[11px] font-[700] ${filter === f.value ? "text-white/60" : "text-[#62657A]"}`}>
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E4E4EF] rounded-xl overflow-hidden">
        {loading ? (
          <div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#F0F0F8] last:border-0">
                <div className="w-7 h-7 rounded-lg bg-[#F0F0F8] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-28 bg-[#F0F0F8] rounded animate-pulse" />
                  <div className="h-2 w-16 bg-[#F0F0F8] rounded animate-pulse" />
                </div>
                <div className="h-2.5 w-16 bg-[#F0F0F8] rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-[#F0F0F8] rounded animate-pulse" />
                <div className="h-4 w-14 bg-[#F0F0F8] rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="py-14 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#F0F0F8] flex items-center justify-center mb-3 mx-auto">
              <span className="text-[#62657A] text-[18px]">↩</span>
            </div>
            <p className="text-[13px] font-[500] text-[#62657A]">No recoveries found</p>
            <p className="text-[12px] text-[#62657A] mt-1">Payroll deductions will appear here</p>
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
                <tr className="border-b border-[#E4E4EF]">
                  {["Employee", "Salary Request", "Principal", "Interest", "Total Deduction", "Due Date", "Status"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-[500] text-[#62657A]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F8]">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-[#F7F7FB]/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-[#F0F0F8] flex items-center justify-center text-[9px] font-[700] text-[#62657A] flex-shrink-0">
                          {r.employeeName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-[500] text-[#191A2E] truncate">{r.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[#62657A] truncate">{r.salaryRequestId}</td>
                    <td className="px-5 py-3 tabular-nums text-[#62657A]">{formatCurrency(r.principalAmount)}</td>
                    <td className="px-5 py-3 tabular-nums text-[#62657A]">{formatCurrency(r.interestAmount)}</td>
                    <td className="px-5 py-3 tabular-nums font-[600] text-[#191A2E]">{formatCurrency(r.totalAmount)}</td>
                    <td className={`px-5 py-3 tabular-nums ${r.status === "OVERDUE" ? "text-red-600 font-[500]" : "text-[#62657A]"}`}>
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
