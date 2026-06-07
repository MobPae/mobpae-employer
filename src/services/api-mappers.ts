import type {
  AuthUser,
  DashboardStats,
  Employee,
  EmployeePayload,
  EmployerProfile,
  EmploymentStatus,
  PayrollSummary,
  Repayment,
  RepaymentStatus,
  SalaryRequest,
  SalaryRequestStatus,
  UserRole
} from "../types";

type ApiRecord = Record<string, unknown>;

const asRecord = (value: unknown): ApiRecord => (value && typeof value === "object" ? (value as ApiRecord) : {});

export const unwrapList = <T = unknown>(value: unknown, keys: string[] = []): T[] => {
  if (Array.isArray(value)) return value as T[];

  const record = asRecord(value);
  for (const key of [...keys, "data", "items", "results", "records", "rows"]) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate as T[];
  }

  return [];
};

export const unwrapItem = <T = unknown>(value: unknown, keys: string[] = []): T => {
  const record = asRecord(value);
  for (const key of [...keys, "data", "item", "result", "record"]) {
    const candidate = record[key];
    if (candidate && typeof candidate === "object") return candidate as T;
  }

  return value as T;
};

const text = (value: unknown, fallback = "") => (typeof value === "string" && value ? value : fallback);
const numberValue = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const boolValue = (value: unknown, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "yes", "1", "activated", "active"].includes(value.toLowerCase());
  return fallback;
};

const normalizeEmploymentStatus = (value: unknown): EmploymentStatus =>
  ["INACTIVE", "DISABLED", "TERMINATED", "FALSE"].includes(String(value ?? "ACTIVE").toUpperCase()) ? "INACTIVE" : "ACTIVE";

const normalizeSalaryRequestStatus = (value: unknown): SalaryRequestStatus => {
  const normalized = String(value ?? "SUBMITTED").toUpperCase();
  const allowed: SalaryRequestStatus[] = ["PENDING", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "DISBURSED", "REPAID"];
  return allowed.includes(normalized as SalaryRequestStatus) ? (normalized as SalaryRequestStatus) : "SUBMITTED";
};

const normalizeRepaymentStatus = (value: unknown): RepaymentStatus => {
  const normalized = String(value ?? "PENDING").toUpperCase();
  const allowed: RepaymentStatus[] = ["PENDING", "PAID", "OVERDUE"];
  return allowed.includes(normalized as RepaymentStatus) ? (normalized as RepaymentStatus) : "PENDING";
};

const normalizeUserRole = (value: unknown): UserRole => {
  const normalized = String(value ?? "EMPLOYER").toUpperCase();
  if (normalized === "ADMIN") return "ADMIN";
  if (normalized === "EMPLOYEE") return "EMPLOYEE";
  return "EMPLOYER";
};

export const mapAuthUser = (value: unknown): AuthUser => {
  const record = asRecord(value);
  const employer = asRecord(record.employer ?? record.company);

  return {
    id: text(record.id ?? record.userId ?? record.sub, "current-user"),
    employerId: text(record.employerId ?? record.employer_id ?? employer.id ?? record.companyId, ""),
    name: text(record.name ?? record.fullName ?? record.email, "Employer User"),
    email: text(record.email, ""),
    role: normalizeUserRole(record.role),
    companyName: text(record.companyName ?? employer.companyName ?? employer.name, "MobPae Employer"),
    companyCode: text(record.companyCode ?? employer.companyCode ?? employer.code, "EMPLOYER")
  };
};

export const mapEmployee = (value: unknown): Employee => {
  const record = asRecord(value);

  return {
    id: text(record.id ?? record._id, ""),
    employeeCode: text(record.employeeCode ?? record.code, ""),
    name: text(record.name ?? record.fullName, `${text(record.firstName)} ${text(record.lastName)}`.trim()),
    email: text(record.email, ""),
    phone: text(record.phone ?? record.mobile, ""),
    salaryInHand: numberValue(record.salaryInHand ?? record.netSalary ?? record.salary),
    employmentStatus: normalizeEmploymentStatus(record.employmentStatus ?? record.employment_status ?? record.status ?? record.isActive),
    appActivated: boolValue(record.appActivated ?? record.isAppActivated ?? record.activationStatus),
    department: text(record.department, "General"),
    joinedAt: text(record.joinedAt ?? record.createdAt, new Date().toISOString())
  };
};

export const toEmployeeApiPayload = (payload: EmployeePayload) => ({
  employeeCode: payload.employeeCode,
  name: payload.name,
  email: payload.email,
  phone: payload.phone,
  salaryInHand: payload.salaryInHand,
  employmentStatus: payload.employmentStatus,
  appActivated: payload.appActivated,
  department: payload.department,
  joinedAt: payload.joinedAt
});

export const mapSalaryRequest = (value: unknown): SalaryRequest => {
  const record = asRecord(value);
  const employee = asRecord(record.employee);
  const requestedAmount = numberValue(record.requestedAmount ?? record.amount);
  const status = normalizeSalaryRequestStatus(record.status);
  const approvedAmount = numberValue(
    record.approvedAmount ?? record.approved_amount,
    ["APPROVED", "DISBURSED", "REPAID"].includes(status) ? requestedAmount : 0
  );

  return {
    id: text(record.id ?? record._id, ""),
    requestId: text(record.requestId ?? record.referenceId ?? record.id, ""),
    employeeId: text(record.employeeId ?? employee.id, ""),
    employeeName: text(record.employeeName ?? employee.name ?? employee.fullName, "Employee"),
    employeeCode: text(record.employeeCode ?? employee.employeeCode, ""),
    requestedAmount,
    approvedAmount,
    status,
    createdDate: text(record.createdDate ?? record.requestedAt ?? record.createdAt, new Date().toISOString()),
    purpose: text(record.purpose ?? record.reason, "Salary advance"),
    reviewerNote: text(record.reviewerNote ?? record.reviewNote)
  };
};

export const mapRepayment = (value: unknown): Repayment => {
  const record = asRecord(value);
  const request = asRecord(record.salaryRequest ?? record.request);
  const employee = asRecord(record.employee ?? request.employee);

  return {
    id: text(record.id ?? record._id, ""),
    employeeId: text(record.employeeId ?? employee.id, ""),
    employeeName: text(record.employeeName ?? employee.name ?? employee.fullName, "Employee"),
    salaryRequestId: text(record.salaryRequestId ?? request.requestId ?? request.id, ""),
    amount: numberValue(record.amount ?? record.recoveryAmount),
    dueDate: text(record.dueDate ?? record.createdAt, new Date().toISOString()),
    status: normalizeRepaymentStatus(record.status)
  };
};

export const mapEmployerProfile = (value: unknown): EmployerProfile => {
  const record = asRecord(value);
  const settings = asRecord(Array.isArray(value) ? value[0] : value);

  return {
    companyName: text(record.companyName ?? record.name ?? settings.companyName, ""),
    companyCode: text(record.companyCode ?? record.code ?? settings.companyCode, ""),
    payrollDate: text(record.payrollDate ?? settings.payrollDate, ""),
    payrollCutoffDate: text(record.payrollCutoffDate ?? settings.payrollCutoffDate, ""),
    contactPerson: text(record.contactPerson ?? record.hrName ?? settings.contactPerson, ""),
    email: text(record.email ?? settings.email, ""),
    phone: text(record.phone ?? settings.phone, "")
  };
};

export const mapDashboardStats = (value: unknown): Partial<DashboardStats> => {
  const record = asRecord(value);
  return {
    totalEmployees: numberValue(record.totalEmployees ?? record.employeeCount, NaN),
    activeEmployees: numberValue(record.activeEmployees, NaN),
    appActivatedEmployees: numberValue(record.appActivatedEmployees ?? record.activatedEmployees, NaN),
    pendingSalaryRequests: numberValue(record.pendingSalaryRequests ?? record.pendingRequests, NaN),
    approvedRequests: numberValue(record.approvedRequests, NaN),
    outstandingAmount: numberValue(record.outstandingAmount ?? record.totalOutstandingAmount, NaN)
  };
};

export const mapPayrollSummary = (value: unknown): PayrollSummary => {
  const record = asRecord(value);
  const payrollDate = record.payrollDate ?? record.payrollDay;
  const payrollCutoffDate = record.payrollCutoffDate ?? record.cutoffDate ?? record.cutoffDay;

  return {
    payrollDate: payrollDate === null || payrollDate === undefined || payrollDate === "" ? null : numberValue(payrollDate),
    payrollCutoffDate: payrollCutoffDate === null || payrollCutoffDate === undefined || payrollCutoffDate === "" ? null : numberValue(payrollCutoffDate),
    employeesDue: numberValue(record.employeesDue),
    pendingRecoveries: numberValue(record.pendingRecoveries),
    completedRecoveries: numberValue(record.completedRecoveries),
    totalRecoveryAmount: numberValue(record.totalRecoveryAmount ?? record.recoveryAmount)
  };
};
