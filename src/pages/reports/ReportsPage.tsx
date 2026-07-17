import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart2, CheckCircle2, Loader2, TrendingUp, Users } from "lucide-react";
import { salaryRequestService } from "../../services/salary-request.service";
import { repaymentService } from "../../services/repayment.service";
import type { LoanApplication, Repayment } from "../../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Range = "1m" | "3m" | "6m" | "all";

const INR = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [, m] = key.split("-");
  return MONTH_LABELS[parseInt(m, 10) - 1];
}

function cutoffDate(range: Range): Date {
  const d = new Date();
  if (range === "1m") d.setMonth(d.getMonth() - 1);
  else if (range === "3m") d.setMonth(d.getMonth() - 3);
  else if (range === "6m") d.setMonth(d.getMonth() - 6);
  else d.setFullYear(2000);
  return d;
}

const DISBURSED_STATUSES = new Set([
  "DISBURSED", "REPAYMENT_SCHEDULED", "REPAID",
]);
const ACTIVE_STATUSES = new Set([
  "DISBURSED", "REPAYMENT_SCHEDULED",
]);
const PENDING_STATUSES = new Set([
  "SUBMITTED","UNDER_REVIEW","EMPLOYER_APPROVED",
  "AWAITING_PLATFORM_FEE_PAYMENT","AWAITING_MEMBERSHIP_PAYMENT","READY_FOR_DISBURSAL",
]);
const REJECTED_STATUSES = new Set([
  "EMPLOYER_REJECTED","REJECTED","CANCELLED","EXPIRED",
]);

type RepaymentWithCode = Repayment & { employeeCode: string; paidDate?: string | null };

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, colorCls,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  colorCls: string;
}) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
      <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg ${colorCls}`}>
        <Icon size={15} />
      </div>
      <p className="text-[11px] text-ink-3 mb-0.5">{label}</p>
      <p className="text-[20px] font-[700] text-ink leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-ink-4 mt-0.5">{sub}</p>}
    </div>
  );
}

function BarChartViz({ data }: { data: { label: string; count: number; amount: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-[100px]">
      {data.map(d => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
            <div
              className="w-full rounded-t bg-brand/80 hover:bg-brand transition-colors"
              style={{ height: `${Math.max((d.count / maxCount) * 80, d.count > 0 ? 4 : 0)}px` }}
              title={`${d.count} advance${d.count !== 1 ? "s" : ""} · ${INR(d.amount)}`}
            />
          </div>
          <span className="text-[10px] text-ink-4">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function StatusBar({
  segments,
}: {
  segments: { label: string; count: number; cls: string }[];
}) {
  const total = segments.reduce((s, seg) => s + seg.count, 0) || 1;
  return (
    <div className="space-y-2.5">
      <div className="flex h-3 w-full overflow-hidden rounded-full gap-px">
        {segments.map(seg =>
          seg.count > 0 ? (
            <div
              key={seg.label}
              className={`${seg.cls} transition-all`}
              style={{ width: `${(seg.count / total) * 100}%` }}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${seg.cls}`} />
            <span className="text-[11px] text-ink-3">{seg.label}</span>
            <span className="text-[11px] font-[600] text-ink">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [range, setRange] = useState<Range>("3m");
  const [allApplications, setAllApplications] = useState<LoanApplication[]>([]);
  const [allRepayments, setAllRepayments] = useState<RepaymentWithCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    Promise.all([
      salaryRequestService.getSalaryRequests(),
      repaymentService.getRepayments(),
    ])
      .then(([apps, reps]) => {
        if (cancelled) return;
        setAllApplications(apps);
        setAllRepayments(reps);
      })
      .catch(() => {
        if (!cancelled) setFetchError("Failed to load report data. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const cutoff = cutoffDate(range);

  const apps = useMemo(
    () => allApplications.filter(a => new Date(a.submittedAt) >= cutoff),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allApplications, range]
  );

  const reps = useMemo(
    () => allRepayments.filter(r => r.dueDate && new Date(r.dueDate) >= cutoff),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRepayments, range]
  );

  // ── Summary metrics ────────────────────────────────────────────────────────

  const totalRequests  = apps.length;
  const disbursed      = apps.filter(a => DISBURSED_STATUSES.has(a.status));
  const active         = apps.filter(a => ACTIVE_STATUSES.has(a.status));
  const totalDisbursed = disbursed.reduce((s, a) => s + (a.employerApprovedAmount || a.requestedAmount), 0);
  const approvalRate   = totalRequests > 0 ? Math.round((disbursed.length / totalRequests) * 100) : 0;
  const uniqueUsers    = new Set(disbursed.map(a => a.employeeId)).size;

  // ── Monthly trend (last 6 months, from all data regardless of range filter) ──
  const monthTrend = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return months.map(key => {
      const monthApps = allApplications.filter(
        a => monthKey(a.submittedAt) === key && DISBURSED_STATUSES.has(a.status)
      );
      return {
        label: monthLabel(key),
        count: monthApps.length,
        amount: monthApps.reduce((s, a) => s + (a.employerApprovedAmount || a.requestedAmount), 0),
      };
    });
  }, [allApplications]);

  // ── Status breakdown ───────────────────────────────────────────────────────
  const statusSegments = [
    { label: "Active/Disbursed", count: active.length,                                             cls: "bg-brand"   },
    { label: "Repaid",           count: apps.filter(a => a.status === "REPAID").length,            cls: "bg-success" },
    { label: "Pending review",   count: apps.filter(a => PENDING_STATUSES.has(a.status)).length,   cls: "bg-warning" },
    { label: "Rejected",         count: apps.filter(a => REJECTED_STATUSES.has(a.status)).length,  cls: "bg-danger"  },
  ];

  // ── Repayment health ───────────────────────────────────────────────────────
  const repSegments = [
    { label: "Paid",      count: reps.filter(r => r.status === "PAID").length,                              cls: "bg-success"  },
    { label: "Scheduled", count: reps.filter(r => r.status === "SCHEDULED" || r.status === "PENDING").length, cls: "bg-brand/60" },
    { label: "Overdue",   count: reps.filter(r => r.status === "OVERDUE").length,                           cls: "bg-danger"   },
  ];
  const overdueReps   = reps.filter(r => r.status === "OVERDUE");
  const overdueAmount = overdueReps.reduce((s, r) => s + r.totalAmount, 0);

  // ── Employee utilisation ───────────────────────────────────────────────────
  const employeeStats = useMemo(() => {
    const map = new Map<string, { name: string; code: string; count: number; amount: number; lastDate: string }>();
    disbursed.forEach(a => {
      const existing = map.get(a.employeeId);
      const amount = a.employerApprovedAmount || a.requestedAmount;
      if (existing) {
        existing.count++;
        existing.amount += amount;
        if (a.submittedAt > existing.lastDate) existing.lastDate = a.submittedAt;
      } else {
        map.set(a.employeeId, { name: a.employeeName, code: a.employeeCode, count: 1, amount, lastDate: a.submittedAt });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount).slice(0, 10);
  }, [apps]);

  const RANGES: { label: string; value: Range }[] = [
    { label: "This month",    value: "1m"  },
    { label: "Last 3 months", value: "3m"  },
    { label: "Last 6 months", value: "6m"  },
    { label: "All time",      value: "all" },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-ink-3">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[13px]">Loading reports…</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-ink-3">
        <AlertCircle size={20} className="text-danger" />
        <span className="text-[13px]">{fetchError}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header + range filter */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-[700] text-ink leading-tight">Reports</h1>
          <p className="text-[12px] text-ink-3 mt-0.5">Advance utilisation and repayment overview</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-edge bg-canvas p-0.5 flex-shrink-0">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-[11.5px] font-[500] rounded-md transition-colors ${
                range === r.value
                  ? "bg-surface text-ink shadow-sm"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          icon={BarChart2}
          label="Total requests"
          value={String(totalRequests)}
          sub={`${disbursed.length} disbursed`}
          colorCls="bg-brand-soft text-brand"
        />
        <StatCard
          icon={TrendingUp}
          label="Amount disbursed"
          value={INR(totalDisbursed)}
          sub={`${active.length} currently active`}
          colorCls="bg-success-bg text-success-dark"
        />
        <StatCard
          icon={CheckCircle2}
          label="Approval rate"
          value={`${approvalRate}%`}
          sub={`${totalRequests - disbursed.length} not approved`}
          colorCls="bg-[#EDE9FE] text-[#6D28D9]"
        />
        <StatCard
          icon={Users}
          label="Employees who used advances"
          value={String(uniqueUsers)}
          sub="unique employees"
          colorCls="bg-amber-50 text-amber-700"
        />
      </div>

      {/* Monthly trend + Status breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {/* Monthly trend */}
        <div className="rounded-xl border border-edge bg-surface p-4">
          <p className="text-[11px] font-[600] uppercase tracking-[0.07em] text-ink-3 mb-4">
            Monthly disbursals (last 6 months)
          </p>
          <BarChartViz data={monthTrend} />
          <div className="mt-3 flex gap-3 flex-wrap">
            {monthTrend.filter(m => m.count > 0).map(m => (
              <div key={m.label} className="text-[10.5px] text-ink-3">
                <span className="font-[500] text-ink">{m.label}</span> — {m.count} · {INR(m.amount)}
              </div>
            ))}
            {monthTrend.every(m => m.count === 0) && (
              <p className="text-[11px] text-ink-4">No disbursals in the last 6 months</p>
            )}
          </div>
        </div>

        {/* Status breakdown + repayment health */}
        <div className="rounded-xl border border-edge bg-surface p-4 space-y-4">
          <div>
            <p className="text-[11px] font-[600] uppercase tracking-[0.07em] text-ink-3 mb-3">
              Application status breakdown
            </p>
            {totalRequests === 0 ? (
              <p className="text-[11px] text-ink-4">No applications in this period</p>
            ) : (
              <StatusBar segments={statusSegments} />
            )}
          </div>

          <div className="border-t border-edge-2 pt-4">
            <p className="text-[11px] font-[600] uppercase tracking-[0.07em] text-ink-3 mb-3">
              Repayment health
            </p>
            {reps.length === 0 ? (
              <p className="text-[11px] text-ink-4">No repayments in this period</p>
            ) : (
              <StatusBar segments={repSegments} />
            )}
            {overdueAmount > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-danger-soft border border-danger-bg px-3 py-2">
                <AlertCircle size={11} className="text-danger flex-shrink-0" />
                <span className="text-[11px] text-danger font-[500]">
                  {INR(overdueAmount)} overdue across {overdueReps.length} repayment{overdueReps.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employee utilisation table */}
      <div className="rounded-xl border border-edge bg-surface">
        <div className="px-4 py-3 border-b border-edge">
          <p className="text-[11px] font-[600] uppercase tracking-[0.07em] text-ink-3">
            Top employees by advance usage
          </p>
        </div>
        {employeeStats.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[12px] text-ink-3">No disbursed advances in this period</p>
          </div>
        ) : (
          <div className="divide-y divide-edge-2">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-2 text-[10.5px] font-[500] uppercase tracking-[0.06em] text-ink-4">
              <span>Employee</span>
              <span className="text-right">Advances</span>
              <span className="text-right">Total amount</span>
              <span className="text-right">Last advance</span>
            </div>
            {employeeStats.map((e, i) => (
              <div
                key={e.code}
                className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center px-4 py-2.5 hover:bg-canvas transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft text-[9px] font-[700] text-brand">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-[500] text-ink truncate">{e.name}</p>
                    <p className="text-[10.5px] text-ink-4">{e.code}</p>
                  </div>
                </div>
                <p className="text-[12px] font-[600] text-ink text-right">{e.count}</p>
                <p className="text-[12px] font-[600] text-ink text-right">{INR(e.amount)}</p>
                <p className="text-[11px] text-ink-3 text-right">
                  {new Date(e.lastDate).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
