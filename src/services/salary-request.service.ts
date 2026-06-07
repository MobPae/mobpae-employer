import type { SalaryRequest } from "../types";
import { isForbidden } from "./api-errors";
import { mapSalaryRequest, unwrapItem, unwrapList } from "./api-mappers";
import { authService } from "./auth.service";
import { httpClient } from "./http-client";

export const salaryRequestService = {
  async getSalaryRequests(): Promise<SalaryRequest[]> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser?.role === "EMPLOYER" && !currentUser.employerId) {
        return [];
      }

      const endpoint =
        currentUser?.role === "EMPLOYER"
          ? `/salary-requests/employer/${currentUser.employerId}/pending`
          : "/salary-requests";
      const { data } = await httpClient.get(endpoint);
      return unwrapList(data, ["salaryRequests", "requests"]).map(mapSalaryRequest);
    } catch (error) {
      if (isForbidden(error)) return [];
      throw error;
    }
  },

  async getSalaryRequestById(id: string): Promise<SalaryRequest | undefined> {
    const requests = await this.getSalaryRequests();
    return requests.find((request) => request.id === id || request.requestId === id);
  },

  async approveRequest(id: string, approvedAmount?: number): Promise<SalaryRequest> {
    const { data } = await httpClient.post(`/salary-requests/${id}/approve`, { approvedAmount });
    return mapSalaryRequest(unwrapItem(data, ["salaryRequest", "request"]));
  },

  async rejectRequest(id: string): Promise<SalaryRequest> {
    const { data } = await httpClient.post(`/salary-requests/${id}/reject`);
    return mapSalaryRequest(unwrapItem(data, ["salaryRequest", "request"]));
  }
};
