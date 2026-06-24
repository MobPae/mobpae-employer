import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Search } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { repaymentService } from "../../services/repayment.service";
import { formatCurrency, formatDate } from "../../utils/formatters";

// ── types ─────────────────────────────────────────────────────────────────────

type FilterValue = "ALL" | "SCHEDULED" | "PAID" | "OVERDUE" | "PENDING";

// ── constants ─────────────────────────────────────────────────────────────────

const P    = "#6C4CFF";
const T1   = "#111827";
const T2   = "#6B7280";
const T3   = "#9CA3AF";
const CARD = "#FFFFFF";

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  SCHEDULED: { label: "Scheduled", bg: "#FEF9C3", text: "#A16207", dot: "#CA8A04" },
  PENDING:   { label: "Pending",   bg: "#FEF9C3", text: "#A16207", dot: "#CA8A04" },
  PAID:      { label: "Recovered", bg: "#DCFCE7", text: "#16A34A", dot: "#16A34A" },
  OVERDUE:   { label: "Overdue",   bg: "#FEE2E2", text: "#DC2626", dot: "#DC2626" },
};

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All",       value: "ALL"       },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Recovered", value: "PAID"      },
  { label: "Overdue",   value: "OVERDUE"   },
];

// ── sub-components ────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? { label: status, bg: "#F3F4F6", text: T2, dot: T3 };
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

function StatCard({
  label, value, icon, iconBg, iconColor, sub,
}: {
  label: string; value: string; icon: React.ReactNode;
  iconBg: string; iconColor: string; sub?: string;
}) {
  return (
    <div style={{ background: CARD, borderRadius: 16, padding: "20px 24px", border: "1px solid #F3F4F6", display: "flex", alignItems: "flex-start", gap: 16, flex: 1, minWidth: 0 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: iconColor }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: T3, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: T1, margin: "4px 0 0", fontVariantNumeric: "tabular-nums" }}>{value}</p>
        {sub && <p style={{ fontSize: 11.5, color: T3, marginTop: 2 }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function RepaymentsPage() {
  const [filter, setFilter]   = useState<FilterValue>("ALL");
  const [search, setSearch]   = useState("");

  const { data: repaymentsRaw, loading: isLoading, error: isError, refresh: refetch } = useFetch(
    () => repaymentService.getRepayments(),
    [],
  );
  const repayments = repaymentsRaw ?? [];

  const counts = useMemo(() => {
    const c: Record<string, number> = { SCHEDULED: 0, PENDING: 0, PAID: 0, OVERDUE: 0 };
    for (const r of repayments) {
      if (c[r.status] !== undefined) c[r.status]++;
    }
    return c;
  }, [repayments]);

  const totalOutstanding = useMemo(() =>
    repayments
      .filter(r => r.status === "SCHEDULED" || r.status === "PENDING" || r.status === "OVERDUE")
      .reduce((s, r) => s + r.totalAmount, 0),
    [repayments]);

  const totalRecovered = useMemo(() =>
    repayments
      .filter(r => r.status === "PAID")
      .reduce((s, r) => s + r.totalAmount, 0),
    [repayments]);

  const filtered = useMemo(() => {
    let rows = repayments;
    if (filter !== "ALL") rows = rows.filter(r => r.status === filter || (filter === "SCHEDULED" && r.status === "PENDING"));
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeCode.toLowerCase().includes(q) ||
        r.salaryRequestId.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [repayments, filter, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T1, margin: 0 }}>Repayments</h1>
        <p style={{ fontSize: 13, color: T2, marginTop: 4 }}>Track recovery schedules for your employees' salary advances</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard
          label="Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={<Clock size={20} />}
          iconBg="#FEF9C3" iconColor="#A16207"
          sub={`${(counts.SCHEDULED || 0) + (counts.PENDING || 0)} scheduled`}
        />
        <StatCard
          label="Overdue"
          value={String(counts.OVERDUE || 0)}
          icon={<AlertCircle size={20} />}
          iconBg="#FEE2E2" iconColor="#DC2626"
          sub="Require attention"
        />
        <StatCard
          label="Recovered"
          value={formatCurrency(totalRecovered)}
          icon={<CheckCircle2 size={20} />}
          iconBg="#DCFCE7" iconColor="#16A34A"
          sub={`${counts.PAID || 0} completed`}
        />
      </div>

      {/* Table card */}
      <div style={{ background: CARD, borderRadius: 16, border: "1px solid #F3F4F6", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Filter chips */}
          <div style={{ display: "flex", gap: 6 }}>
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  height: 32, padding: "0 14px", borderRadius: 8,
                  border: filter === f.value ? `1.5px solid ${P}` : "1.5px solid #E5E7EB",
                  background: filter === f.value ? "#F3F0FF" : "white",
                  color: filter === f.value ? P : T2,
                  fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          {/* Search */}
          <div style={{ position: "relative", width: 240 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T3 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee or ID…"
              style={{
                width: "100%", height: 34, paddingLeft: 30, paddingRight: 10,
                border: "1.5px solid #E5E7EB", borderRadius: 8,
                fontSize: 12.5, color: T1, background: "white",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
          </div>
          {/* Refresh */}
          <button
            onClick={() => refetch()}
            title="Refresh"
            style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T3 }}
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* States */}
        {isError && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#DC2626", margin: 0 }}>Failed to load repayments</p>
            <button onClick={() => refetch()} style={{ marginTop: 12, height: 32, padding: "0 16px", borderRadius: 8, border: "none", background: P, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Retry</button>
          </div>
        )}
        {isLoading && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: T3, margin: 0 }}>Loading repayments…</p>
          </div>
        )}
        {!isLoading && !isError && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                  {["Employee", "Salary Request", "Principal", "Interest", "Total", "Due Date", "Status"].map(h => (
                    <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "48px 20px", textAlign: "center" }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: T2, margin: 0 }}>No repayments found</p>
                      <p style={{ fontSize: 12, color: T3, marginTop: 4 }}>Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F9FAFB" : "none" }}
                  >
                    {/* Employee */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T1, margin: 0 }}>{r.employeeName}</p>
                      <p style={{ fontSize: 11.5, color: T3, margin: "2px 0 0", fontFamily: "ui-monospace, monospace" }}>{r.employeeCode}</p>
                    </td>
                    {/* SR ID */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", fontSize: 12, color: T2, fontFamily: "ui-monospace, monospace" }}>
                      {r.salaryRequestId.slice(0, 8)}…
                    </td>
                    {/* Principal */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", fontSize: 13, fontWeight: 500, color: T1, fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(r.principalAmount)}
                    </td>
                    {/* Interest */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", fontSize: 13, color: T2, fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(r.interestAmount)}
                    </td>
                    {/* Total */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", fontSize: 13, fontWeight: 700, color: T1, fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(r.totalAmount)}
                    </td>
                    {/* Due Date */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", fontSize: 13, color: r.status === "OVERDUE" ? "#DC2626" : T2 }}>
                      {r.dueDate ? formatDate(r.dueDate) : "—"}
                    </td>
                    {/* Status */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      <StatusPill status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
            <p style={{ fontSize: 12, color: T3, margin: 0 }}>
              Showing {filtered.length} of {repayments.length} repayment{repayments.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
