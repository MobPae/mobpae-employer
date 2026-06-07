export type EmploymentStatus = "ACTIVE" | "INACTIVE";

export type SalaryRequestStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DISBURSED"
  | "REPAID";

export type RepaymentStatus = "PENDING" | "PAID" | "OVERDUE";

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
}

export type EmployeePayload = Omit<Employee, "id" | "joinedAt"> & {
  joinedAt?: string;
};

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
  dueDate: string;
  status: RepaymentStatus;
}

export interface PayrollSummary {
  payrollDate: string;
  payrollCutoffDate: string;
  employeesDue: number;
  totalRecoveryAmount: number;
}

export interface EmployerProfile {
  companyName: string;
  companyCode: string;
  payrollDate: string;
  payrollCutoffDate: string;
  contactPerson: string;
  email: string;
  phone: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  appActivatedEmployees: number;
  pendingSalaryRequests: number;
  approvedRequests: number;
  outstandingAmount: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  type: "REQUEST" | "PAYROLL" | "EMPLOYEE" | "RISK";
}
