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
    const { data } = await httpClient.get("/dashboard/employers");
    const dashboard = unwrapItem<Record<string, unknown>>(data, ["dashboard"]);
    const rawStats = unwrapItem<Record<string, unknown>>(dashboard, ["stats"]);
    const stats = mapDashboardStats({
      ...dashboard,
      ...rawStats,
      recentSalaryRequests: dashboard.recentSalaryRequests ?? rawStats.recentSalaryRequests
    });

    return {
      totalEmployees: stats.totalEmployees ?? 0,
      activeEmployees: stats.activeEmployees ?? 0,
      appActivatedEmployees: stats.appActivatedEmployees ?? 0,
      pendingSalaryRequests: stats.pendingSalaryRequests ?? 0,
      approvedRequests: stats.approvedRequests ?? 0,
      outstandingAmount: stats.outstandingAmount ?? 0,
      recentSalaryRequests: stats.recentSalaryRequests ?? []
    };
  },

  async getRecentSalaryRequests(): Promise<SalaryRequest[]> {
    const stats = await this.getDashboardStats();
    return (stats.recentSalaryRequests ?? []).slice(0, 5);
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
