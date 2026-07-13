import { useMemo, useState } from "react";
import { AlertCircle, ArrowDownCircle, CheckCircle2, CircleDollarSign, Clock, Clock3, RefreshCw, Search, UsersRound } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { repaymentService } from "../../services/repayment.service";
import { payrollService } from "../../services/payroll.service";
import { formatCurrency, formatDate } from "../../utils/formatters";

// ── constants ─────────────────────────────────────────────────────────────────
const T1  = "var(--color-ink)";
const T2  = "var(--color-ink-3)";
const T3  = "var(--color-ink-4)";
const P   = "var(--color-brand)";


const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING:   { label: "Pending",   bg: "var(--color-warning-bg)", text: "var(--color-warning-dark)", dot: "var(--color-warning)" },
  SCHEDULED: { label: "Scheduled", bg: "var(--color-warning-soft)", text: "var(--color-warning-dark)", dot: "var(--color-warning-dark)" },
  PAID:      { label: "Recovered", bg: "var(--color-success-bg)", text: "var(--color-success)", dot: "var(--color-success)" },
  OVERDUE:   { label: "Overdue",   bg: "var(--color-danger-bg)", text: "var(--color-danger)", dot: "var(--color-danger)" },
};

const FILTERS = [
  { label: "All",       value: "ALL"       },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Recovered", value: "PAID"      },
  { label: "Overdue",   value: "OVERDUE"   },
] as const;

type FilterValue = "ALL" | "SCHEDULED" | "PAID" | "OVERDUE";
type Tab = "cycle" | "all";

// ── sub-components ────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? { label: status, bg: "var(--color-surface-muted)", text: "var(--color-ink-3)", dot: "var(--color-ink-4)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999,
      fontSize: 11.5, fontWeight: 600, background: c.bg, color: c.text,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function StatCard({ label, value, icon, iconBg, iconColor, sub, loading }: {
  label: string; value: React.ReactNode; icon: React.ReactNode;
  iconBg: string; iconColor: string; sub?: string; loading?: boolean;
}) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14, flex: 1, minWidth: 0, boxShadow: "0 1px 4px rgba(17,24,39,0.04)" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: iconColor }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11.5, fontWeight: 500, color: T3, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
        {loading
          ? <div className="animate-pulse" style={{ height: 24, width: 80, background: "var(--color-surface-muted)", borderRadius: 6, marginTop: 6 }} />
          : <p style={{ fontSize: 20, fontWeight: 700, color: T1, margin: "4px 0 0", fontVariantNumeric: "tabular-nums" }}>{value}</p>
        }
        {!loading && sub && <p style={{ fontSize: 11.5, color: T3, marginTop: 2 }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── this-cycle tab ────────────────────────────────────────────────────────────

function ThisCycleTab() {
  const [filter, setFilter] = useState<FilterValue>("ALL");
  const [search, setSearch] = useState("");

  const { data: summary } = useFetch(() => payrollService.getPayrollSummary(), []);
  const { data: raw, loading, error, refresh } = useFetch(() => payrollService.getUpcomingRecoveries(), []);
  const rows = raw ?? [];

  const normalise = (s: string) => s === "PENDING" ? "SCHEDULED" : s;

  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: rows.length };
    rows.forEach(r => { const ns = normalise(r.status); m[ns] = (m[ns] ?? 0) + 1; });
    return m;
  }, [rows]);

  const filtered = useMemo(() =>
    rows.filter(r => {
      const q = `${r.employeeName} ${r.loanApplicationId}`.toLowerCase();
      const ns = normalise(r.status);
      return q.includes(search.toLowerCase()) && (filter === "ALL" || ns === filter);
    }),
    [rows, search, filter]
  );

  const totalPending   = rows.filter(r => r.status !== "PAID").reduce((s, r) => s + r.totalAmount, 0);
  const totalRecovered = rows.filter(r => r.status === "PAID").reduce((s, r) => s + r.totalAmount, 0);

  if (error) return (
    <div style={{ background: "white", border: "1px solid #FEE2E2", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-danger)", margin: 0 }}>Failed to load recoveries</p>
      <button onClick={refresh} style={{ marginTop: 12, height: 32, padding: "0 16px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 500, cursor: "pointer", color: T2, fontFamily: "inherit" }}>Retry</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Info banner */}
      <div style={{ background: "var(--color-brand-soft)", border: "1px solid #C7D4FF", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <ArrowDownCircle size={14} style={{ color: P, marginTop: 1, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: "var(--color-info)", margin: 0, lineHeight: 1.5 }}>
          Recoveries are grouped into a settlement after your payroll cutoff date. They move to Recovered once MobPae confirms the settlement payment.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Employees due" value={summary?.employeesDue ?? "—"} icon={<UsersRound size={16} />} iconBg="var(--color-surface-muted)" iconColor="var(--color-ink-4)" loading={loading} />
        <StatCard label="Pending recovery" value={formatCurrency(totalPending)} icon={<Clock3 size={16} />} iconBg="var(--color-warning-soft)" iconColor="var(--color-warning-dark)" sub="awaiting settlement" loading={loading} />
        <StatCard label="Recovered this cycle" value={formatCurrency(totalRecovered)} icon={<CircleDollarSign size={16} />} iconBg="var(--color-success-bg)" iconColor="var(--color-success)" loading={loading} />
        <StatCard label="Active exposure" value={formatCurrency(summary?.totalRecoveryAmount ?? 0)} icon={<CircleDollarSign size={16} />} iconBg="#EDE9FE" iconColor="#7C3AED" sub="all active advances" loading={loading} />
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={{
              height: 30, padding: "0 12px", borderRadius: 20,
              border: filter === f.value ? `1.5px solid ${P}` : "1.5px solid #E5E7EB",
              background: filter === f.value ? "var(--color-brand-soft)" : "var(--color-surface)",
              color: filter === f.value ? P : T2,
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              {f.label}{counts[f.value] !== undefined ? ` ${counts[f.value]}` : ""}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative", width: 220 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T3 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…"
            style={{ width: "100%", height: 32, paddingLeft: 30, paddingRight: 10, border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 12.5, color: T1, background: "white", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
        </div>
        <button onClick={refresh} style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T3 }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(17,24,39,0.04)" }}>
        {loading ? (
          <div>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 16, padding: "14px 20px", borderBottom: "1px solid #F9FAFB" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--color-surface-muted)", flexShrink: 0, animation: "pulse 1.5s infinite" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ height: 10, width: 120, background: "var(--color-surface-muted)", borderRadius: 4 }} />
                  <div style={{ height: 8, width: 80, background: "var(--color-surface-muted)", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: T2, margin: 0 }}>No recoveries found</p>
            <p style={{ fontSize: 12, color: T3, marginTop: 4 }}>Salary deductions appear here after advances are disbursed</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-raised)", borderBottom: "1px solid var(--color-edge-2)" }}>
                  {["Employee", "Salary Request", "Principal", "Interest", "Total Deduction", "Due Date", "Settlement", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const ac = ["#315eff","#10B981","#F59E0B","#EF4444","#3B82F6","#EC4899"][i % 6];
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F9FAFB" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--color-surface-raised)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: ac, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                            {r.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: T1 }}>{r.employeeName}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12.5, color: T2, fontFamily: "ui-monospace, monospace", verticalAlign: "middle" }}>{r.loanApplicationId}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: T2, fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>{formatCurrency(r.principalAmount)}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: T2, fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>{formatCurrency(r.interestAmount)}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: T1, fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>{formatCurrency(r.totalAmount)}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: r.status === "OVERDUE" ? "var(--color-danger)" : "var(--color-ink-3)", fontWeight: r.status === "OVERDUE" ? 600 : 400, fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>
                        {formatDate(r.dueDate)}
                      </td>
                      <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                        {r.settlementId ? (
                          <span style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 9px", borderRadius: 999, background: "var(--color-brand-soft)", color: "var(--color-info)", fontSize: 11, fontWeight: 600 }}>In settlement</span>
                        ) : (
                          <span style={{ fontSize: 12, color: T3 }}>Not yet</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", verticalAlign: "middle" }}><StatusPill status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--color-edge-2)", background: "var(--color-surface-raised)" }}>
            <p style={{ fontSize: 12, color: T3, margin: 0 }}>{filtered.length} {filtered.length === 1 ? "recovery" : "recoveries"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── all-time tab ──────────────────────────────────────────────────────────────

function AllTimeTab() {
  const [filter, setFilter] = useState<FilterValue>("ALL");
  const [search, setSearch] = useState("");

  const { data: raw, loading, error, refresh } = useFetch(() => repaymentService.getRepayments(), []);
  const rows = raw ?? [];

  const counts = useMemo(() => {
    const c: Record<string, number> = { SCHEDULED: 0, PAID: 0, OVERDUE: 0 };
    rows.forEach(r => {
      const ns = r.status === "PENDING" ? "SCHEDULED" : r.status;
      if (c[ns] !== undefined) c[ns]++;
    });
    return c;
  }, [rows]);

  const totalOutstanding = useMemo(() =>
    rows.filter(r => r.status !== "PAID").reduce((s, r) => s + r.totalAmount, 0), [rows]);
  const totalRecovered = useMemo(() =>
    rows.filter(r => r.status === "PAID").reduce((s, r) => s + r.totalAmount, 0), [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== "ALL") list = list.filter(r => {
      const ns = r.status === "PENDING" ? "SCHEDULED" : r.status;
      return ns === filter;
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.employeeName.toLowerCase().includes(q) ||
        (r as any).employeeCode?.toLowerCase().includes(q) ||
        r.loanApplicationId.toLowerCase().includes(q),
      );
    }
    return list;
  }, [rows, filter, search]);

  if (error) return (
    <div style={{ background: "white", border: "1px solid #FEE2E2", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-danger)", margin: 0 }}>Failed to load repayments</p>
      <button onClick={refresh} style={{ marginTop: 12, height: 32, padding: "0 16px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: "white", fontSize: 12, fontWeight: 500, cursor: "pointer", color: T2, fontFamily: "inherit" }}>Retry</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stat cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Outstanding" value={formatCurrency(totalOutstanding)} icon={<Clock size={16} />} iconBg="var(--color-warning-soft)" iconColor="var(--color-warning-dark)" sub={`${(counts.SCHEDULED || 0)} scheduled`} loading={loading} />
        <StatCard label="Overdue" value={String(counts.OVERDUE || 0)} icon={<AlertCircle size={16} />} iconBg="var(--color-danger-bg)" iconColor="var(--color-danger)" sub="require attention" loading={loading} />
        <StatCard label="Total recovered" value={formatCurrency(totalRecovered)} icon={<CheckCircle2 size={16} />} iconBg="var(--color-success-bg)" iconColor="var(--color-success)" sub={`${counts.PAID || 0} completed`} loading={loading} />
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={{
              height: 30, padding: "0 12px", borderRadius: 20,
              border: filter === f.value ? `1.5px solid ${P}` : "1.5px solid #E5E7EB",
              background: filter === f.value ? "var(--color-brand-soft)" : "var(--color-surface)",
              color: filter === f.value ? P : T2,
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              {f.label}
              {f.value !== "ALL" && counts[f.value] !== undefined ? ` ${counts[f.value]}` : f.value === "ALL" ? ` ${rows.length}` : ""}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative", width: 220 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T3 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee or ID…"
            style={{ width: "100%", height: 32, paddingLeft: 30, paddingRight: 10, border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 12.5, color: T1, background: "white", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
        </div>
        <button onClick={refresh} style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T3 }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(17,24,39,0.04)" }}>
        {loading ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: T3, margin: 0 }}>Loading repayments…</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-raised)", borderBottom: "1px solid var(--color-edge-2)" }}>
                  {["Employee", "Salary Request", "Principal", "Interest", "Total", "Due Date", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!filtered.length ? (
                  <tr><td colSpan={7} style={{ padding: "48px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: T2, margin: 0 }}>No repayments found</p>
                    <p style={{ fontSize: 12, color: T3, marginTop: 4 }}>Try adjusting your filters</p>
                  </td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F9FAFB" : "none" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--color-surface-raised)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T1, margin: 0 }}>{r.employeeName}</p>
                      <p style={{ fontSize: 11.5, color: T3, margin: "2px 0 0", fontFamily: "ui-monospace, monospace" }}>{(r as any).employeeCode}</p>
                    </td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", fontSize: 12, color: T2, fontFamily: "ui-monospace, monospace" }}>
                      {r.loanApplicationId.slice(0, 8)}…
                    </td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", fontSize: 13, color: T2, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(r.principalAmount)}</td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", fontSize: 13, color: T2, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(r.interestAmount)}</td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", fontSize: 13, fontWeight: 700, color: T1, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(r.totalAmount)}</td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", fontSize: 13, color: r.status === "OVERDUE" ? "var(--color-danger)" : "var(--color-ink-3)" }}>
                      {r.dueDate ? formatDate(r.dueDate) : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--color-edge-2)", background: "var(--color-surface-raised)" }}>
            <p style={{ fontSize: 12, color: T3, margin: 0 }}>Showing {filtered.length} of {rows.length} repayments</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function RepaymentsPage() {
  const [tab, setTab] = useState<Tab>("cycle");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T1, margin: 0 }}>Repayments</h1>
        <p style={{ fontSize: 13, color: T2, marginTop: 4 }}>Track salary deductions and settlement cycles for your employees' advances</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1.5px solid #E5E7EB" }}>
        {([
          { id: "cycle", label: "This Cycle" },
          { id: "all",   label: "All Time"   },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              height: 40, padding: "0 18px", border: "none", background: "transparent",
              fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              color: tab === t.id ? P : T2,
              borderBottom: tab === t.id ? `2px solid ${P}` : "2px solid transparent",
              marginBottom: -1.5,
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "cycle" ? <ThisCycleTab /> : <AllTimeTab />}
    </div>
  );
}
