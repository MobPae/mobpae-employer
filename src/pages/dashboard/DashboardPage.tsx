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

// ─────────────────────────────────────────────────────────────────────────────
// Status pill
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING:      { bg: "#fef5e4", text: "#b7700a", dot: "#b7700a" },
  SUBMITTED:    { bg: "#e8f4fd", text: "#1a6fa0", dot: "#1a6fa0" },
  UNDER_REVIEW: { bg: "#f0eafe", text: "#6b3fa0", dot: "#6b3fa0" },
  APPROVED:     { bg: "#e6f4ec", text: "#5659D9", dot: "#5659D9" },
  REJECTED:     { bg: "#feeaea", text: "#c0392b", dot: "#c0392b" },
  DISBURSED:    { bg: "#e8f0fe", text: "#1a56cc", dot: "#1a56cc" },
  REPAID:       { bg: "#f2f2f2", text: "#777",    dot: "#B7B9C7"    },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "#f2f2f2", text: "#777", dot: "#B7B9C7" };
  const label = status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-[500]"
      style={{ background: s.bg, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI card
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, iconBg, iconColor, highlight = false,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; iconBg: string; iconColor: string; highlight?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: highlight ? "#7679FF" : "#fff",
        border: highlight ? "none" : "0.5px solid #E4E4EF",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-[500]" style={{ color: highlight ? "rgba(255,255,255,0.6)" : "#8D90A3" }}>
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p
          className="text-[22px] font-[700] leading-none tracking-tight"
          style={{ color: highlight ? "#fff" : "#191A2E" }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[11px] mt-1" style={{ color: highlight ? "rgba(255,255,255,0.4)" : "#B7B9C7" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trend chart (Chart.js)
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Chart: any;
  }
}

const CHART_JS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";

function useChartJs(onLoad: () => void) {
  useEffect(() => {
    if (window.Chart) { onLoad(); return; }
    const s = document.createElement("script");
    s.src = CHART_JS_CDN;
    s.onload = onLoad;
    document.head.appendChild(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function TrendChart({ trends }: { trends: DashboardTrend[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  const buildChart = () => {
    if (!canvasRef.current || !window.Chart) return;
    if (chartRef.current) { chartRef.current.destroy(); }

    const labels = trends.map(t => {
      const [y, m] = t.month.split("-");
      return new Date(Number(y), Number(m) - 1).toLocaleString("en", { month: "short" });
    });

    chartRef.current = new window.Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Requested",
            data: trends.map(t => t.requestCount),
            borderColor: "#7679FF",
            backgroundColor: "rgba(118,121,255,0.07)",
            fill: true,
            tension: 0.45,
            pointBackgroundColor: "#7679FF",
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
          },
          {
            label: "Approved",
            data: trends.map(t => t.approvedCount),
            borderColor: "#5659D9",
            backgroundColor: "transparent",
            fill: false,
            tension: 0.45,
            pointBackgroundColor: "#5659D9",
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 1.5,
            borderDash: [4, 3],
          },
          {
            label: "Disbursed",
            data: trends.map(t => t.disbursedCount),
            borderColor: "#1a56cc",
            backgroundColor: "transparent",
            fill: false,
            tension: 0.45,
            pointBackgroundColor: "#1a56cc",
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 1.5,
            borderDash: [4, 3],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            titleFont: { size: 11 },
            bodyFont: { size: 11 },
            callbacks: {
              label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
                `${ctx.dataset.label}: ${ctx.parsed.y}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: "#B7B9C7" },
          },
          y: {
            grid: { color: "rgba(0,0,0,0.04)" },
            ticks: { font: { size: 10 }, color: "#B7B9C7", stepSize: 5 },
            beginAtZero: true,
          },
        },
      },
    });
  };

  useChartJs(buildChart);
  useEffect(() => { buildChart(); }, [trends]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  if (!trends.length) {
    return (
      <div className="h-[100px] flex items-center justify-center">
        <p className="text-[11px]" style={{ color: "#B7B9C7" }}>Trend data not yet available</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "100px" }}>
      <canvas ref={canvasRef} role="img" aria-label="Salary request trend over last 6 months" />
    </div>
  );
}

function DonutChart({ approved, disbursed, pending }: { approved: number; disbursed: number; pending: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  const buildChart = () => {
    if (!canvasRef.current || !window.Chart) return;
    if (chartRef.current) { chartRef.current.destroy(); }

    chartRef.current = new window.Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["Approved", "Disbursed", "Pending"],
        datasets: [{
          data: [approved, disbursed, pending],
          backgroundColor: ["#7679FF", "#5659D9", "#ECEBFF"],
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: { titleFont: { size: 11 }, bodyFont: { size: 11 } },
        },
      },
    });
  };

  useChartJs(buildChart);
  useEffect(() => { buildChart(); }, [approved, disbursed, pending]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  return (
    <div style={{ position: "relative", height: "110px" }}>
      <canvas ref={canvasRef} role="img" aria-label={`Request split: ${approved} approved, ${disbursed} disbursed, ${pending} pending`} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent activity table
// ─────────────────────────────────────────────────────────────────────────────

function RecentActivity({ rows }: { rows: SalaryRequest[] }) {
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: "#ECEBFF" }}>
          <WalletCards size={16} style={{ color: "#7679FF" }} />
        </div>
        <p className="text-[12px] font-[500]" style={{ color: "#62657A" }}>No recent activity</p>
        <p className="text-[11px] mt-1" style={{ color: "#B7B9C7" }}>Salary requests will appear here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ fontSize: "12px", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "0.5px solid #F0F0F8" }}>
            <th className="text-left pb-2" style={{ fontSize: "10px", fontWeight: 600, color: "#B7B9C7", textTransform: "uppercase", letterSpacing: "0.05em", paddingRight: "12px" }}>Employee</th>
            <th className="text-right pb-2" style={{ fontSize: "10px", fontWeight: 600, color: "#B7B9C7", textTransform: "uppercase", letterSpacing: "0.05em", paddingRight: "12px" }}>Requested</th>
            <th className="text-left pb-2" style={{ fontSize: "10px", fontWeight: 600, color: "#B7B9C7", textTransform: "uppercase", letterSpacing: "0.05em", paddingRight: "12px" }}>Status</th>
            <th className="text-right pb-2" style={{ fontSize: "10px", fontWeight: 600, color: "#B7B9C7", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderTop: "0.5px solid #E4E4EF" }}>
              <td style={{ padding: "7px 12px 7px 0" }}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#ECEBFF", fontSize: "9px", fontWeight: 700, color: "#7679FF" }}
                  >
                    {(r.employeeName ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, color: "#191A2E", lineHeight: 1 }}>{r.employeeName}</p>
                    <p style={{ fontSize: "10px", color: "#B7B9C7", marginTop: 2 }}>{r.requestId}</p>
                  </div>
                </div>
              </td>
              <td className="text-right" style={{ padding: "7px 12px 7px 0", fontWeight: 600, color: "#191A2E", fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(r.requestedAmount)}
              </td>
              <td style={{ padding: "7px 12px 7px 0" }}>
                <StatusPill status={r.status} />
              </td>
              <td className="text-right" style={{ padding: "7px 0", color: "#B7B9C7", fontVariantNumeric: "tabular-nums" }}>
                {formatDate(r.createdDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color = "#7679FF" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span style={{ fontSize: "10px", color: "#8D90A3" }}>Recovery progress</span>
        <span style={{ fontSize: "10px", fontWeight: 600, color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F0F0F8" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton({ h, className = "" }: { h: number; className?: string }) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className}`}
      style={{ height: h, background: "#e2e8f0" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, loading: statsLoading, error: statsError, refresh: refreshStats } = useFetch<DashboardStats>(
    () => dashboardService.getDashboardStats(), []
  );
  const { data: trends = [], loading: trendsLoading } = useFetch<DashboardTrend[]>(
    () => dashboardService.getDashboardTrends(), []
  );

  const recentActivity = stats?.recentActivity ?? [];

  // Activation rate
  const activationRate = stats && stats.totalEmployees > 0
    ? Math.round((stats.appActivatedEmployees / stats.totalEmployees) * 100)
    : 0;

  // Disbursement split totals for donut
  const totalRequests = (stats?.approvedRequests ?? 0) + (stats?.disbursedRequests ?? 0) + (stats?.pendingSalaryRequests ?? 0);

  // Recovery progress: disbursed vs scheduled+overdue
  const recoveryTotal = (stats?.scheduledRecoveries ?? 0) + (stats?.overdueRecoveries ?? 0);
  const recoveryDone  = (stats?.scheduledRecoveries ?? 0); // scheduled = on track

  if (statsError) {
    return (
      <div className="rounded-xl p-5" style={{ background: "#feeaea", border: "0.5px solid #f5c0c0" }}>
        <p className="text-[13px] font-[500]" style={{ color: "#c0392b" }}>Failed to load dashboard</p>
        <p className="text-[11px] mt-1" style={{ color: "#e07070" }}>{statsError}</p>
        <button
          type="button"
          onClick={() => void refreshStats()}
          className="mt-3 h-8 px-3 rounded-lg bg-white border border-red-200 text-[12px] font-[600] text-red-700 hover:bg-red-50"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-[600]" style={{ color: "#191A2E" }}>
            Welcome back, {user?.companyName ?? "Employer"}
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: "#8D90A3" }}>Here's what's happening with your team</p>
        </div>
        <p className="text-[11px]" style={{ color: "#B7B9C7" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* ── Alert banners ───────────────────────────────────────── */}
      {(stats?.overdueRecoveries ?? 0) > 0 && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#feeaea", border: "0.5px solid #f5c0c0" }}>
          <AlertTriangle size={14} style={{ color: "#c0392b", flexShrink: 0 }} />
          <p className="text-[12px]" style={{ color: "#c0392b" }}>
            <span className="font-[600]">{stats?.overdueRecoveries}</span> overdue recovery amount{stats!.overdueRecoveries !== 1 ? "s" : ""}.{" "}
            <Link to="/recoveries" className="underline">Review now</Link>
          </p>
        </div>
      )}
      {(stats?.overdueSettlements ?? 0) > 0 && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#fef5e4", border: "0.5px solid #f5dfa0" }}>
          <AlertTriangle size={14} style={{ color: "#b7700a", flexShrink: 0 }} />
          <p className="text-[12px]" style={{ color: "#b7700a" }}>
            <span className="font-[600]">{stats?.overdueSettlements}</span> overdue settlement{stats!.overdueSettlements !== 1 ? "s" : ""}.{" "}
            <Link to="/settlements" className="underline">Review now</Link>
          </p>
        </div>
      )}

      {/* ── KPI strip (4 cards) ──────────────────────────────────── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[0,1,2,3].map(i => <Skeleton key={i} h={96} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard
            label="Total Employees" value={stats?.totalEmployees ?? 0}
            sub="on payroll"
            icon={<UsersRound size={14} />} iconBg="#ECEBFF" iconColor="#7679FF"
          />
          <KpiCard
            label="App Activated" value={stats?.appActivatedEmployees ?? 0}
            sub={`${activationRate}% of total`}
            icon={<BadgeCheck size={14} />} iconBg="#e8f0fe" iconColor="#1a56cc"
          />
          <KpiCard
            label="Pending Requests" value={stats?.pendingSalaryRequests ?? 0}
            sub="awaiting approval"
            icon={<Clock3 size={14} />} iconBg="#fef5e4" iconColor="#b7700a"
          />
          <KpiCard
            label="Outstanding" value={formatCurrency(stats?.outstandingAmount ?? 0)}
            sub="total balance due"
            icon={<CircleDollarSign size={14} />} iconBg="rgba(255,255,255,0.15)" iconColor="#fff"
            highlight
          />
        </div>
      )}

      {/* ── Row 2: Trend chart + Recoveries & Settlements ───────── */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1.4fr 1fr" }}>

        {/* Trend */}
        <div className="rounded-xl p-4" style={{ background: "#fff", border: "0.5px solid #E4E4EF" }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[13px] font-[600]" style={{ color: "#191A2E" }}>Request trend</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#8D90A3" }}>Salary advances over last 6 months</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {[
                { color: "#7679FF", label: "Requested", solid: true },
                { color: "#5659D9", label: "Approved",  solid: false },
                { color: "#1a56cc", label: "Disbursed", solid: false },
              ].map(({ color, label, solid }) => (
                <span key={label} className="flex items-center gap-1" style={{ fontSize: "10px", color: "#8D90A3" }}>
                  <span style={{
                    display: "inline-block", width: 16, height: 2,
                    background: color,
                    borderTop: solid ? "none" : `2px dashed ${color}`,
                    opacity: solid ? 1 : 0.8,
                  }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          {trendsLoading ? <Skeleton h={100} /> : <TrendChart trends={trends ?? []} />}
        </div>

        {/* Recoveries & Settlements */}
        <div className="rounded-xl p-4" style={{ background: "#fff", border: "0.5px solid #E4E4EF" }}>
          <p className="text-[13px] font-[600] mb-3" style={{ color: "#191A2E" }}>Recoveries & Settlements</p>

          {[
            { icon: <RefreshCcw size={12} />, label: "Scheduled recoveries", value: stats?.scheduledRecoveries ?? 0, badge: "on track",    badgeBg: "#e6f4ec", badgeColor: "#5659D9" },
            { icon: <AlertTriangle size={12} style={{ color: "#c0392b" }} />, label: "Overdue recoveries", value: stats?.overdueRecoveries ?? 0, badge: "action needed", badgeBg: "#feeaea", badgeColor: "#c0392b" },
            { icon: <Landmark size={12} />, label: "Pending settlements", value: stats?.pendingSettlements ?? 0, badge: "due soon",    badgeBg: "#fef5e4", badgeColor: "#b7700a" },
            { icon: <CircleDollarSign size={12} />, label: "Amount due",  value: formatCurrency(stats?.recoveryAmountDue ?? 0), badge: null, badgeBg: "", badgeColor: "" },
          ].map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2"
              style={{ borderBottom: i < 3 ? "0.5px solid #E4E4EF" : "none" }}
            >
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "#62657A" }}>
                <span style={{ color: "#8D90A3" }}>{row.icon}</span>
                {row.label}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-[600]" style={{ color: "#191A2E" }}>{row.value}</span>
                {row.badge && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: row.badgeBg, color: row.badgeColor }}>
                    {row.badge}
                  </span>
                )}
              </div>
            </div>
          ))}

          {statsLoading ? (
            <Skeleton h={16} className="mt-3" />
          ) : (
            <div className="mt-3">
              <ProgressBar value={recoveryDone} max={recoveryTotal} />
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Donut + Recent Activity + Insight ────────────── */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "0.75fr 1.6fr 0.75fr" }}>

        {/* Donut — disbursement split */}
        <div className="rounded-xl p-4" style={{ background: "#fff", border: "0.5px solid #E4E4EF" }}>
          <p className="text-[13px] font-[600]" style={{ color: "#191A2E" }}>Request split</p>
          <p className="text-[11px] mt-0.5 mb-3" style={{ color: "#8D90A3" }}>This month</p>

          {statsLoading ? <Skeleton h={110} /> : (
            <DonutChart
              approved={stats?.approvedRequests ?? 0}
              disbursed={stats?.disbursedRequests ?? 0}
              pending={stats?.pendingSalaryRequests ?? 0}
            />
          )}

          <div className="mt-3 space-y-1.5">
            {[
              { color: "#7679FF", label: "Approved",  count: stats?.approvedRequests ?? 0 },
              { color: "#5659D9", label: "Disbursed", count: stats?.disbursedRequests ?? 0 },
              { color: "#ECEBFF", label: "Pending",   count: stats?.pendingSalaryRequests ?? 0 },
            ].map(({ color, label, count }) => (
              <div key={label} className="flex items-center justify-between" style={{ fontSize: "11px" }}>
                <span className="flex items-center gap-1.5" style={{ color: "#62657A" }}>
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                  {label}
                </span>
                <span style={{ fontWeight: 600, color: "#191A2E" }}>
                  {totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#fff", border: "0.5px solid #E4E4EF" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "0.5px solid #E4E4EF" }}>
            <div>
              <p className="text-[13px] font-[600]" style={{ color: "#191A2E" }}>Recent activity</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#8D90A3" }}>Latest salary advance requests</p>
            </div>
            <Link
              to="/salary-requests"
              className="flex items-center gap-1 text-[11px] font-[500] hover:underline"
              style={{ color: "#7679FF" }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="px-4 py-2">
            {statsLoading ? (
              <div className="space-y-2 py-2">
                {[0,1,2,3].map(i => <Skeleton key={i} h={36} />)}
              </div>
            ) : (
              <RecentActivity rows={recentActivity} />
            )}
          </div>
        </div>

        {/* Insight card */}
        <div
          className="rounded-xl p-4 flex flex-col justify-between"
          style={{ background: "#191A2E", minHeight: "200px" }}
        >
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
              style={{ background: "rgba(255,255,255,0.15)", fontSize: "10px", color: "rgba(255,255,255,0.8)" }}
            >
              <Sparkles size={11} />
              Insight
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
              {activationRate >= 70
                ? <>App activation is at <span style={{ color: "#f4a57a", fontWeight: 600 }}>{activationRate}%</span> — great adoption! Employees with app access get faster request approvals.</>
                : activationRate > 0
                ? <>Only <span style={{ color: "#f4a57a", fontWeight: 600 }}>{activationRate}%</span> of employees have activated the app. Encourage the remaining <span style={{ color: "#f4a57a", fontWeight: 600 }}>{100 - activationRate}%</span> for faster processing.</>
                : <>Encourage employees to activate the MobPae app for instant salary advance access and faster approvals.</>
              }
            </p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f4a57a" }} />
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.25)" }} />
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.25)" }} />
            </div>
            <Link
              to="/employees"
              className="text-[11px] flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ color: "#f4a57a" }}
            >
              View employees <ArrowRight size={10} />
            </Link>
          </div>
        </div>

      </div>

      {/* ── Row 4: Employees & Salary Requests summary ──────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <div className="rounded-xl p-4" style={{ background: "#fff", border: "0.5px solid #E4E4EF" }}>
          <p className="text-[11px] font-[700] uppercase tracking-[0.06em] mb-3" style={{ color: "#B7B9C7" }}>Employees</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total",     val: stats?.totalEmployees ?? 0,        icon: <UsersRound size={12} />,  color: "#7679FF" },
              { label: "Active",    val: stats?.activeEmployees ?? 0,       icon: <ShieldCheck size={12} />, color: "#5659D9" },
              { label: "On App",    val: stats?.appActivatedEmployees ?? 0, icon: <BadgeCheck size={12} />,  color: "#1a56cc" },
            ].map(({ label, val, icon, color }) => (
              <div key={label} className="text-center">
                <div className="w-7 h-7 rounded-lg mx-auto mb-1.5 flex items-center justify-center" style={{ background: `${color}15`, color }}>
                  {icon}
                </div>
                <p className="text-[16px] font-[700]" style={{ color: "#191A2E" }}>{val}</p>
                <p className="text-[11px]" style={{ color: "#B7B9C7" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: "#fff", border: "0.5px solid #E4E4EF" }}>
          <p className="text-[11px] font-[700] uppercase tracking-[0.06em] mb-3" style={{ color: "#B7B9C7" }}>Salary Requests</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Pending",   val: stats?.pendingSalaryRequests ?? 0, color: "#b7700a" },
              { label: "Approved",  val: stats?.approvedRequests ?? 0,      color: "#5659D9" },
              { label: "Disbursed", val: stats?.disbursedRequests ?? 0,     color: "#1a56cc" },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center">
                <p className="text-[16px] font-[700]" style={{ color: "#191A2E" }}>{val}</p>
                <p className="text-[11px]" style={{ color }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4 hidden xl:block" style={{ background: "#fff", border: "0.5px solid #E4E4EF" }}>
          <p className="text-[11px] font-[700] uppercase tracking-[0.06em] mb-3" style={{ color: "#B7B9C7" }}>Settlements</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Pending",     val: stats?.pendingSettlements ?? 0,              color: "#b7700a" },
              { label: "Overdue",     val: stats?.overdueSettlements ?? 0,              color: "#c0392b" },
              { label: "Outstanding", val: formatCurrency(stats?.outstandingAmount ?? 0), color: "#7679FF" },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center">
                <p className="text-[14px] font-[700] leading-tight" style={{ color: "#191A2E" }}>{val}</p>
                <p className="text-[11px] mt-0.5" style={{ color }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
