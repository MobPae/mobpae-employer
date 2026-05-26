import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  CheckCircle2,
  IndianRupee,
  Loader2,
  RefreshCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { api } from "../services/api";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
type DisbursalStatus = "PENDING" | "DISBURSED" | "FAILED";
type RepaymentStatus = "PENDING" | "PAID" | "OVERDUE";

type AdvanceRequest = {
  id: string;
  amount: number;
  requestMonth?: number;
  requestYear?: number;
  status: RequestStatus;
  employerRemarks?: string;
  createdAt?: string;
  employee?: {
    id: string;
    name: string;
    email?: string;
    employeeCode?: string;
  };
  disbursal?: {
    id: string;
    status: DisbursalStatus;
  } | null;
  repayment?: {
    id: string;
    status: RepaymentStatus;
    dueDate?: string;
  } | null;
};

type ActionType = "APPROVED" | "REJECTED";

export function RequestsPage() {
  const [requests, setRequests] = useState<AdvanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RequestStatus>(
    "ALL"
  );

  const [selectedRequest, setSelectedRequest] = useState<AdvanceRequest | null>(
    null
  );
  const [actionType, setActionType] = useState<ActionType>("APPROVED");
  const [remarks, setRemarks] = useState("");

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchRequests() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/advance-requests");

      const data =
        response.data?.data?.data ||
        response.data?.data?.items ||
        response.data?.data ||
        response.data ||
        [];

      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setError("Unable to load advance requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function handleRequestAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedRequest) return;

    setActionLoading(true);
    setActionError("");
    setSuccess("");

    try {
      await api.patch(`/advance-requests/${selectedRequest.id}/status`, {
        status: actionType,
        employerRemarks: remarks.trim() || undefined,
      });

      setSuccess(
        actionType === "APPROVED"
          ? "Request approved successfully."
          : "Request rejected successfully."
      );

      closeActionModal();
      await fetchRequests();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to update request";

      setActionError(Array.isArray(message) ? message[0] : message);
    } finally {
      setActionLoading(false);
    }
  }

  function openActionModal(request: AdvanceRequest, type: ActionType) {
    setSelectedRequest(request);
    setActionType(type);
    setRemarks("");
    setActionError("");
  }

  function closeActionModal() {
    setSelectedRequest(null);
    setRemarks("");
    setActionError("");
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const value =
        `${request.employee?.name} ${request.employee?.email} ${request.employee?.employeeCode} ${request.status}`.toLowerCase();

      const matchesSearch = value.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === "PENDING").length,
      approved: requests.filter((item) => item.status === "APPROVED").length,
      rejected: requests.filter((item) => item.status === "REJECTED").length,
    };
  }, [requests]);

  function formatAmount(value?: number) {
    if (!value) return "-";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatDate(value?: string) {
    if (!value) return "-";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  }

  function formatMonth(month?: number, year?: number) {
    if (!month || !year) return "-";

    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "numeric",
    }).format(new Date(year, month - 1, 1));
  }

  function getStatusClass(status?: RequestStatus) {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "REJECTED":
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-100";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  }

  function getMiniStatusClass(status?: string) {
    switch (status) {
      case "DISBURSED":
      case "PAID":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "FAILED":
      case "OVERDUE":
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
          <p className="text-sm font-semibold text-primary">Requests</p>
          <h2 className="mt-2 text-2xl font-black">
            Employee Advance Requests
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review salary advance requests raised by your employees and approve
            or reject pending requests.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </section>

      {success && (
        <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Total Requests" value={summary.total} />
        <SummaryCard label="Pending" value={summary.pending} />
        <SummaryCard label="Approved" value={summary.approved} />
        <SummaryCard label="Rejected" value={summary.rejected} />
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
              placeholder="Search employee, email, code..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "ALL" | RequestStatus)
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-50"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </section>

      {loading && (
        <div className="flex items-center gap-2 rounded-[1.5rem] bg-white p-6 text-sm font-semibold text-slate-500 shadow-soft">
          <Loader2 className="animate-spin text-primary" size={18} />
          Loading requests...
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
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Month</th>
                  <th className="px-5 py-4">Request Status</th>
                  <th className="px-5 py-4">Disbursal</th>
                  <th className="px-5 py-4">Repayment</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {request.employee?.name || "-"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {request.employee?.email || "-"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {request.employee?.employeeCode || "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1 font-black text-slate-900">
                        <IndianRupee size={15} />
                        {formatAmount(request.amount).replace("₹", "")}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {formatMonth(request.requestMonth, request.requestYear)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${getMiniStatusClass(
                          request.disbursal?.status
                        )}`}
                      >
                        {request.disbursal?.status || "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${getMiniStatusClass(
                          request.repayment?.status
                        )}`}
                      >
                        {request.repayment?.status || "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(request.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      {request.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openActionModal(request, "APPROVED")}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                          >
                            <CheckCircle2 size={14} />
                            Approve
                          </button>

                          <button
                            onClick={() => openActionModal(request, "REJECTED")}
                            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <p className="text-right text-xs font-semibold text-slate-400">
                          No action
                        </p>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredRequests.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No advance requests found. Requests will appear here once
                      employees raise salary advance requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={handleRequestAction}
            className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-soft"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black">
                  {actionType === "APPROVED"
                    ? "Approve Request"
                    : "Reject Request"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedRequest.employee?.name || "Employee"} requested{" "}
                  {formatAmount(selectedRequest.amount)}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeActionModal}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {actionError}
              </div>
            )}

            <label className="mt-6 block">
              <span className="text-sm font-bold text-slate-700">Remarks</span>
              <textarea
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                rows={4}
                placeholder="Optional remarks"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeActionModal}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={actionLoading}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                  actionType === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionLoading && (
                  <Loader2 className="animate-spin" size={16} />
                )}
                {actionLoading
                  ? "Updating..."
                  : actionType === "APPROVED"
                  ? "Approve Request"
                  : "Reject Request"}
              </button>
            </div>
          </form>
        </div>
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
