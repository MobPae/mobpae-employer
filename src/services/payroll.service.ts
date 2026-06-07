import { payrollSummary, repayments } from "./mock-data";
import type { PayrollSummary, Repayment } from "../types";

export const payrollService = {
  async getPayrollSummary(): Promise<PayrollSummary> {
    return { ...payrollSummary };
  },

  async getUpcomingRecoveries(): Promise<Repayment[]> {
    return repayments.filter((repayment) => repayment.status !== "PAID");
  }
};
