import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import {
  ClipboardList,
  IndianRupee,
  Loader2,
  ReceiptIndianRupee,
  RefreshCcw,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { getAuthUser } from "../services/auth";

type Employer = {
  id: string;
  companyName?: string;
};

type Employee = {
  id: string;
  name: string;
  email?: string;
  status?: string;
  activationStatus?: string;
  salaryInHand?: number;
  availableLimit?: number;
};

type AdvanceRequest = {
  id: string;
  amount: number;
  status: string;
  createdAt?: string;
  employee?: {
    name?: string;
    email?: string;
  };
};

type Repayment = {
  id: string;
  amount: number;
  status: string;
  dueDate?: string;
  advanceRequest?: {
    employee?: {
      name?: string;
      email?: string;
    };
  };
};

export function DashboardPage() {
  const authUser = getAuthUser();

  const [employer, setEmployer] = useState<Employer | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<AdvanceRequest[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dashboardTitle = employer?.companyName
    ? `${employer.companyName} Dashboard`
    : "Company Dashboard";

  function unwrap(response: any) {
    return (
      response?.data?.data?.data ||
      response?.data?.data?.items ||
      response?.data?.data ||
      response?.data ||
      null
    );
  }

  function unwrapList(response: any) {
    const data = unwrap(response);
    return Array.isArray(data) ? data : [];
  }

  async function fetchDashboard() {
    setLoading(true);
    setError("");

    try {
      const [employeesRes, requestsRes, repaymentsRes, employerRes] =
        await Promise.all([
          api.get("/employees"),
          api.get("/advance-requests"),
          api.get("/repayments"),
          authUser?.employerId
            ? api.get(`/employers/${authUser.employerId}`)
            : Promise.resolve(null),
        ]);

      setEmployees(unwrapList(employeesRes));
      setRequests(unwrapList(requestsRes));
      setRepayments(unwrapList(repaymentsRes));

      const employerData = employerRes ? unwrap(employerRes) : null;
      setEmployer(employerData);
    } catch {
      setError("Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const summary = useMemo(() => {
    const pendingRequests = requests.filter(
      (item) => item.status === "PENDING"
    ).length;

    const approvedRequests = requests.filter(
      (item) => item.status === "APPROVED"
    ).length;

    const pendingRepayments = repayments.filter(
      (item) => item.status === "PENDING"
    ).length;

    const totalAvailableLimit = employees.reduce(
      (total, item) => total + Number(item.availableLimit || 0),
      0
    );

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((item) => item.status === "ACTIVE")
        .length,
      activatedEmployees: employees.filter(
        (item) => item.activationStatus === "ACTIVATED"
      ).length,
      pendingRequests,
      approvedRequests,
      pendingRepayments,
      totalAvailableLimit,
    };
  }, [employees, requests, repayments]);

  function formatAmount(value?: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  const recentRequests = requests.slice(0, 5);
  const upcomingRepayments = repayments.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-[1.5rem] bg-white p-6 text-sm font-semibold text-slate-500 shadow-soft">
        <Loader2 className="animate-spin text-primary" size={18} />
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-6 text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 to-blue-950 p-6 text-white shadow-soft md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-200">
              Employer Overview
            </p>
            <h2 className="mt-2 text-3xl font-black">{dashboardTitle}</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              Track your employees, salary advance requests, available limits,
              and repayment status from one place.
            </p>
          </div>

          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Employees"
          value={summary.totalEmployees}
          helper={`${summary.activeEmployees} active`}
          icon={Users}
          to="/employees"
        />

        <SummaryCard
          label="App Activated"
          value={summary.activatedEmployees}
          helper="Employees onboarded"
          icon={Users}
          to="/employees"
        />

        <SummaryCard
          label="Pending Requests"
          value={summary.pendingRequests}
          helper="Needs approval"
          icon={ClipboardList}
          to="/requests"
        />

        <SummaryCard
          label="Pending Repayments"
          value={summary.pendingRepayments}
          helper="Due from employees"
          icon={ReceiptIndianRupee}
          to="/repayments"
        />
      </section>

      <section className="rounded-[1.5rem] bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-black">Available Salary Limit</h3>
            <p className="mt-1 text-sm text-slate-500">
              Total available advance limit across all active employees.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-5 py-3 text-2xl font-black text-primary">
            <IndianRupee size={22} />
            {formatAmount(summary.totalAvailableLimit).replace("₹", "")}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DashboardList
          title="Recent Requests"
          description="Latest salary advance requests."
          empty="No requests found."
          items={recentRequests.map((item) => ({
            id: item.id,
            title: item.employee?.name || "Unknown employee",
            subtitle: item.employee?.email || "-",
            meta: `${formatAmount(item.amount)} • ${item.status}`,
            to: "/requests",
          }))}
        />

        <DashboardList
          title="Upcoming Repayments"
          description="Repayment records for approved requests."
          empty="No repayments found."
          items={upcomingRepayments.map((item) => ({
            id: item.id,
            title: item.advanceRequest?.employee?.name || "Unknown employee",
            subtitle: item.dueDate
              ? `Due: ${new Date(item.dueDate).toLocaleDateString()}`
              : "Due date not available",
            meta: `${formatAmount(item.amount)} • ${item.status}`,
            to: "/repayments",
          }))}
        />
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  icon: Icon,
  to,
}: {
  label: string;
  value: number;
  helper: string;
  icon: ElementType;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-[1.5rem] bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <h3 className="mt-3 text-3xl font-black text-slate-950">{value}</h3>
          <p className="mt-2 text-sm text-slate-500">{helper}</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary">
          <Icon size={24} />
        </div>
      </div>
    </Link>
  );
}

function DashboardList({
  title,
  description,
  empty,
  items,
}: {
  title: string;
  description: string;
  empty: string;
  items: {
    id: string;
    title: string;
    subtitle: string;
    meta: string;
    to: string;
  }[];
}) {
  return (
    <div className="rounded-[1.5rem] bg-white p-6 shadow-soft">
      <div>
        <h3 className="text-xl font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-primary hover:bg-white"
          >
            <p className="font-bold text-slate-900">{item.title}</p>
            <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-wide text-primary">
              {item.meta}
            </p>
          </Link>
        ))}

        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
            {empty}
          </div>
        )}
      </div>
    </div>
  );
}
