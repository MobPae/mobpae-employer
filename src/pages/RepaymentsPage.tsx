import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  IndianRupee,
  Loader2,
  RefreshCcw,
  Search,
} from "lucide-react";
import { api } from "../services/api";

type RepaymentStatus = "PENDING" | "PAID" | "OVERDUE";

type Repayment = {
  id: string;
  amount: number;
  dueDate?: string;
  paidAt?: string | null;
  paymentRef?: string | null;
  status: RepaymentStatus;
  createdAt?: string;
  advanceRequest?: {
    id: string;
    amount?: number;
    status?: string;
    employee?: {
      id: string;
      name: string;
      email?: string;
      employeeCode?: string;
    };
    employer?: {
      id: string;
      companyName?: string;
    };
    disbursal?: {
      id: string;
      status?: string;
      transactionRef?: string | null;
    } | null;
  };
};

export function RepaymentsPage() {
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RepaymentStatus>(
    "ALL"
  );

  const [error, setError] = useState("");

  async function fetchRepayments() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/repayments");

      const data =
        response.data?.data?.data ||
        response.data?.data?.items ||
        response.data?.data ||
        response.data ||
        [];

      setRepayments(Array.isArray(data) ? data : []);
    } catch {
      setError("Unable to load repayments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRepayments();
  }, []);

  const filteredRepayments = useMemo(() => {
    return repayments.filter((repayment) => {
      const employee = repayment.advanceRequest?.employee;

      const value =
        `${employee?.name} ${employee?.email} ${employee?.employeeCode} ${repayment.status} ${repayment.paymentRef}`.toLowerCase();

      const matchesSearch = value.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || repayment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [repayments, search, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: repayments.length,
      pending: repayments.filter((item) => item.status === "PENDING").length,
      paid: repayments.filter((item) => item.status === "PAID").length,
      overdue: repayments.filter((item) => item.status === "OVERDUE").length,
    };
  }, [repayments]);

  function formatAmount(value?: number) {
    if (!value) return "-";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatDate(value?: string | null) {
    if (!value) return "-";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  }

  function getStatusClass(status?: RepaymentStatus) {
    switch (status) {
      case "PAID":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "OVERDUE":
        return "bg-red-50 text-red-700 border-red-100";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  }

  function getDisbursalClass(status?: string) {
    switch (status) {
      case "DISBURSED":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "FAILED":
        return "bg-red-50 text-red-700 border-red-100";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Repayments</p>
          <h2 className="mt-2 text-2xl font-black">Employee Repayments</h2>
          <p className="mt-1 text-sm text-slate-500">
            Track repayment status, due dates, paid dates, and linked disbursal
            information for your employees.
          </p>
        </div>

        <button
          onClick={fetchRepayments}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Total Repayments" value={summary.total} />
        <SummaryCard label="Pending" value={summary.pending} />
        <SummaryCard label="Paid" value={summary.paid} />
        <SummaryCard label="Overdue" value={summary.overdue} />
      </section>

      <section className="rounded-[1.5rem] bg-white p-4 shadow-soft">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              className="absolute left-4 top-3.5 text-slate-400"
              size={18}
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee, email, code, payment ref..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "ALL" | RepaymentStatus)
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-50"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </section>

      {loading && (
        <div className="flex items-center gap-2 rounded-[1.5rem] bg-white p-6 text-sm font-semibold text-slate-500 shadow-soft">
          <Loader2 className="animate-spin text-primary" size={18} />
          Loading repayments...
        </div>
      )}

      {error && (
        <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-6 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <section className="overflow-hidden rounded-[1.5rem] bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Repayment Amount</th>
                  <th className="px-5 py-4">Due Date</th>
                  <th className="px-5 py-4">Paid Date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Disbursal</th>
                  <th className="px-5 py-4">Payment Ref</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredRepayments.map((repayment) => {
                  const employee = repayment.advanceRequest?.employee;
                  const disbursal = repayment.advanceRequest?.disbursal;

                  return (
                    <tr key={repayment.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">
                          {employee?.name || "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {employee?.email || "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {employee?.employeeCode || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1 font-black text-slate-900">
                          <IndianRupee size={15} />
                          {formatAmount(repayment.amount).replace("₹", "")}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-2 font-semibold text-slate-700">
                          <CalendarDays size={15} className="text-slate-400" />
                          {formatDate(repayment.dueDate)}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(repayment.paidAt)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                            repayment.status
                          )}`}
                        >
                          {repayment.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getDisbursalClass(
                            disbursal?.status
                          )}`}
                        >
                          {disbursal?.status || "-"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                        {repayment.paymentRef ||
                          disbursal?.transactionRef ||
                          "-"}
                      </td>
                    </tr>
                  );
                })}

                {filteredRepayments.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No repayments found. Repayments will appear after salary
                      advance requests are approved and disbursed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-5 shadow-soft">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-2 text-2xl font-black text-slate-900">{value}</h3>
    </div>
  );
}
