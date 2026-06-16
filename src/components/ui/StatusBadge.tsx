import type { EmploymentStatus, RepaymentStatus, SalaryRequestStatus } from "../../types";
import { readableStatus } from "../../utils/formatters";

type Status = EmploymentStatus | SalaryRequestStatus | RepaymentStatus | "ACTIVE_ACCESS" | "NO_ACCESS";

const toneByStatus: Record<Status, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  INACTIVE: "bg-blue-50 text-blue-700 ring-blue-100",
  SUBMITTED: "bg-amber-50 text-amber-700 ring-amber-200",
  UNDER_REVIEW: "bg-sky-50 text-sky-700 ring-sky-200",
  APPROVED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
  DISBURSED: "bg-violet-50 text-violet-700 ring-violet-200",
  REPAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  OVERDUE: "bg-rose-50 text-rose-700 ring-rose-200",
  ACTIVE_ACCESS: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  NO_ACCESS: "bg-blue-50 text-blue-700 ring-blue-100"
};

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ${toneByStatus[status]}`}>
      {label ?? readableStatus(status)}
    </span>
  );
}
