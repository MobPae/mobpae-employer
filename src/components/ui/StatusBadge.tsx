import type { EmploymentStatus, RepaymentStatus, SalaryRequestStatus } from "../../types";
import { readableStatus } from "../../utils/formatters";

type Status = EmploymentStatus | SalaryRequestStatus | RepaymentStatus | "ACTIVE_ACCESS" | "NO_ACCESS";

const toneByStatus: Record<Status, string> = {
  ACTIVE:              "bg-[#EBF6E3] text-[#3B6D11] ring-[#9FD5B0]",
  INACTIVE:            "bg-[#F0F0F8] text-[#62657A] ring-[#D4D5E0]",
  SUBMITTED:           "bg-amber-50 text-amber-700 ring-amber-200",
  UNDER_REVIEW:        "bg-amber-50 text-amber-700 ring-amber-200",
  EMPLOYER_APPROVED:             "bg-[#E7F1FC] text-[#185FA5] ring-[#B5D4F4]",
  EMPLOYER_REJECTED:             "bg-red-50 text-red-600 ring-red-200",
  AWAITING_MEMBERSHIP_PAYMENT:   "bg-amber-50 text-amber-700 ring-amber-200",
  APPROVED:            "bg-[#E7F1FC] text-[#185FA5] ring-[#B5D4F4]",
  REJECTED:            "bg-red-50 text-red-600 ring-red-200",
  READY_FOR_DISBURSAL: "bg-lime-50 text-lime-700 ring-lime-200",
  DISBURSED:           "bg-[#EBF6E3] text-[#3B6D11] ring-[#9FD5B0]",
  REPAYMENT_SCHEDULED: "bg-[#FEF1E7] text-[#9A4910] ring-[#F5CBA7]",
  REPAID:              "bg-[#D4EDE5] text-[#1A5944] ring-[#A8D5C5]",
  PENDING:             "bg-amber-50 text-amber-700 ring-amber-200",
  SCHEDULED:           "bg-[#FEF1E7] text-[#9A4910] ring-[#F5CBA7]",
  PAID:                "bg-[#EBF6E3] text-[#3B6D11] ring-[#9FD5B0]",
  OVERDUE:             "bg-red-50 text-red-600 ring-red-200",
  ACTIVE_ACCESS:       "bg-[#EBF6E3] text-[#3B6D11] ring-[#9FD5B0]",
  NO_ACCESS:           "bg-[#F0F0F8] text-[#62657A] ring-[#D4D5E0]",
};

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ${toneByStatus[status]}`}>
      {label ?? readableStatus(status)}
    </span>
  );
}
