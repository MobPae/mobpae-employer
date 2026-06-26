export type EmploymentStatus = "ACTIVE" | "INACTIVE";

export type SalaryRequestStatus =
  | "PENDING"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "EMPLOYER_APPROVED"
  | "EMPLOYER_REJECTED"
  | "APPROVED"
  | "REJECTED"
  | "READY_FOR_DISBURSAL"
  | "DISBURSED"
  | "REPAYMENT_SCHEDULED"
  | "REPAID";

export type RepaymentStatus = "SCHEDULED" | "PENDING" | "PAID" | "OVERDUE";

export type UserRole = "ADMIN" | "EMPLOYER" | "EMPLOYEE";

export interface AuthUser {
  id: string;
  employerId?: string;
  name: string;
  email: string;
  role: UserRole;
  companyName: string;
  companyCode: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  passwordChanged?: boolean;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  salaryInHand: number;
  employmentStatus: EmploymentStatus;
  appActivated: boolean;
  department: string;
  joinedAt: string;
  employerId?: string;
  kycStatus?: "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "REJECTED";
  bankAccountStatus?: "NOT_ADDED" | "PENDING" | "VERIFIED";
}

export type EmployeePayload = Omit<Employee, "id" | "joinedAt"> & {
  joinedAt?: string;
};

export interface BulkEmployeeUploadError {
  row: number;
  employeeCode: string;
  email: string;
  message: string;
}

export interface BulkEmployeeUploadResult {
  successCount: number;
  failureCount: number;
  created: Employee[];
  errors: BulkEmployeeUploadError[];
}

export interface SalaryRequest {
  id: string;
  requestId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  requestedAmount: number;
  approvedAmount: number;
  status: SalaryRequestStatus;
  createdDate: string;
  purpose: string;
  reviewerNote?: string;
}

export interface Repayment {
  id: string;
  employeeId: string;
  employeeName: string;
  salaryRequestId: string;
  settlementId?: string | null;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  interestRate?: number;
  interestDays?: number;
  dueDate: string;
  status: RepaymentStatus;
}

export interface PayrollSummary {
  payrollDate: number | null;
  payrollCutoffDate: number | null;
  employeesDue: number;
  pendingRecoveries: number;
  completedRecoveries: number;
  totalRecoveryAmount: number;
}

export interface PayrollSettingsPayload {
  payrollDate: number;
  payrollCutoffDate: number;
}

export interface EmployerProfile {
  companyName: string;
  companyCode: string;
  contactPerson: string;
  companyEmail: string;
  loginEmail: string;
  payrollDate?: number | null;
  payrollCutoffDate?: number | null;
  phone: string;
  status?: string;
}

export interface EmployerProfilePayload {
  companyName?: string;
  contactPerson: string;
  companyEmail: string;
  phone: string;
}

// Matches GET /dashboard/employer response shape
export interface DashboardStats {
  // employees
  totalEmployees: number;
  activeEmployees: number;
  appActivatedEmployees: number;
  // salaryRequests
  pendingSalaryRequests: number;
  approvedRequests: number;
  disbursedRequests: number;
  // recoveries
  scheduledRecoveries: number;
  overdueRecoveries: number;
  recoveryAmountDue: number;
  // settlements
  pendingSettlements: number;
  overdueSettlements: number;
  outstandingAmount: number;
  // recent activity feed
  recentActivity: SalaryRequest[];
}

export interface DashboardTrend {
  month: string;           // "2026-01"
  requestCount: number;
  approvedCount: number;
  disbursedCount: number;
  requestedAmount: number;
  disbursedAmount: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  type: "REQUEST" | "PAYROLL" | "EMPLOYEE" | "RISK";
}

// ── Settlements ───────────────────────────────────────────────────────────────

export type SettlementStatus = "NO_DUES" | "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";

export interface EmployerSettlement {
  id: string;
  employerId: string;
  payrollMonth: string;       // "2024-01" or human-readable
  principalAmount: number;
  interestAmount: number;
  lateFeeAmount: number;
  totalAmount: number;
  outstandingAmount: number;
  dueDate: string;
  gracePeriodEnd: string | null;
  paidDate: string | null;
  status: SettlementStatus;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SettlementSummary {
  outstandingAmount: number;
  overdueAmount: number;
  totalAmount: number;
  pendingCount: number;
  pendingSettlements: number;
  overdueCount: number;
  paidCount: number;
  paidSettlements: number;
  partiallyPaidCount: number;
  totalSettlements: number;
  nextDueDate: string | null;
  gracePeriodDays: number;
  daysRemaining: number;
  lateFeePercentage: number;
  estimatedLateFeeAmount: number;
  amountPayableAfterGracePeriod: number;
  riskStatus: string;
}
