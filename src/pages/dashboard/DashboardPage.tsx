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
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { dashboardService } from "../../services/dashboard.service";
import type { DashboardStats, DashboardTrend, LoanApplication } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T1  = "var(--color-ink)";
const T2  = "var(--color-ink-3)";
const T3  = "var(--color-ink-4)";
const P   = "var(--color-brand)";
const PS  = "var(--color-brand-soft)";

const BDR = "1px solid var(--color-edge)";
const SHD = "0 1px 4px rgba(17,24,39,0.04)";

// ─── Status pill ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING:      { bg: "var(--color-warning-bg)", text: "var(--color-warning)" },
  SUBMITTED:    { bg: "var(--color-warning-bg)", text: "var(--color-warning)" },
  UNDER_REVIEW: { bg: "var(--color-brand-soft)", text: "var(--color-brand)" },
  APPROVED:     { bg: "var(--color-info-bg)", text: "var(--color-info)" },
  REJECTED:     { bg: "var(--color-danger-bg)", text: "var(--color-danger)" },
  DISBURSED:    { bg: "var(--color-success-bg)", text: "var(--color-success)" },
  SUCCESS:      { bg: "var(--color-success-bg)", text: "var(--color-success)" },
  REPAID:       { bg: "var(--color-surface-muted)", text: "var(--color-ink-3)" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "var(--color-surface-muted)", text: "var(--color-ink-3)" };
  const label = status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999,
      background: s.bg, color: s.text,
      fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.text, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, iconBg, loading = false }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; iconBg: string; loading?: boolean;
}) {
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: "16px 18px",
      border: BDR, boxShadow: SHD,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: T1, letterSpacing: "-0.025em", lineHeight: 1, opacity: loading ? 0.25 : 1, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 12, color: T2, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Chart.js ─────────────────────────────────────────────────────────────────
declare global { interface Window { Chart: any } } // eslint-disable-line @typescript-eslint/no-explicit-any
const CHART_CDN = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";

function useChartJs(cb: () => void) {
  useEffect(() => {
    if (window.Chart) { cb(); return; }
    const s = document.createElement("script");
    s.src = CHART_CDN; s.onload = cb;
    document.head.appendChild(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function TrendChart({ trends }: { trends: DashboardTrend[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const build = () => {
    if (!canvasRef.current || !window.Chart) return;
    chartRef.current?.destroy();
    const labels = trends.map(t => {
      const [y, m] = t.month.split("-");
      return new Date(Number(y), Number(m) - 1).toLocaleString("en", { month: "short" });
    });
    chartRef.current = new window.Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Requested", data: trends.map(t => t.requestCount),  borderColor: P,         backgroundColor: `${P}18`, fill: true,  tension: 0.45, pointBackgroundColor: P,         pointRadius: 3, pointHoverRadius: 5, borderWidth: 2 },
          { label: "Approved",  data: trends.map(t => t.approvedCount), borderColor: "#10B981", backgroundColor: "transparent", fill: false, tension: 0.45, pointBackgroundColor: "#10B981", pointRadius: 3, pointHoverRadius: 5, borderWidth: 1.5, borderDash: [4, 3] },
          { label: "Disbursed", data: trends.map(t => t.disbursedCount),borderColor: "#F59E0B", backgroundColor: "transparent", fill: false, tension: 0.45, pointBackgroundColor: "#F59E0B", pointRadius: 3, pointHoverRadius: 5, borderWidth: 1.5, borderDash: [4, 3] },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { titleFont: { size: 11, family: "Inter" }, bodyFont: { size: 11, family: "Inter" } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10, family: "Inter" }, color: T3 } },
          y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 10, family: "Inter" }, color: T3, stepSize: 5 }, beginAtZero: true },
        },
      },
    });
  };

  useChartJs(build);
  useEffect(() => { build(); }, [trends]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  if (!trends.length) return (
    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: 12, color: T3 }}>No trend data yet</p>
    </div>
  );
  return (
    <div>
      <div style={{ position: "relative", height: 160 }}><canvas ref={canvasRef} /></div>
      {/* Legend below chart */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, justifyContent: "center" }}>
        {[
          { color: P,         label: "Requested", solid: true  },
          { color: "#10B981", label: "Approved",  solid: false },
          { color: "#F59E0B", label: "Disbursed", solid: false },
        ].map(({ color, label, solid }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: T2 }}>
            <span style={{
              display: "inline-block", width: 20, height: 2,
              background: solid ? color : "transparent",
              borderTop: solid ? "none" : `2px dashed ${color}`,
            }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ approved, disbursed, pending }: { approved: number; disbursed: number; pending: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const build = () => {
    if (!canvasRef.current || !window.Chart) return;
    chartRef.current?.destroy();
    chartRef.current = new window.Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["Approved", "Disbursed", "Pending"],
        // FIX #11: Pending was #EEF2FF (invisible) — use a visible slate
        datasets: [{ data: [approved, disbursed, pending], backgroundColor: [P, "#10B981", "#E2E8F0"], borderWidth: 0, hoverOffset: 4 }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: "70%", plugins: { legend: { display: false }, tooltip: { titleFont: { size: 11 }, bodyFont: { size: 11 } } } },
    });
  };

  useChartJs(build);
  useEffect(() => { build(); }, [approved, disbursed, pending]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  return <div style={{ position: "relative", height: 110 }}><canvas ref={canvasRef} /></div>;
}

// ─── Recent activity table ────────────────────────────────────────────────────
function RecentActivity({ rows }: { rows: LoanApplication[] }) {
  if (!rows.length) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0", textAlign: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: PS, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <WalletCards size={15} color={P} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 500, color: T2 }}>No recent activity</p>
      <p style={{ fontSize: 12, color: T3, marginTop: 3 }}>Loan applications will appear here</p>
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: BDR }}>
            {/* FIX #15: consistent left alignment for all headers except Amount (right) */}
            <th style={{ padding: "0 0 10px", textAlign: "left",  fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Employee</th>
            <th style={{ padding: "0 0 10px", textAlign: "right", fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount</th>
            <th style={{ padding: "0 0 10px", textAlign: "left",  fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
            <th style={{ padding: "0 0 10px", textAlign: "right", fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: BDR }}>
              {/* FIX #16: consistent padding, left-pad first cell */}
              <td style={{ padding: "10px 12px 10px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: PS, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 700, color: P }}>
                    {(r.employeeName ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, color: T1, lineHeight: 1 }}>{r.employeeName}</p>
                    <p style={{ fontSize: 11, color: T3, marginTop: 2 }}>{r.applicationNumber}</p>
                  </div>
                </div>
              </td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: T1, fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(r.requestedAmount)}
              </td>
              <td style={{ padding: "10px 12px 10px 0" }}>
                <StatusPill status={r.status} />
              </td>
              <td style={{ padding: "10px 0", textAlign: "right", color: T3, fontVariantNumeric: "tabular-nums" }}>
                {formatDate(r.submittedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: T2 }}>Recovery coverage</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: P }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "var(--color-surface-muted)", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 999, width: `${pct}%`, background: P, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ h, r = 12 }: { h: number; r?: number }) {
  return <div className="animate-pulse" style={{ height: h, borderRadius: r, background: "var(--color-surface-muted)" }} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, loading: statsLoading, error: statsError, refresh: refreshStats } =
    useFetch<DashboardStats>(() => dashboardService.getDashboardStats(), []);
  const { data: trends = [], loading: trendsLoading } =
    useFetch<DashboardTrend[]>(() => dashboardService.getDashboardTrends(), []);

  const recentActivity   = stats?.recentActivity ?? [];
  const activationRate   = stats && stats.totalEmployees > 0 ? Math.round((stats.appActivatedEmployees / stats.totalEmployees) * 100) : 0;
  const totalRequests    = (stats?.approvedRequests ?? 0) + (stats?.disbursedRequests ?? 0) + (stats?.pendingLoanApplications ?? 0);
  const recoveryTotal    = (stats?.scheduledRecoveries ?? 0) + (stats?.overdueRecoveries ?? 0);
  const recoveryDone     = stats?.scheduledRecoveries ?? 0;

  // FIX #5: use contact person name, fall back to company name
  const greeting = user?.name && !user.name.includes("@")
    ? user.name
    : user?.companyName ?? "there";

  if (statsError) return (
    <div style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-bg)", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <p style={{ fontSize: 13, color: "var(--color-danger)" }}>Failed to load dashboard</p>
      <button onClick={() => void refreshStats()} style={{ height: 34, padding: "0 14px", background: "white", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "var(--color-danger)", cursor: "pointer", fontFamily: "inherit" }}>Try again</button>
    </div>
  );

  const card = (children: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{ background: "white", borderRadius: 16, border: BDR, boxShadow: SHD, overflow: "hidden", ...extra }}>{children}</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "Inter, ui-sans-serif, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T1, letterSpacing: "-0.025em", margin: 0 }}>
            Welcome back, {greeting}
          </h1>
          <p style={{ fontSize: 13.5, color: T2, marginTop: 6 }}>
            Approvals, recoveries, and settlement status for your team.
          </p>
        </div>
        <p style={{ fontSize: 12.5, color: T3, flexShrink: 0, marginTop: 4 }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* ── Alert banners ──────────────────────────────────────────── */}
      {(stats?.overdueRecoveries ?? 0) > 0 && (
        <div style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-bg)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={14} color="var(--color-danger)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: "var(--color-danger)" }}>
            <span style={{ fontWeight: 600 }}>{stats?.overdueRecoveries}</span> overdue recovery{stats!.overdueRecoveries !== 1 ? "s" : ""}.{" "}
            {/* FIX #6: link directly to /repayments, not /recoveries redirect */}
            <Link to="/repayments" style={{ textDecoration: "underline", color: "var(--color-danger)" }}>Review now</Link>
          </p>
        </div>
      )}
      {(stats?.overdueSettlements ?? 0) > 0 && (
        <div style={{ background: "var(--color-warning-soft)", border: "1px solid var(--color-warning-bg)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={14} color="var(--color-warning)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: "var(--color-warning)" }}>
            <span style={{ fontWeight: 600 }}>{stats?.overdueSettlements}</span> overdue settlement{stats!.overdueSettlements !== 1 ? "s" : ""}.{" "}
            <Link to="/settlements" style={{ textDecoration: "underline", color: "var(--color-warning)" }}>Review now</Link>
          </p>
        </div>
      )}

      {/* ── KPI strip ──────────────────────────────────────────────── */}
      {/* FIX #7: label on top (small caps), big number, sub below — clear hierarchy */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KpiCard label="Total Employees"   value={stats?.totalEmployees ?? 0}          sub={`${activationRate}% on app`}  icon={<UsersRound size={20} color={P} strokeWidth={1.75}/>}        iconBg={PS}       loading={statsLoading} />
        <KpiCard label="App Activated"     value={stats?.appActivatedEmployees ?? 0}   sub="used MobPae app"               icon={<BadgeCheck size={20} color="var(--color-success)" strokeWidth={1.75}/>} iconBg="var(--color-success-bg)"  loading={statsLoading} />
        <KpiCard label="Pending Requests"  value={stats?.pendingLoanApplications ?? 0} sub="awaiting approval"             icon={<Clock3 size={20} color="var(--color-warning)" strokeWidth={1.75}/>}      iconBg="var(--color-warning-bg)"  loading={statsLoading} />
        <KpiCard label="Settlement Due"    value={statsLoading ? "—" : formatCurrency(stats?.outstandingAmount ?? 0)} sub="payable to MobPae" icon={<CircleDollarSign size={20} color="var(--color-danger)" strokeWidth={1.75}/>} iconBg="var(--color-danger-bg)" loading={statsLoading} />
      </div>

      {/* ── Row 2: Trend chart + Recoveries ────────────────────────── */}
      {/* FIX #18: better ratio, give recovery card more room */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>

        {card(
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: T1, margin: 0 }}>Request trend</p>
              <p style={{ fontSize: 12, color: T2, marginTop: 3 }}>Salary advances over last 6 months</p>
            </div>
            {/* FIX #8 & #9: taller chart (160px) + legend moved below chart */}
            {trendsLoading ? <Sk h={200} /> : <TrendChart trends={trends ?? []} />}
          </div>
        )}

        {card(
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: T1, margin: "0 0 16px" }}>Recovery Cycle</p>
            {[
              { icon: <RefreshCcw size={13} color={P}/>,            label: "Scheduled",     value: stats?.scheduledRecoveries ?? 0,               badge: "on track",      badgeBg: "var(--color-success-bg)", badgeColor: "var(--color-success)", showBadge: (stats?.scheduledRecoveries ?? 0) > 0 },
              { icon: <AlertTriangle size={13} color="var(--color-danger)"/>,   label: "Overdue",       value: stats?.overdueRecoveries ?? 0,                 badge: "action needed", badgeBg: "var(--color-danger-bg)", badgeColor: "var(--color-danger)", showBadge: (stats?.overdueRecoveries ?? 0) > 0 },
              { icon: <Landmark size={13} color="var(--color-warning)"/>,        label: "Pending settlements", value: stats?.pendingSettlements ?? 0,          badge: "due soon",      badgeBg: "var(--color-warning-bg)", badgeColor: "var(--color-warning)", showBadge: (stats?.pendingSettlements ?? 0) > 0 },
              { icon: <CircleDollarSign size={13} color={T2}/>,    label: "Amount due",    value: formatCurrency(stats?.recoveryAmountDue ?? 0), badge: null,             badgeBg: "",        badgeColor: "",        showBadge: false },
            ].map((row, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < arr.length - 1 ? BDR : "none" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: T2 }}>
                  {row.icon}{row.label}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T1 }}>{row.value}</span>
                  {/* FIX #10: only show badge when count > 0 */}
                  {row.badge && row.showBadge && (
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: row.badgeBg, color: row.badgeColor, fontWeight: 500 }}>
                      {row.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {!statsLoading && (
              <div style={{ marginTop: 14 }}>
                <ProgressBar value={recoveryDone} max={recoveryTotal} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Row 3: Donut + Recent Activity + Insight ───────────────── */}
      {/* FIX #12 & #14: equal-ish columns, insight card uses alignSelf stretch */}
      <div style={{ display: "grid", gridTemplateColumns: "0.85fr 1.6fr 0.75fr", gap: 16, alignItems: "stretch" }}>

        {card(
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: T1, margin: 0 }}>Request split</p>
            <p style={{ fontSize: 12, color: T2, marginTop: 3, marginBottom: 16 }}>This month</p>
            {statsLoading ? <Sk h={110} /> : <DonutChart approved={stats?.approvedRequests ?? 0} disbursed={stats?.disbursedRequests ?? 0} pending={stats?.pendingLoanApplications ?? 0} />}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
              {/* FIX #11: Pending uses #E2E8F0 (slate, visible) to match donut */}
              {[
                { color: P,         label: "Approved",  count: stats?.approvedRequests ?? 0      },
                { color: "#10B981", label: "Disbursed", count: stats?.disbursedRequests ?? 0     },
                { color: "var(--color-edge-strong)", label: "Pending",   count: stats?.pendingLoanApplications ?? 0, border: true },
              ].map(({ color, label, count, border }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, color: T2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: color, border: border ? `1.5px solid #CBD5E1` : "none", flexShrink: 0 }} />
                    {label}
                  </span>
                  <span style={{ fontWeight: 600, color: T1 }}>
                    {totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {card(
          <>
            <div style={{ padding: "16px 20px", borderBottom: BDR, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: T1, margin: 0 }}>Recent activity</p>
                <p style={{ fontSize: 12, color: T2, marginTop: 3 }}>Latest loan applications</p>
              </div>
              <Link to="/loan-applications" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: P, textDecoration: "none" }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div style={{ padding: "4px 20px 16px" }}>
              {statsLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 12 }}>
                  {[0,1,2,3].map(i => <Sk key={i} h={38} />)}
                </div>
              ) : <RecentActivity rows={recentActivity} />}
            </div>
          </>
        )}

        {/* FIX #13 & #14: remove fake carousel dots, use flex to stretch card */}
        <div style={{ background: "var(--color-ink)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.12)", fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 14 }}>
              <Sparkles size={11} />Insight
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.8)" }}>
              {activationRate >= 70
                ? <>App activation at <span style={{ color: "var(--color-brand-muted)", fontWeight: 600 }}>{activationRate}%</span> — great adoption!</>
                : activationRate > 0
                ? <>Only <span style={{ color: "var(--color-brand-muted)", fontWeight: 600 }}>{activationRate}%</span> of employees activated. Nudge the rest for faster processing.</>
                : <>Encourage employees to activate MobPae for instant advance access.</>
              }
            </p>
          </div>
          <Link to="/employees" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-brand-muted)", textDecoration: "none", marginTop: 20 }}>
            View employees <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* ── Row 4: Summary mini-cards ───────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>

        {card(
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>Employees</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { label: "Total",  val: stats?.totalEmployees ?? 0,        icon: <UsersRound size={13}/>,  color: P         },
                { label: "Active", val: stats?.activeEmployees ?? 0,       icon: <ShieldCheck size={13}/>, color: "var(--color-success)" },
                { label: "On App", val: stats?.appActivatedEmployees ?? 0, icon: <BadgeCheck size={13}/>,  color: "var(--color-warning)" },
              ].map(({ label, val, icon, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}15`, color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{icon}</div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: T1, margin: 0, fontVariantNumeric: "tabular-nums" }}>{val}</p>
                  <p style={{ fontSize: 11, color: T3, marginTop: 3 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {card(
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>Loan Applications</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { label: "Pending",   val: stats?.pendingLoanApplications ?? 0, color: "var(--color-warning)" },
                { label: "Approved",  val: stats?.approvedRequests ?? 0,        color: P         },
                { label: "Disbursed", val: stats?.disbursedRequests ?? 0,       color: "var(--color-success)" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: T1, margin: 0, fontVariantNumeric: "tabular-nums" }}>{val}</p>
                  <p style={{ fontSize: 11, marginTop: 4, color }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FIX #17: no conditional font-size hack — use a consistent size with proper overflow */}
        {card(
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>Settlements</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { label: "Pending",     val: String(stats?.pendingSettlements ?? 0),               color: "var(--color-warning)" },
                { label: "Overdue",     val: String(stats?.overdueSettlements ?? 0),               color: "var(--color-danger)" },
                { label: "Outstanding", val: formatCurrency(stats?.outstandingAmount ?? 0),        color: P        },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: T1, margin: 0, lineHeight: 1.3, wordBreak: "break-all", fontVariantNumeric: "tabular-nums" }}>{val}</p>
                  <p style={{ fontSize: 11, marginTop: 4, color }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
