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
import type { DashboardStats, DashboardTrend, SalaryRequest } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

// ─── Design tokens (aligned with admin) ──────────────────────────────────────
const P   = "#6C4CFF";
const PS  = "#F3F0FF";
const T1  = "#111827";
const T2  = "#6B7280";
const T3  = "#9CA3AF";
const BDR = "1px solid #E5E7EB";
const SHD = "0 1px 4px rgba(17,24,39,0.04)";

// ─── Status pill ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING:      { bg: "#FEF3C7", text: "#D97706" },
  SUBMITTED:    { bg: "#FEF3C7", text: "#D97706" },
  UNDER_REVIEW: { bg: "#EDE9FE", text: "#7C3AED" },
  APPROVED:     { bg: "#DBEAFE", text: "#1D4ED8" },
  REJECTED:     { bg: "#FEE2E2", text: "#DC2626" },
  DISBURSED:    { bg: "#DCFCE7", text: "#16A34A" },
  REPAID:       { bg: "#F3F4F6", text: "#6B7280" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "#F3F4F6", text: "#6B7280" };
  const label = status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 9px", borderRadius: 999,
      background: s.bg, color: s.text,
      fontSize: 11, fontWeight: 500,
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
      background: "white", borderRadius: 16, padding: "14px 16px",
      border: BDR, boxShadow: SHD,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: T1, letterSpacing: "-0.02em", lineHeight: 1, opacity: loading ? 0.25 : 1 }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 11, color: T3, marginTop: 3 }}>{sub}</div>}
        <div style={{ fontSize: 12, color: T2, marginTop: sub ? 0 : 3, fontWeight: 500 }}>{label}</div>
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
          { label: "Requested", data: trends.map(t => t.requestCount),  borderColor: P,         backgroundColor: `${P}11`, fill: true,  tension: 0.45, pointBackgroundColor: P,         pointRadius: 3, pointHoverRadius: 5, borderWidth: 2 },
          { label: "Approved",  data: trends.map(t => t.approvedCount), borderColor: "#5B34FF", backgroundColor: "transparent", fill: false, tension: 0.45, pointBackgroundColor: "#5B34FF", pointRadius: 3, pointHoverRadius: 5, borderWidth: 1.5, borderDash: [4,3] },
          { label: "Disbursed", data: trends.map(t => t.disbursedCount),borderColor: "#16A34A", backgroundColor: "transparent", fill: false, tension: 0.45, pointBackgroundColor: "#16A34A", pointRadius: 3, pointHoverRadius: 5, borderWidth: 1.5, borderDash: [4,3] },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { titleFont: { size: 11, family: "Inter" }, bodyFont: { size: 11, family: "Inter" } } },
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
    <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: 12, color: T3 }}>No trend data yet</p>
    </div>
  );
  return <div style={{ position: "relative", height: 120 }}><canvas ref={canvasRef} /></div>;
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
        datasets: [{ data: [approved, disbursed, pending], backgroundColor: [P, "#5B34FF", PS], borderWidth: 0, hoverOffset: 4 }],
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
function RecentActivity({ rows }: { rows: SalaryRequest[] }) {
  if (!rows.length) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0", textAlign: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: PS, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <WalletCards size={15} color={P} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 500, color: T2 }}>No recent activity</p>
      <p style={{ fontSize: 12, color: T3, marginTop: 3 }}>Salary requests will appear here</p>
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: BDR }}>
            {["Employee", "Amount", "Status", "Date"].map((h, i) => (
              <th key={h} style={{ padding: "0 12px 10px", textAlign: i === 1 ? "right" : i === 3 ? "right" : "left", fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: BDR }}>
              <td style={{ padding: "10px 12px 10px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: PS, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 700, color: P }}>
                    {(r.employeeName ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, color: T1, lineHeight: 1 }}>{r.employeeName}</p>
                    <p style={{ fontSize: 11, color: T3, marginTop: 2 }}>{r.requestId}</p>
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
                {formatDate(r.createdDate)}
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
        <span style={{ fontSize: 11, color: T2 }}>Scheduled recovery coverage</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: P }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "#F3F4F6", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 999, width: `${pct}%`, background: P }} />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ h, r = 12 }: { h: number; r?: number }) {
  return <div className="animate-pulse" style={{ height: h, borderRadius: r, background: "#F3F4F6" }} />;
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
  const totalRequests    = (stats?.approvedRequests ?? 0) + (stats?.disbursedRequests ?? 0) + (stats?.pendingSalaryRequests ?? 0);
  const recoveryTotal    = (stats?.scheduledRecoveries ?? 0) + (stats?.overdueRecoveries ?? 0);
  const recoveryDone     = stats?.scheduledRecoveries ?? 0;

  if (statsError) return (
    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <p style={{ fontSize: 13, color: "#DC2626" }}>Failed to load dashboard</p>
      <button onClick={() => void refreshStats()} style={{ height: 34, padding: "0 14px", background: "white", border: "1px solid #FECACA", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#DC2626", cursor: "pointer", fontFamily: "inherit" }}>Try again</button>
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T1, letterSpacing: "-0.025em", margin: 0 }}>
            Welcome back, {user?.companyName ?? "Employer"}
          </h1>
          <p style={{ fontSize: 14, color: T2, marginTop: 6 }}>Approvals, recoveries, and settlement status for your team.</p>
        </div>
        <p style={{ fontSize: 12, color: T3 }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* ── Alert banners ──────────────────────────────────────────── */}
      {(stats?.overdueRecoveries ?? 0) > 0 && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: "#DC2626" }}>
            <span style={{ fontWeight: 600 }}>{stats?.overdueRecoveries}</span> overdue recovery{stats!.overdueRecoveries !== 1 ? "s" : ""}.{" "}
            <Link to="/recoveries" style={{ textDecoration: "underline", color: "#DC2626" }}>Review now</Link>
          </p>
        </div>
      )}
      {(stats?.overdueSettlements ?? 0) > 0 && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: "#D97706" }}>
            <span style={{ fontWeight: 600 }}>{stats?.overdueSettlements}</span> overdue settlement{stats!.overdueSettlements !== 1 ? "s" : ""}.{" "}
            <Link to="/settlements" style={{ textDecoration: "underline", color: "#D97706" }}>Review now</Link>
          </p>
        </div>
      )}

      {/* ── KPI strip ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KpiCard label="Total Employees"   value={stats?.totalEmployees ?? 0}          sub="active team"        icon={<UsersRound size={18} color={P} strokeWidth={1.75}/>}        iconBg={PS}       loading={statsLoading} />
        <KpiCard label="App Activated"     value={stats?.appActivatedEmployees ?? 0}   sub={`${activationRate}% of total`} icon={<BadgeCheck size={18} color="#16A34A" strokeWidth={1.75}/>} iconBg="#DCFCE7"  loading={statsLoading} />
        <KpiCard label="Pending Requests"  value={stats?.pendingSalaryRequests ?? 0}   sub="awaiting approval" icon={<Clock3 size={18} color="#D97706" strokeWidth={1.75}/>}        iconBg="#FEF3C7"  loading={statsLoading} />
        <KpiCard label="Settlement Due"    value={formatCurrency(stats?.outstandingAmount ?? 0)} sub="payable to MobPae" icon={<CircleDollarSign size={18} color="#DC2626" strokeWidth={1.75}/>} iconBg="#FEE2E2"  loading={statsLoading} />
      </div>

      {/* ── Row 2: Trend chart + Recoveries ────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>

        {card(
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: T1, margin: 0 }}>Request trend</p>
                <p style={{ fontSize: 12, color: T2, marginTop: 4 }}>Salary advances over last 6 months</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                {[{ color: P, label: "Requested", solid: true }, { color: "#5B34FF", label: "Approved", solid: false }, { color: "#16A34A", label: "Disbursed", solid: false }].map(({ color, label, solid }) => (
                  <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T3 }}>
                    <span style={{ display: "inline-block", width: 16, height: 2, background: solid ? color : "transparent", borderTop: solid ? "none" : `2px dashed ${color}` }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            {trendsLoading ? <Sk h={120} /> : <TrendChart trends={trends ?? []} />}
          </div>
        )}

        {card(
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: T1, margin: "0 0 16px" }}>Recovery Cycle</p>
            {[
              { icon: <RefreshCcw size={13} color={P}/>,  label: "Scheduled recoveries", value: stats?.scheduledRecoveries ?? 0,               badge: "on track",      badgeBg: "#DCFCE7", badgeColor: "#16A34A" },
              { icon: <AlertTriangle size={13} color="#DC2626"/>, label: "Overdue recoveries",  value: stats?.overdueRecoveries ?? 0,               badge: "action needed", badgeBg: "#FEE2E2", badgeColor: "#DC2626" },
              { icon: <Landmark size={13} color="#D97706"/>,label: "Pending settlements", value: stats?.pendingSettlements ?? 0,               badge: "due soon",      badgeBg: "#FEF3C7", badgeColor: "#D97706" },
              { icon: <CircleDollarSign size={13} color={T2}/>, label: "Settlement amount due",   value: formatCurrency(stats?.recoveryAmountDue ?? 0), badge: null,             badgeBg: "",        badgeColor: "" },
            ].map((row, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < arr.length - 1 ? BDR : "none" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: T2 }}>
                  {row.icon}{row.label}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T1 }}>{row.value}</span>
                  {row.badge && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: row.badgeBg, color: row.badgeColor }}>{row.badge}</span>}
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
      <div style={{ display: "grid", gridTemplateColumns: "0.75fr 1.6fr 0.75fr", gap: 16 }}>

        {card(
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: T1, margin: 0 }}>Request split</p>
            <p style={{ fontSize: 12, color: T2, marginTop: 4, marginBottom: 16 }}>This month</p>
            {statsLoading ? <Sk h={110} /> : <DonutChart approved={stats?.approvedRequests ?? 0} disbursed={stats?.disbursedRequests ?? 0} pending={stats?.pendingSalaryRequests ?? 0} />}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              {[{ color: P, label: "Approved", count: stats?.approvedRequests ?? 0 }, { color: "#5B34FF", label: "Disbursed", count: stats?.disbursedRequests ?? 0 }, { color: PS, label: "Pending", count: stats?.pendingSalaryRequests ?? 0 }].map(({ color, label, count }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, color: T2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: color, border: color === PS ? `1px solid #E5E7EB` : "none", flexShrink: 0 }} />
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
                <p style={{ fontSize: 12, color: T2, marginTop: 4 }}>Latest salary advance requests</p>
              </div>
              <Link to="/salary-requests" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: P, textDecoration: "none" }}>
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

        <div style={{ background: "#111827", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 200 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.12)", fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 14 }}>
              <Sparkles size={11} />Insight
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.8)" }}>
              {activationRate >= 70
                ? <>App activation is at <span style={{ color: "#A78BFA", fontWeight: 600 }}>{activationRate}%</span> — great adoption!</>
                : activationRate > 0
                ? <>Only <span style={{ color: "#A78BFA", fontWeight: 600 }}>{activationRate}%</span> of employees activated. Encourage the rest for faster processing.</>
                : <>Encourage employees to activate the MobPae app for instant salary advance access.</>
              }
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
            <div style={{ display: "flex", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A78BFA" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
            </div>
            <Link to="/employees" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: "#A78BFA", textDecoration: "none" }}>
              View employees <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Row 4: Summary mini-cards ───────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>

        {card(
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>Employees</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { label: "Total",   val: stats?.totalEmployees ?? 0,        icon: <UsersRound size={13}/>,  color: P },
                { label: "Active",  val: stats?.activeEmployees ?? 0,       icon: <ShieldCheck size={13}/>, color: "#16A34A" },
                { label: "On App",  val: stats?.appActivatedEmployees ?? 0, icon: <BadgeCheck size={13}/>,  color: "#D97706" },
              ].map(({ label, val, icon, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}15`, color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{icon}</div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: T1, margin: 0 }}>{val}</p>
                  <p style={{ fontSize: 11, color: T3, marginTop: 2 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {card(
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>Salary Requests</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { label: "Pending",   val: stats?.pendingSalaryRequests ?? 0, color: "#D97706" },
                { label: "Approved",  val: stats?.approvedRequests ?? 0,      color: P         },
                { label: "Disbursed", val: stats?.disbursedRequests ?? 0,     color: "#16A34A" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: T1, margin: 0 }}>{val}</p>
                  <p style={{ fontSize: 11, marginTop: 4, color }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {card(
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>Settlements</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { label: "Pending",     val: stats?.pendingSettlements ?? 0,              color: "#D97706" },
                { label: "Overdue",     val: stats?.overdueSettlements ?? 0,              color: "#DC2626" },
                { label: "Outstanding", val: formatCurrency(stats?.outstandingAmount ?? 0), color: P       },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: val.toString().length > 6 ? 13 : 18, fontWeight: 700, color: T1, margin: 0, lineHeight: 1.2 }}>{val}</p>
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
