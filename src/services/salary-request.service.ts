import { salaryRequests as salaryRequestSeed } from "./mock-data";
import type { SalaryRequest } from "../types";

let salaryRequests: SalaryRequest[] = [...salaryRequestSeed];

export const salaryRequestService = {
  async getSalaryRequests(): Promise<SalaryRequest[]> {
    return [...salaryRequests];
  },

  async getSalaryRequestById(id: string): Promise<SalaryRequest | undefined> {
    return salaryRequests.find((request) => request.id === id);
  },

  async approveRequest(id: string, approvedAmount?: number): Promise<SalaryRequest> {
    let updatedRequest: SalaryRequest | undefined;

    salaryRequests = salaryRequests.map((request) => {
      if (request.id !== id) {
        return request;
      }

      updatedRequest = {
        ...request,
        approvedAmount: approvedAmount ?? request.requestedAmount,
        status: "APPROVED",
        reviewerNote: "Approved by employer admin"
      };
      return updatedRequest;
    });

    if (!updatedRequest) {
      throw new Error("Salary request not found");
    }

    return updatedRequest;
  },

  async rejectRequest(id: string): Promise<SalaryRequest> {
    let updatedRequest: SalaryRequest | undefined;

    salaryRequests = salaryRequests.map((request) => {
      if (request.id !== id) {
        return request;
      }

      updatedRequest = {
        ...request,
        approvedAmount: 0,
        status: "REJECTED",
        reviewerNote: "Rejected by employer admin"
      };
      return updatedRequest;
    });

    if (!updatedRequest) {
      throw new Error("Salary request not found");
    }

    return updatedRequest;
  }
};
