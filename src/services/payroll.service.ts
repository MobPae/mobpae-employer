import type { PayrollSettingsPayload, PayrollSummary, Repayment } from "../types";
import { mapPayrollSummary, mapRepayment, unwrapItem, unwrapList } from "./api-mappers";
import { httpClient } from "./http-client";

export const payrollService = {
  async getPayrollSummary(): Promise<PayrollSummary> {
    const { data } = await httpClient.get("/payroll/employer/summary");
    return mapPayrollSummary(unwrapItem(data, ["summary"]));
  },

  async getUpcomingRecoveries(): Promise<Repayment[]> {
    const { data } = await httpClient.get("/payroll/employer/recoveries");
    return unwrapList(data, ["recoveries"]).map(mapRepayment);
  },

  async updatePayrollSettings(payload: PayrollSettingsPayload): Promise<PayrollSummary> {
    await httpClient.put("/payroll/employer/settings", payload);
    return this.getPayrollSummary();
  },

  async processPayrollRecovery(): Promise<{
    processedCount: number;
    totalAmount: number;
    settlementId: string;
    payrollMonth: string;
    dueDate: string;
  }> {
    const { data } = await httpClient.post("/payroll/employer/process");
    const d = (data as Record<string, unknown>) ?? {};
    return {
      processedCount: Number(d.processedRepayments ?? d.processedCount ?? d.count ?? 0),
      totalAmount:    Number(d.settlementAmount ?? d.totalAmount ?? d.amount ?? 0),
      settlementId:   String(d.settlementId ?? ""),
      payrollMonth:   String(d.payrollMonth ?? ""),
      dueDate:        String(d.dueDate ?? ""),
    };
  },
};
