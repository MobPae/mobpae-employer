import { Check, Eye, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { Drawer } from "../../components/ui/Drawer";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api-errors";
import { salaryRequestService } from "../../services/salary-request.service";
import type { SalaryRequest, SalaryRequestStatus } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

export function SalaryRequestsPage() {
  const toast = useToast();
  const [requests, setRequests] = useState<SalaryRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SalaryRequest | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | SalaryRequestStatus>("ALL");
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");

  const refresh = () => {
    salaryRequestService
      .getSalaryRequests()
      .then(setRequests)
      .catch((error) => toast.error("Unable to load salary requests", getApiErrorMessage(error)));
  };

  useEffect(() => {
    refresh();
  }, []);

  const filteredRequests = useMemo(
    () =>
      requests.filter((request) => {
        const searchable = `${request.requestId} ${request.employeeName} ${request.employeeCode}`.toLowerCase();
        return searchable.includes(query.toLowerCase()) && (status === "ALL" || request.status === status);
      }),
    [query, requests, status]
  );

  const canReview = selectedRequest && ["PENDING", "SUBMITTED", "UNDER_REVIEW"].includes(selectedRequest.status);

  return (
    <>
      <PageHeader
        eyebrow="Earned wage access"
        title="Salary Requests"
        description="Review employee requests, approve eligible amounts and keep payroll exposure visible."
      />

      <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <Input icon={<Search size={16} />} placeholder="Search requests" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as "ALL" | SalaryRequestStatus)}
            options={[
              { label: "All statuses", value: "ALL" },
              { label: "Pending", value: "PENDING" },
              { label: "Submitted", value: "SUBMITTED" },
              { label: "Under review", value: "UNDER_REVIEW" },
              { label: "Approved", value: "APPROVED" },
              { label: "Rejected", value: "REJECTED" },
              { label: "Disbursed", value: "DISBURSED" },
              { label: "Repaid", value: "REPAID" }
            ]}
          />
        </div>

        <div className="mt-4">
          <DataTable
            data={filteredRequests}
            columns={[
              { key: "id", header: "Request ID", render: (request) => <span className="font-semibold text-slate-950">{request.requestId}</span> },
              { key: "employee", header: "Employee", render: (request) => <div><p className="font-semibold text-slate-950">{request.employeeName}</p><p className="text-xs text-slate-500">{request.employeeCode}</p></div> },
              { key: "requested", header: "Requested Amount", render: (request) => formatCurrency(request.requestedAmount) },
              { key: "approved", header: "Approved Amount", render: (request) => formatCurrency(request.approvedAmount) },
              { key: "status", header: "Status", render: (request) => <StatusBadge status={request.status} /> },
              { key: "created", header: "Created Date", render: (request) => formatDate(request.createdDate) },
              {
                key: "actions",
                header: "Actions",
                render: (request) => (
                  <Button
                    variant="ghost"
                    icon={<Eye size={15} />}
                    onClick={() => {
                      setRejectRemarks("");
                      setSelectedRequest(request);
                    }}
                  >
                    View
                  </Button>
                )
              }
            ]}
          />
        </div>
      </section>

      <Drawer open={Boolean(selectedRequest)} title="Request Details" description={selectedRequest?.requestId} onClose={() => setSelectedRequest(null)}>
        {selectedRequest ? (
          <div className="grid gap-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-sm font-bold text-slate-950">{selectedRequest.employeeName}</p>
              <p className="mt-1 text-sm text-slate-500">{selectedRequest.employeeCode}</p>
              <div className="mt-4"><StatusBadge status={selectedRequest.status} /></div>
            </div>
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Requested</dt><dd className="font-semibold text-slate-950">{formatCurrency(selectedRequest.requestedAmount)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Approved</dt><dd className="font-semibold text-slate-950">{formatCurrency(selectedRequest.approvedAmount)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Purpose</dt><dd className="font-semibold text-slate-950">{selectedRequest.purpose}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Created</dt><dd className="font-semibold text-slate-950">{formatDate(selectedRequest.createdDate)}</dd></div>
            </dl>
            {canReview ? (
              <div className="grid gap-3 border-t border-blue-100 pt-4">
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                  Rejection remarks
                  <textarea
                    className="min-h-24 rounded-md border border-blue-100 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    placeholder="Employee not eligible for salary advance"
                    value={rejectRemarks}
                    onChange={(event) => setRejectRemarks(event.target.value)}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                <Button
                  icon={<Check size={16} />}
                  disabled={Boolean(reviewAction)}
                  onClick={async () => {
                    setReviewAction("APPROVE");
                    try {
                      await salaryRequestService.approveRequest(selectedRequest.id);
                      await refresh();
                      toast.success("Request approved", selectedRequest.requestId);
                      setSelectedRequest(null);
                    } catch (error) {
                      toast.error("Unable to approve request", getApiErrorMessage(error));
                    } finally {
                      setReviewAction(null);
                    }
                  }}
                >
                  {reviewAction === "APPROVE" ? "Approving..." : "Approve"}
                </Button>
                <Button
                  variant="danger"
                  icon={<X size={16} />}
                  disabled={Boolean(reviewAction) || !rejectRemarks.trim()}
                  onClick={async () => {
                    setReviewAction("REJECT");
                    try {
                      await salaryRequestService.rejectRequest(selectedRequest.id, rejectRemarks.trim());
                      await refresh();
                      toast.success("Request rejected", selectedRequest.requestId);
                      setSelectedRequest(null);
                      setRejectRemarks("");
                    } catch (error) {
                      toast.error("Unable to reject request", getApiErrorMessage(error));
                    } finally {
                      setReviewAction(null);
                    }
                  }}
                >
                  {reviewAction === "REJECT" ? "Rejecting..." : "Reject"}
                </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
