import type { DashboardStats, LoanApplication, NotificationItem } from "../types";
import { mapDashboardStats, unwrapItem, unwrapList } from "./api-mappers";
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
    // GET /dashboard/employer — enhanced nested shape:
    // { employees, salaryRequests, recoveries, settlements, recentActivity }
    const { data } = await httpClient.get("/dashboard/employer");
    const raw = unwrapItem<Record<string, unknown>>(data, ["dashboard", "data"]);
    const stats = mapDashboardStats(raw);

    return {
      totalEmployees:        stats.totalEmployees        ?? 0,
      activeEmployees:       stats.activeEmployees       ?? 0,
      appActivatedEmployees: stats.appActivatedEmployees ?? 0,
      pendingLoanApplications: stats.pendingLoanApplications ?? 0,
      approvedRequests:      stats.approvedRequests      ?? 0,
      disbursedRequests:     stats.disbursedRequests     ?? 0,
      scheduledRecoveries:   stats.scheduledRecoveries   ?? 0,
      overdueRecoveries:     stats.overdueRecoveries     ?? 0,
      recoveryAmountDue:     stats.recoveryAmountDue     ?? 0,
      pendingSettlements:    stats.pendingSettlements    ?? 0,
      overdueSettlements:    stats.overdueSettlements    ?? 0,
      outstandingAmount:     stats.outstandingAmount     ?? 0,
      recentActivity:        stats.recentActivity        ?? [],
    };
  },

  async getRecentLoanApplications(): Promise<LoanApplication[]> {
    const stats = await this.getDashboardStats();
    return (stats.recentActivity ?? []).slice(0, 5);
  },

  async getRecentNotifications(): Promise<NotificationItem[]> {
    try {
      const { data } = await httpClient.get("/notifications/me");
      return unwrapList(data, ["notifications"]).map(mapNotification).slice(0, 5);
    } catch {
      return [];
    }
  }
};
