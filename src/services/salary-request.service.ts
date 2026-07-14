import type { LoanApplication, LoanApplicationHistoryEvent } from "../types";
import { isForbidden, isNotFound } from "./api-errors";
import { mapLoanApplication, mapLoanApplicationHistoryEvent, unwrapItem, unwrapList } from "./api-mappers";
import { httpClient } from "./http-client";

export const salaryRequestService = {
  async getSalaryRequests(): Promise<LoanApplication[]> {
    try {
      const { data } = await httpClient.get("/loan-applications/employer");
      return unwrapList(data, ["loanApplications", "applications", "salaryRequests", "requests"]).map(
        mapLoanApplication
      );
    } catch (error) {
      if (isForbidden(error)) return [];
      throw error;
    }
  },

  async getSalaryRequestById(id: string): Promise<LoanApplication | undefined> {
    const requests = await this.getSalaryRequests();
    return requests.find(
      (request) => request.id === id || request.applicationNumber === id
    );
  },

  async approveRequest(id: string): Promise<LoanApplication> {
    const { data } = await httpClient.post(`/loan-applications/${id}/employer-approve`);
    return mapLoanApplication(unwrapItem(data, ["loanApplication", "salaryRequest", "request"]));
  },

  async rejectRequest(id: string, remarks: string): Promise<LoanApplication> {
    const { data } = await httpClient.post(`/loan-applications/${id}/employer-reject`, { remarks });
    return mapLoanApplication(unwrapItem(data, ["loanApplication", "salaryRequest", "request"]));
  },

  async getHistory(id: string): Promise<LoanApplicationHistoryEvent[]> {
    try {
      const { data } = await httpClient.get(`/loan-applications/${id}/history`);
      return unwrapList(data, ["history", "events"]).map(mapLoanApplicationHistoryEvent);
    } catch (error) {
      // Endpoint may not exist yet on older backends — show nothing rather than crash.
      if (isNotFound(error)) return [];
      throw error;
    }
  },

  async bulkAction(
    action: "APPROVE" | "REJECT",
    ids: string[],
    remarks?: string
  ): Promise<{ succeeded: string[]; failed: string[] }> {
    const { data } = await httpClient.post("/loan-applications/bulk-action", {
      action,
      ids,
      ...(remarks ? { remarks } : {}),
    });
    const d = data as Record<string, unknown>;
    return {
      succeeded: (Array.isArray(d.succeeded) ? d.succeeded : []) as string[],
      failed:    (Array.isArray(d.failed)    ? d.failed    : []) as string[],
    };
  },
};
