import { httpClient } from "./http-client";
import type { Repayment, RepaymentStatus } from "../types";

interface EmployerRepaymentItem {
  id: string;
  principalAmount: string | number;
  interestAmount: string | number;
  totalAmount: string | number;
  dueDate: string | null;
  status: RepaymentStatus;
  paidDate?: string | null;
  employee: {
    id: string;
    employeeCode: string;
    name: string;
  };
  loanApplication?: { id: string };
  salaryRequest?: { id: string }; // backward compat
}

function mapRepayment(r: EmployerRepaymentItem): Repayment {
  return {
    id: r.id,
    employeeId: r.employee?.id ?? "",
    employeeName: r.employee?.name ?? "—",
    loanApplicationId: (r.loanApplication?.id ?? r.salaryRequest?.id) ?? "",
    amount: Number(r.totalAmount) || 0,
    principalAmount: Number(r.principalAmount) || 0,
    interestAmount: Number(r.interestAmount) || 0,
    totalAmount: Number(r.totalAmount) || 0,
    dueDate: r.dueDate ?? "",
    status: r.status,
  };
}

export const repaymentService = {
  async getRepayments(): Promise<(Repayment & { employeeCode: string; paidDate?: string | null })[]> {
    const { data } = await httpClient.get("/repayments/employer");
    const items: EmployerRepaymentItem[] = Array.isArray(data)
      ? data
      : Array.isArray((data as Record<string, unknown>).data)
      ? ((data as Record<string, unknown[]>).data as EmployerRepaymentItem[])
      : [];
    return items.map(r => ({
      ...mapRepayment(r),
      employeeCode: r.employee?.employeeCode ?? "",
      paidDate: r.paidDate ?? null,
    }));
  },
};
