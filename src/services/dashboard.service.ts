import { employeeService } from "./employee.service";
import { notifications } from "./mock-data";
import { salaryRequestService } from "./salary-request.service";
import type { DashboardStats, NotificationItem, SalaryRequest } from "../types";

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const [employees, salaryRequests] = await Promise.all([
      employeeService.getEmployees(),
      salaryRequestService.getSalaryRequests()
    ]);

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
    const salaryRequests = await salaryRequestService.getSalaryRequests();
    return salaryRequests
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 5);
  },

  async getRecentNotifications(): Promise<NotificationItem[]> {
    return [...notifications];
  }
};
