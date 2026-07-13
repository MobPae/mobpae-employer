import type { EmploymentStatus, LoanApplicationStatus, RepaymentStatus } from "../../types";
import { readableStatus } from "../../utils/formatters";

type Status = EmploymentStatus | LoanApplicationStatus | RepaymentStatus | "ACTIVE_ACCESS" | "NO_ACCESS";

const TONE: Record<string, string> = {
  ACTIVE:                          "bg-success-bg text-success ring-success-bg",
  INACTIVE:                        "bg-surface-muted text-ink-3 ring-edge",
  SUBMITTED:                       "bg-warning-bg text-warning ring-warning-bg",
  UNDER_REVIEW:                    "bg-warning-bg text-warning ring-warning-bg",
  EMPLOYER_APPROVED:               "bg-info-bg text-info ring-brand-muted",
  EMPLOYER_REJECTED:               "bg-danger-bg text-danger ring-danger-bg",
  AWAITING_MEMBERSHIP_PAYMENT:     "bg-warning-bg text-warning ring-warning-bg",
  AWAITING_PLATFORM_FEE_PAYMENT:   "bg-warning-bg text-warning ring-warning-bg",
  APPROVED:                        "bg-info-bg text-info ring-brand-muted",
  REJECTED:                        "bg-danger-bg text-danger ring-danger-bg",
  READY_FOR_DISBURSAL:             "bg-success-soft text-success ring-success-bg",
  DISBURSED:                       "bg-success-bg text-success ring-success-bg",
  REPAYMENT_SCHEDULED:             "bg-warning-soft text-warning-dark ring-warning-bg",
  REPAID:                          "bg-success-bg text-success-dark ring-success-bg",
  PENDING:                         "bg-warning-bg text-warning ring-warning-bg",
  SCHEDULED:                       "bg-warning-soft text-warning-dark ring-warning-bg",
  PAID:                            "bg-success-bg text-success ring-success-bg",
  OVERDUE:                         "bg-danger-bg text-danger ring-danger-bg",
  CANCELLED:                       "bg-surface-muted text-ink-3 ring-edge",
  EXPIRED:                         "bg-surface-muted text-ink-3 ring-edge",
  ACTIVE_ACCESS:                   "bg-success-bg text-success ring-success-bg",
  NO_ACCESS:                       "bg-surface-muted text-ink-3 ring-edge",
};

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const cls = TONE[status] ?? "bg-surface-muted text-ink-3 ring-edge";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${cls}`}>
      {label ?? readableStatus(status)}
    </span>
  );
}
