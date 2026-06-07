import { BadgeCheck, CircleDollarSign, Clock3, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { DataTable } from "../../components/ui/DataTable";
import { MetricCard } from "../../components/ui/MetricCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { dashboardService } from "../../services/dashboard.service";
import type { DashboardStats, NotificationItem, SalaryRequest } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requests, setRequests] = useState<SalaryRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    Promise.all([
      dashboardService.getDashboardStats(),
      dashboardService.getRecentSalaryRequests(),
      dashboardService.getRecentNotifications()
    ]).then(([nextStats, nextRequests, nextNotifications]) => {
      setStats(nextStats);
      setRequests(nextRequests);
      setNotifications(nextNotifications);
    });
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Employer command center"
        title="Dashboard"
        description="A real-time operating view for employee activation, salary access requests and payroll recovery exposure."
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Total Employees" value={stats?.totalEmployees ?? "-"} icon={<UsersRound size={19} />} />
        <MetricCard label="Active Employees" value={stats?.activeEmployees ?? "-"} icon={<ShieldCheck size={19} />} />
        <MetricCard label="App Activated" value={stats?.appActivatedEmployees ?? "-"} icon={<BadgeCheck size={19} />} />
        <MetricCard label="Pending Requests" value={stats?.pendingSalaryRequests ?? "-"} icon={<Clock3 size={19} />} />
        <MetricCard label="Approved Requests" value={stats?.approvedRequests ?? "-"} icon={<WalletCards size={19} />} />
        <MetricCard label="Outstanding Amount" value={formatCurrency(stats?.outstandingAmount ?? 0)} icon={<CircleDollarSign size={19} />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-950">Recent Salary Requests</h2>
            <p className="mt-1 text-sm text-slate-500">Latest employee EWA activity awaiting HR and payroll attention.</p>
          </div>
          <DataTable
            data={requests}
            columns={[
              { key: "id", header: "Request ID", render: (request) => <span className="font-semibold text-slate-950">{request.requestId}</span> },
              { key: "employee", header: "Employee", render: (request) => request.employeeName },
              { key: "requested", header: "Requested", render: (request) => formatCurrency(request.requestedAmount) },
              { key: "approved", header: "Approved", render: (request) => formatCurrency(request.approvedAmount) },
              { key: "status", header: "Status", render: (request) => <StatusBadge status={request.status} /> },
              { key: "date", header: "Created", render: (request) => formatDate(request.createdDate) }
            ]}
          />
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-950">Recent Notifications</h2>
          <div className="mt-4 grid gap-3">
            {notifications.map((notification) => (
              <article key={notification.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-bold text-slate-950">{notification.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">{notification.description}</p>
                <p className="mt-2 text-xs font-semibold text-slate-400">{formatDate(notification.createdAt)}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </>
  );
}
