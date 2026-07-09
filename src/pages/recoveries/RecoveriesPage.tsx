import { ArrowDownCircle, CircleDollarSign, Clock3, Search, UsersRound } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { payrollService } from "../../services/payroll.service";
import type { Repayment } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { useMemo, useState } from "react";

// ── status pill ───────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  SCHEDULED: { label: "Scheduled", bg: "#FEF3C7", text: "#D97706" },
  PENDING:   { label: "Scheduled", bg: "#FEF3C7", text: "#D97706" },
  PAID:      { label: "Recovered", bg: "#DCFCE7", text: "#16A34A" },
  OVERDUE:   { label: "Overdue",   bg: "#FEE2E2", text: "#DC2626" },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? { label: status, bg: "#F3F4F6", text: "#6B7280" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 500, background: c.bg, color: c.text }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.text, flexShrink: 0 }} />
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
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 1px 4px rgba(17,24,39,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: iconColor, flexShrink: 0 }}>{icon}</div>
      </div>
      <div>
        <p style={{ fontSize: 20, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{sub}</p>}
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
      const q = `${r.employeeName} ${r.loanApplicationId}`.toLowerCase();
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
        <p className="text-[12px] text-[#6B7280] mt-1">{error}</p>
        <button onClick={refresh} className="mt-4 h-8 px-4 text-[12px] font-[500] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F7F7FB] transition-colors text-[#6B7280]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", letterSpacing: "-0.025em", margin: 0 }}>Recoveries</h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Track deductions that will be included in MobPae settlement cycles</p>
      </div>

      {/* Info banner */}
      <div className="bg-[#EEF2FF]/60 border border-[#E5E7EB] rounded-xl px-4 py-3 flex items-start gap-3">
        <ArrowDownCircle size={15} className="text-[#315eff] mt-0.5 flex-shrink-0" />
        <p className="text-[12px] text-[#2048EE] leading-relaxed">
          Recoveries are grouped into a settlement after your cutoff and salary date. They move to Recovered only after MobPae confirms the settlement payment.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Employees due"
          value={summary?.employeesDue ?? "—"}
          icon={<UsersRound size={14} />}
          iconBg="bg-[#F3F4F6]" iconColor="text-[#6B7280]"
        />
        <StatCard
          label="Pending recovery"
          value={formatCurrency(totalPending)}
          icon={<Clock3 size={14} />}
          iconBg="bg-amber-50" iconColor="text-amber-600"
          sub="awaiting settlement"
        />
        <StatCard
          label="Recovered"
          value={formatCurrency(totalRecovered)}
          icon={<CircleDollarSign size={14} />}
          iconBg="bg-[#EEF2FF]" iconColor="text-[#315eff]"
          sub="this cycle"
        />
        <StatCard
          label="Active exposure"
          value={formatCurrency(summary?.totalRecoveryAmount ?? 0)}
          icon={<CircleDollarSign size={14} />}
          iconBg="bg-violet-50" iconColor="text-violet-600"
          sub="all active advances"
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[280px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search employee or request…"
            className="w-full h-9 pl-8 pr-3 text-[13px] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#315eff] focus:ring-2 focus:ring-[#315eff]/10 transition placeholder-[#B7B9C7] text-[#111827]"
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
                ? "bg-[#111827] text-white"
                : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#E5E7EB]"
            }`}
          >
            {f.label}
            {counts[f.value] !== undefined && (
              <span className={`text-[11px] font-[700] ${filter === f.value ? "text-white/60" : "text-[#6B7280]"}`}>
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(17,24,39,0.04)" }}>
        {loading ? (
          <div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#F9FAFB] last:border-0">
                <div className="w-7 h-7 rounded-lg bg-[#F3F4F6] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-28 bg-[#F3F4F6] rounded animate-pulse" />
                  <div className="h-2 w-16 bg-[#F3F4F6] rounded animate-pulse" />
                </div>
                <div className="h-2.5 w-16 bg-[#F3F4F6] rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-[#F3F4F6] rounded animate-pulse" />
                <div className="h-4 w-14 bg-[#F3F4F6] rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="py-14 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center mb-3 mx-auto">
              <span className="text-[#6B7280] text-[18px]">↩</span>
            </div>
            <p className="text-[13px] font-[500] text-[#6B7280]">No recoveries found</p>
            <p className="text-[12px] text-[#6B7280] mt-1">Salary deductions will appear here</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                  {["Employee", "Salary Request", "Principal", "Interest", "Total Deduction", "Due Date", "Settlement", "Status"].map(h => (
                    <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const ac = ["#315eff","#10B981","#F59E0B","#EF4444","#3B82F6","#EC4899"][i % 6];
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F9FAFB", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFC"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: ac, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                            {r.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{r.employeeName}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 13, color: "#6B7280", fontFamily: "ui-monospace, monospace", verticalAlign: "middle" }}>{r.loanApplicationId}</td>
                      <td style={{ padding: "16px 20px", fontSize: 13.5, color: "#6B7280", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>{formatCurrency(r.principalAmount)}</td>
                      <td style={{ padding: "16px 20px", fontSize: 13.5, color: "#6B7280", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>{formatCurrency(r.interestAmount)}</td>
                      <td style={{ padding: "16px 20px", fontSize: 13.5, fontWeight: 600, color: "#111827", fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>{formatCurrency(r.totalAmount)}</td>
                      <td style={{ padding: "16px 20px", fontSize: 13, fontVariantNumeric: "tabular-nums", color: r.status === "OVERDUE" ? "#DC2626" : "#6B7280", fontWeight: r.status === "OVERDUE" ? 600 : 400, verticalAlign: "middle" }}>
                        {formatDate(r.dueDate)}
                      </td>
                      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                        {r.settlementId ? (
                          <span style={{ display: "inline-flex", alignItems: "center", height: 24, padding: "0 9px", borderRadius: 999, background: "#EEF2FF", color: "#2048EE", fontSize: 11, fontWeight: 600 }}>
                            In settlement
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: "#9CA3AF" }}>Not generated</span>
                        )}
                      </td>
                      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}><StatusPill status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Footer strip */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>{filtered.length} {filtered.length === 1 ? "recovery" : "recoveries"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
