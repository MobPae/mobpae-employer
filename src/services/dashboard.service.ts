import { employeeService } from "./employee.service";
import { salaryRequestService } from "./salary-request.service";
import type { DashboardStats, NotificationItem, SalaryRequest } from "../types";
import { unwrapList } from "./api-mappers";
import { authService } from "./auth.service";
import { httpClient } from "./http-client";

type NotificationApiRecord = Record<string, unknown>;

const mapNotification = (value: unknown): NotificationItem => {
  const record = value && typeof value === "object" ? (value as NotificationApiRecord) : {};
  return {
    id: String(record.id ?? record._id ?? ""),
    title: String(record.title ?? record.type ?? "Notification"),
    description: String(record.description ?? record.message ?? ""),
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    type: "EMPLOYEE"
  };
};

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const employees = await employeeService.getEmployees();
    const salaryRequests = await salaryRequestService.getSalaryRequests().catch(() => []);

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((employee) => employee.employmentStatus === "ACTIVE").length,
      appActivatedEmployees: employees.filter((employee) => employee.appActivated).length,
      pendingSalaryRequests: salaryRequests.filter((request) =>
        ["SUBMITTED", "UNDER_REVIEW"].includes(request.status)
      ).length,
      approvedRequests: salaryRequests.filter((request) => request.status === "APPROVED").length,
      outstandingAmount: salaryRequests
        .filter((request) => ["APPROVED", "DISBURSED"].includes(request.status))
        .reduce((total, request) => total + request.approvedAmount, 0)
    };
  },

  async getRecentSalaryRequests(): Promise<SalaryRequest[]> {
    const salaryRequests = await salaryRequestService.getSalaryRequests().catch(() => []);
    return salaryRequests
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 5);
  },

  async getRecentNotifications(): Promise<NotificationItem[]> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser?.id) return [];

      const { data } = await httpClient.get(`/notifications/user/${currentUser.id}`);
      return unwrapList(data, ["notifications"]).map(mapNotification).slice(0, 5);
    } catch {
      return [];
    }
  }
};
