import type { PayrollSummary, Repayment } from "../types";
import { employerService } from "./employer.service";
import { repaymentService } from "./repayment.service";

export const payrollService = {
  async getPayrollSummary(): Promise<PayrollSummary> {
    const [profile, repayments] = await Promise.all([
      employerService.getEmployerProfile(),
      repaymentService.getRepayments()
    ]);
    const pendingRecoveries = repayments.filter((repayment) => repayment.status !== "PAID");

    return {
      payrollDate: profile.payrollDate,
      payrollCutoffDate: profile.payrollCutoffDate,
      employeesDue: new Set(pendingRecoveries.map((repayment) => repayment.employeeId)).size,
      totalRecoveryAmount: pendingRecoveries.reduce((total, repayment) => total + repayment.amount, 0)
    };
  },

  async getUpcomingRecoveries(): Promise<Repayment[]> {
    const repayments = await repaymentService.getRepayments();
    return repayments.filter((repayment) => repayment.status !== "PAID");
  }
};
