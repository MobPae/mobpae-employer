import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowDownCircle, CheckCircle2, CircleDollarSign, Clock, Clock3, Download, RefreshCw, Search, UsersRound } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { useToast } from "../../hooks/useToast";
import { repaymentService } from "../../services/repayment.service";
import { payrollService } from "../../services/payroll.service";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { Button } from "../../components/ui/Button";
import { exportToCsv } from "../../utils/exportCsv";

// ── status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING:   { label: "Pending",   bg: "bg-warning-bg",   text: "text-warning-dark", dot: "bg-warning" },
  SCHEDULED: { label: "Scheduled", bg: "bg-warning-soft", text: "text-warning-dark", dot: "bg-warning-dark" },
  PAID:      { label: "Repaid",    bg: "bg-success-bg",   text: "text-success",      dot: "bg-success" },
  OVERDUE:   { label: "Overdue",   bg: "bg-danger-bg",    text: "text-danger",       dot: "bg-danger" },
};

const FILTERS = [
  { label: "All",       value: "ALL"       },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Repaid",    value: "PAID"      },
  { label: "Overdue",   value: "OVERDUE"   },
] as const;

type FilterValue = "ALL" | "SCHEDULED" | "PAID" | "OVERDUE";
type Tab = "cycle" | "all";

// ── sub-components ────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? { label: status, bg: "bg-surface-muted", text: "text-ink-3", dot: "bg-ink-4" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function StatCard({ label, value, icon, iconBg, iconColor, sub, loading }: {
  label: string; value: React.ReactNode; icon: React.ReactNode;
  iconBg: string; iconColor: string; sub?: string; loading?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3.5 rounded-2xl border border-edge bg-surface px-5 py-4 shadow-card">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xs font-medium uppercase tracking-[0.05em] text-ink-4">{label}</p>
        {loading
          ? <div className="mt-1.5 h-6 w-20 animate-pulse rounded-md bg-surface-muted" />
          : <p className="mt-1 text-xl font-bold tabular-nums text-ink">{value}</p>
        }
        {!loading && sub && <p className="mt-0.5 text-2xs text-ink-4">{sub}</p>}
      </div>
    </div>
  );
}

function FilterChips({ filter, setFilter, counts }: { filter: FilterValue; setFilter: (f: FilterValue) => void; counts: Record<string, number> }) {
  return (
    <div className="flex gap-1.5">
      {FILTERS.map(f => (
        <button
          key={f.value}
          onClick={() => setFilter(f.value)}
          className={`h-[30px] rounded-full border px-3 text-xs font-semibold transition-colors ${
            filter === f.value ? "border-brand bg-brand-soft text-brand" : "border-edge bg-surface text-ink-3 hover:bg-surface-raised"
          }`}
        >
          {f.label}{counts[f.value] !== undefined ? ` ${counts[f.value]}` : ""}
        </button>
      ))}
    </div>
  );
}

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Export repayments to CSV" className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-surface text-ink-3 transition-colors hover:bg-surface-raised">
      <Download size={13} />
    </button>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-56">
      <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-4" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-8 w-full rounded-lg border border-edge bg-surface pl-8 pr-2.5 text-xs text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
    </div>
  );
}

// ── this-cycle tab ────────────────────────────────────────────────────────────

function ThisCycleTab() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<FilterValue>((searchParams.get("filter") as FilterValue) || "ALL");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "cycle");
    if (filter !== "ALL") next.set("filter", filter); else next.delete("filter");
    if (search) next.set("q", search); else next.delete("q");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  const { data: summary } = useFetch(() => payrollService.getPayrollSummary(), []);
  const { data: raw, loading, error, refresh } = useFetch(() => payrollService.getUpcomingRecoveries(), []);
  const rows = raw ?? [];

  useEffect(() => { if (error) toast.error("Failed to load repayments", error); }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="rounded-2xl border border-danger-bg bg-surface px-6 py-12 text-center">
      <p className="text-sm font-medium text-danger">Failed to load repayments</p>
      <Button variant="secondary" size="sm" onClick={refresh} className="mt-3">Retry</Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-xl border border-brand-muted bg-brand-soft px-3.5 py-2.5">
        <ArrowDownCircle size={14} className="mt-0.5 flex-shrink-0 text-brand" />
        <p className="text-xs leading-relaxed text-info">
          Repayments are grouped into a settlement after your payroll cutoff date. They move to Repaid once MobPae confirms the settlement payment.
        </p>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3">
        <StatCard label="Employees due" value={summary?.employeesDue ?? "—"} icon={<UsersRound size={16} />} iconBg="bg-surface-muted" iconColor="text-ink-4" loading={loading} />
        <StatCard label="Pending repayment" value={formatCurrency(totalPending)} icon={<Clock3 size={16} />} iconBg="bg-warning-soft" iconColor="text-warning-dark" sub="awaiting settlement" loading={loading} />
        <StatCard label="Repaid this cycle" value={formatCurrency(totalRecovered)} icon={<CircleDollarSign size={16} />} iconBg="bg-success-bg" iconColor="text-success" loading={loading} />
        <StatCard label="Active exposure" value={formatCurrency(summary?.totalRecoveryAmount ?? 0)} icon={<CircleDollarSign size={16} />} iconBg="bg-[#EDE9FE]" iconColor="text-[#7C3AED]" sub="all active advances" loading={loading} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <FilterChips filter={filter} setFilter={setFilter} counts={counts} />
        <div className="flex-1" />
        <SearchBox value={search} onChange={setSearch} placeholder="Search employee…" />
        <ExportButton onClick={() => exportToCsv(filtered.map(r => ({
          Employee: r.employeeName, SalaryRequest: r.loanApplicationId,
          Principal: r.principalAmount, Interest: r.interestAmount, Total: r.totalAmount,
          DueDate: r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "", Status: r.status,
        })), `repayments-this-cycle-${Date.now()}`)} />
        <button onClick={refresh} aria-label="Refresh repayments" className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-surface text-ink-3 transition-colors hover:bg-surface-raised">
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
        {loading ? (
          <div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-edge-2 px-5 py-3.5 last:border-0">
                <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-lg bg-surface-muted" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-2.5 w-32 animate-pulse rounded-md bg-surface-muted" />
                  <div className="h-2 w-20 animate-pulse rounded-md bg-surface-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-ink-3">No repayments found</p>
            <p className="mt-1 text-xs text-ink-4">Salary deductions appear here after advances are disbursed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-edge-2 bg-surface-raised">
                  {["Employee", "Salary Request", "Principal", "Interest", "Total Deduction", "Due Date", "Settlement", "Status"].map(h => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.06em] text-ink-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const ac = ["#315eff", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899"][i % 6];
                  return (
                    <tr key={r.id} className="border-b border-edge-2 transition-colors last:border-0 hover:bg-surface-raised">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: ac }}>
                            {r.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[13.5px] font-semibold text-ink">{r.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-ink-3">{r.loanApplicationId}</td>
                      <td className="px-4 py-3.5 tabular-nums text-sm text-ink-3">{formatCurrency(r.principalAmount)}</td>
                      <td className="px-4 py-3.5 tabular-nums text-sm text-ink-3">{formatCurrency(r.interestAmount)}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold tabular-nums text-ink">{formatCurrency(r.totalAmount)}</td>
                      <td className={`px-4 py-3.5 tabular-nums text-sm ${r.status === "OVERDUE" ? "font-semibold text-danger" : "text-ink-3"}`}>
                        {formatDate(r.dueDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        {r.settlementId ? (
                          <span className="inline-flex h-[22px] items-center rounded-full bg-brand-soft px-2.5 text-2xs font-semibold text-info">In settlement</span>
                        ) : (
                          <span className="text-xs text-ink-4">Not yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5"><StatusPill status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="border-t border-edge-2 bg-surface-raised px-4 py-2.5">
            <p className="text-xs text-ink-4">{filtered.length} {filtered.length === 1 ? "repayment" : "repayments"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── all-time tab ──────────────────────────────────────────────────────────────

function AllTimeTab() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<FilterValue>((searchParams.get("filter") as FilterValue) || "ALL");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "all");
    if (filter !== "ALL") next.set("filter", filter); else next.delete("filter");
    if (search) next.set("q", search); else next.delete("q");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  const { data: raw, loading, error, refresh } = useFetch(() => repaymentService.getRepayments(), []);
  const rows = raw ?? [];

  useEffect(() => { if (error) toast.error("Failed to load repayments", error); }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

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
        (r as unknown as { employeeCode?: string }).employeeCode?.toLowerCase().includes(q) ||
        r.loanApplicationId.toLowerCase().includes(q),
      );
    }
    return list;
  }, [rows, filter, search]);

  if (error) return (
    <div className="rounded-2xl border border-danger-bg bg-surface px-6 py-12 text-center">
      <p className="text-sm font-medium text-danger">Failed to load repayments</p>
      <Button variant="secondary" size="sm" onClick={refresh} className="mt-3">Retry</Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Stat cards */}
      <div className="flex flex-wrap gap-3">
        <StatCard label="Outstanding" value={formatCurrency(totalOutstanding)} icon={<Clock size={16} />} iconBg="bg-warning-soft" iconColor="text-warning-dark" sub={`${counts.SCHEDULED || 0} scheduled`} loading={loading} />
        <StatCard label="Overdue" value={String(counts.OVERDUE || 0)} icon={<AlertCircle size={16} />} iconBg="bg-danger-bg" iconColor="text-danger" sub="require attention" loading={loading} />
        <StatCard label="Total repaid" value={formatCurrency(totalRecovered)} icon={<CheckCircle2 size={16} />} iconBg="bg-success-bg" iconColor="text-success" sub={`${counts.PAID || 0} completed`} loading={loading} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <FilterChips
          filter={filter} setFilter={setFilter}
          counts={{ ALL: rows.length, SCHEDULED: counts.SCHEDULED, PAID: counts.PAID, OVERDUE: counts.OVERDUE }}
        />
        <div className="flex-1" />
        <SearchBox value={search} onChange={setSearch} placeholder="Search employee or ID…" />
        <ExportButton onClick={() => exportToCsv(filtered.map(r => ({
          Employee: r.employeeName,
          EmployeeCode: (r as unknown as { employeeCode?: string }).employeeCode ?? "",
          SalaryRequest: r.loanApplicationId,
          Principal: r.principalAmount, Interest: r.interestAmount, Total: r.totalAmount,
          DueDate: r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "", Status: r.status,
        })), `repayments-all-time-${Date.now()}`)} />
        <button onClick={refresh} aria-label="Refresh repayments" className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-surface text-ink-3 transition-colors hover:bg-surface-raised">
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
        {loading ? (
          <div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-edge-2 px-5 py-3.5 last:border-0">
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-2.5 w-32 animate-pulse rounded-md bg-surface-muted" />
                  <div className="h-2 w-20 animate-pulse rounded-md bg-surface-muted" />
                </div>
                <div className="h-2.5 w-16 animate-pulse self-center rounded-md bg-surface-muted" />
                <div className="h-2.5 w-16 animate-pulse self-center rounded-md bg-surface-muted" />
                <div className="h-[18px] w-20 animate-pulse self-center rounded-full bg-surface-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-edge-2 bg-surface-raised">
                  {["Employee", "Salary Request", "Principal", "Interest", "Total", "Due Date", "Status"].map(h => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.06em] text-ink-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!filtered.length ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-ink-3">No repayments found</p>
                    <p className="mt-1 text-xs text-ink-4">Try adjusting your filters</p>
                  </td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="border-b border-edge-2 transition-colors last:border-0 hover:bg-surface-raised">
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] font-semibold text-ink">{r.employeeName}</p>
                      <p className="mt-0.5 font-mono text-2xs text-ink-4">{(r as unknown as { employeeCode?: string }).employeeCode}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-ink-3">{r.loanApplicationId.slice(0, 8)}…</td>
                    <td className="px-4 py-3.5 tabular-nums text-sm text-ink-3">{formatCurrency(r.principalAmount)}</td>
                    <td className="px-4 py-3.5 tabular-nums text-sm text-ink-3">{formatCurrency(r.interestAmount)}</td>
                    <td className="px-4 py-3.5 text-sm font-bold tabular-nums text-ink">{formatCurrency(r.totalAmount)}</td>
                    <td className={`px-4 py-3.5 text-sm ${r.status === "OVERDUE" ? "text-danger" : "text-ink-3"}`}>
                      {r.dueDate ? formatDate(r.dueDate) : "—"}
                    </td>
                    <td className="px-4 py-3.5"><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="border-t border-edge-2 bg-surface-raised px-4 py-2.5">
            <p className="text-xs text-ink-4">Showing {filtered.length} of {rows.length} repayments</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function RepaymentsPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "cycle");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Repayments</h1>
        <p className="mt-1.5 text-sm text-ink-3">Track salary deductions and settlement cycles for your employees' advances</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-edge">
        {([
          { id: "cycle", label: "This Cycle" },
          { id: "all",   label: "All Time"   },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px h-10 px-4 text-sm font-semibold transition-colors border-b-2 ${
              tab === t.id ? "border-brand text-brand" : "border-transparent text-ink-3 hover:text-ink-2"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "cycle" ? <ThisCycleTab /> : <AllTimeTab />}
    </div>
  );
}
