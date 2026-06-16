export type EmploymentStatus = "ACTIVE" | "INACTIVE";

export type SalaryRequestStatus =
  | "PENDING"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DISBURSED"
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
  companyName: string;
  contactPerson: string;
  companyEmail: string;
  phone: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  appActivatedEmployees: number;
  pendingSalaryRequests: number;
  approvedRequests: number;
  outstandingAmount: number;
  recentSalaryRequests?: SalaryRequest[];
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  type: "REQUEST" | "PAYROLL" | "EMPLOYEE" | "RISK";
}

// ── Settlements ───────────────────────────────────────────────────────────────

export type SettlementStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";

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
