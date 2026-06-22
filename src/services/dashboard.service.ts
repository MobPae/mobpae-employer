import type { DashboardStats, DashboardTrend, NotificationItem, SalaryRequest } from "../types";
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
      pendingSalaryRequests: stats.pendingSalaryRequests ?? 0,
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

  async getRecentSalaryRequests(): Promise<SalaryRequest[]> {
    const stats = await this.getDashboardStats();
    return (stats.recentActivity ?? []).slice(0, 5);
  },

  async getDashboardTrends(): Promise<DashboardTrend[]> {
    try {
      const { data } = await httpClient.get("/dashboard/employer/trends", { params: { period: "monthly" } });
      const raw = unwrapList<Record<string, unknown>>(data, ["trends"]);
      return raw.map(r => ({
        month:           String(r.month ?? r.period ?? r.date ?? ""),
        requestCount:    Number(r.requestCount    ?? 0),
        approvedCount:   Number(r.approvedCount   ?? 0),
        disbursedCount:  Number(r.disbursedCount  ?? 0),
        requestedAmount: Number(r.requestedAmount ?? 0),
        disbursedAmount: Number(r.disbursedAmount ?? 0),
      }));
    } catch {
      return [];
    }
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
