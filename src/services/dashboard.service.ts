import { salaryRequestService } from "./salary-request.service";
import type { DashboardStats, NotificationItem, SalaryRequest } from "../types";
import { mapDashboardStats, unwrapItem, unwrapList } from "./api-mappers";
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
    const { data } = await httpClient.get("/dashboard/employers/me");
    const stats = mapDashboardStats(unwrapItem(data, ["dashboard", "stats"]));

    return {
      totalEmployees: stats.totalEmployees ?? 0,
      activeEmployees: stats.activeEmployees ?? 0,
      appActivatedEmployees: stats.appActivatedEmployees ?? 0,
      pendingSalaryRequests: stats.pendingSalaryRequests ?? 0,
      approvedRequests: stats.approvedRequests ?? 0,
      outstandingAmount: stats.outstandingAmount ?? 0
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
