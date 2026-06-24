import type {
  AuthUser,
  DashboardStats,
  Employee,
  EmployeePayload,
  EmployerProfile,
  EmployerSettlement,
  EmploymentStatus,
  PayrollSummary,
  Repayment,
  RepaymentStatus,
  BulkEmployeeUploadError,
  BulkEmployeeUploadResult,
  SalaryRequest,
  SalaryRequestStatus,
  SettlementStatus,
  SettlementSummary,
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
const optionalNumberValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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
  const allowed: SalaryRequestStatus[] = ["PENDING", "SUBMITTED", "UNDER_REVIEW", "EMPLOYER_APPROVED", "EMPLOYER_REJECTED", "APPROVED", "REJECTED", "READY_FOR_DISBURSAL", "DISBURSED", "REPAYMENT_SCHEDULED", "REPAID"];
  return allowed.includes(normalized as SalaryRequestStatus) ? (normalized as SalaryRequestStatus) : "SUBMITTED";
};

const normalizeRepaymentStatus = (value: unknown): RepaymentStatus => {
  const normalized = String(value ?? "SCHEDULED").toUpperCase();
  const allowed: RepaymentStatus[] = ["SCHEDULED", "PENDING", "PAID", "OVERDUE"];
  return allowed.includes(normalized as RepaymentStatus) ? (normalized as RepaymentStatus) : "SCHEDULED";
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
  const employer = asRecord(record.employer ?? record.company);

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
    joinedAt: text(record.joinedAt ?? record.createdAt, new Date().toISOString()),
    employerId: text(record.employerId ?? record.employer_id ?? employer.id ?? record.companyId) || undefined,
    kycStatus: (record.kycStatus as Employee["kycStatus"]) ?? undefined,
    bankAccountStatus: (record.bankAccountStatus as Employee["bankAccountStatus"]) ?? undefined,
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

export const mapBulkEmployeeUploadError = (value: unknown): BulkEmployeeUploadError => {
  const record = asRecord(value);

  return {
    row: numberValue(record.row ?? record.rowNumber),
    employeeCode: text(record.employeeCode),
    email: text(record.email),
    message: text(record.message ?? record.error, "Unable to import row")
  };
};

export const mapBulkEmployeeUploadResult = (value: unknown): BulkEmployeeUploadResult => {
  const record = asRecord(value);

  return {
    successCount: numberValue(record.successCount),
    failureCount: numberValue(record.failureCount),
    created: unwrapList(record.created).map(mapEmployee),
    errors: unwrapList(record.errors).map(mapBulkEmployeeUploadError)
  };
};

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
  const employee = asRecord(record.employeeDetails ?? record.employee ?? request.employee);
  const principalAmount = numberValue(record.principalAmount ?? record.amount ?? record.recoveryAmount);
  const interestAmount = numberValue(record.interestAmount);
  const totalAmount = numberValue(record.totalAmount, principalAmount + interestAmount);

  return {
    id: text(record.id ?? record._id, ""),
    employeeId: text(record.employeeId ?? employee.id, ""),
    employeeName: text(record.employeeName ?? employee.name ?? employee.fullName, "Employee"),
    salaryRequestId: text(record.salaryRequestId ?? record.salaryRequestCode ?? request.requestId ?? request.id, ""),
    amount: totalAmount,
    principalAmount,
    interestAmount,
    totalAmount,
    interestRate: optionalNumberValue(record.interestRate),
    interestDays: optionalNumberValue(record.interestDays),
    dueDate: text(record.dueDate ?? record.createdAt, new Date().toISOString()),
    status: normalizeRepaymentStatus(record.status)
  };
};

export const mapEmployerProfile = (value: unknown): EmployerProfile => {
  const record = asRecord(value);
  const user = asRecord(record.user);
  const companyEmail = text(record.contactEmail ?? record.companyEmail ?? record.email, "");

  return {
    companyName: text(record.companyName ?? record.name, ""),
    companyCode: text(record.companyCode ?? record.code, ""),
    contactPerson: text(record.contactPerson ?? record.hrName, ""),
    companyEmail,
    loginEmail: text(record.loginEmail ?? user.email, companyEmail),
    payrollDate: record.payrollDate === null || record.payrollDate === undefined || record.payrollDate === "" ? null : numberValue(record.payrollDate),
    payrollCutoffDate: record.payrollCutoffDate === null || record.payrollCutoffDate === undefined || record.payrollCutoffDate === "" ? null : numberValue(record.payrollCutoffDate),
    phone: text(record.phone, ""),
    status: text(record.status)
  };
};

// Maps GET /dashboard/employer nested response shape:
// { employees: {total, active, appActivated},
//   salaryRequests: {pending, approved, disbursed},
//   recoveries: {scheduled, overdue, amountDue},
//   settlements: {pending, overdue, outstandingAmount},
//   recentActivity: [...] }
// Also handles flat/legacy shapes for backwards-compat.
export const mapDashboardStats = (value: unknown): Partial<DashboardStats> => {
  const record     = asRecord(value);
  const employees  = asRecord(record.employees);
  const salaryReqs = asRecord(record.salaryRequests);
  const recoveries = asRecord(record.recoveries);
  const settlements = asRecord(record.settlements);

  // recentActivity takes priority; fall back to recentSalaryRequests for older responses
  const activityRaw = Array.isArray(record.recentActivity)
    ? record.recentActivity
    : Array.isArray(record.recentSalaryRequests)
      ? record.recentSalaryRequests
      : [];

  return {
    totalEmployees:        numberValue(employees.total        ?? record.totalEmployees    ?? record.employeeCount),
    activeEmployees:       numberValue(employees.active       ?? record.activeEmployees),
    appActivatedEmployees: numberValue(employees.appActivated ?? record.appActivatedEmployees ?? record.activatedEmployees),

    pendingSalaryRequests: numberValue(salaryReqs.pending  ?? record.pendingSalaryRequests ?? record.pendingRequests),
    approvedRequests:      numberValue(salaryReqs.approved ?? record.approvedRequests),
    disbursedRequests:     numberValue(salaryReqs.disbursed ?? record.disbursedRequests ?? 0),

    scheduledRecoveries:   numberValue(recoveries.scheduled ?? record.scheduledRecoveries ?? 0),
    overdueRecoveries:     numberValue(recoveries.overdue   ?? record.overdueRecoveries   ?? 0),
    recoveryAmountDue:     numberValue(recoveries.amountDue ?? record.recoveryAmountDue   ?? 0),

    pendingSettlements:    numberValue(settlements.pending           ?? record.pendingSettlements  ?? 0),
    overdueSettlements:    numberValue(settlements.overdue           ?? record.overdueSettlements  ?? 0),
    outstandingAmount:     numberValue(settlements.outstandingAmount ?? record.outstandingAmount   ?? record.totalOutstandingAmount),

    recentActivity: (activityRaw as unknown[]).map(mapSalaryRequest),
  };
};

const normalizeSettlementStatus = (value: unknown): SettlementStatus => {
  const s = String(value ?? "PENDING").toUpperCase();
  const allowed: SettlementStatus[] = ["NO_DUES", "PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE"];
  return allowed.includes(s as SettlementStatus) ? (s as SettlementStatus) : "PENDING";
};

// Parse amount that may arrive as string or number from backend
const amountValue = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const mapSettlement = (value: unknown): EmployerSettlement => {
  const r = asRecord(value);
  return {
    id:                text(r.id ?? r._id, ""),
    employerId:        text(r.employerId, ""),
    payrollMonth:      text(r.payrollMonth ?? r.month ?? r.period, ""),
    principalAmount:   amountValue(r.principalAmount),
    interestAmount:    amountValue(r.interestAmount),
    lateFeeAmount:     amountValue(r.lateFeeAmount ?? r.lateFee ?? r.penaltyAmount),
    totalAmount:       amountValue(r.totalAmount),
    outstandingAmount: amountValue(r.outstandingAmount ?? r.amountDue),
    dueDate:           text(r.dueDate, new Date().toISOString()),
    gracePeriodEnd:    typeof r.gracePeriodEnd === "string" ? r.gracePeriodEnd : null,
    paidDate:          typeof r.paidDate === "string" ? r.paidDate : null,
    status:            normalizeSettlementStatus(r.status),
    referenceNumber:   typeof r.referenceNumber === "string" ? r.referenceNumber : null,
    notes:             typeof r.notes === "string" ? r.notes : null,
    createdAt:         text(r.createdAt, new Date().toISOString()),
    updatedAt:         text(r.updatedAt, new Date().toISOString()),
  };
};

export const mapSettlementSummary = (value: unknown): SettlementSummary => {
  const r = asRecord(value);
  const pendingSettlements = numberValue(r.pendingSettlements ?? r.pendingCount ?? r.pending);
  const paidSettlements    = numberValue(r.paidSettlements    ?? r.paidCount    ?? r.paid);
  return {
    outstandingAmount:             amountValue(r.outstandingAmount ?? r.totalOutstandingAmount),
    overdueAmount:                 amountValue(r.overdueAmount),
    totalAmount:                   amountValue(r.totalAmount),
    pendingCount:                  pendingSettlements,
    pendingSettlements,
    overdueCount:                  numberValue(r.overdueCount ?? r.overdue),
    paidCount:                     paidSettlements,
    paidSettlements,
    partiallyPaidCount:            numberValue(r.partiallyPaidCount ?? r.partiallyPaid),
    totalSettlements:              numberValue(r.totalSettlements ?? r.total),
    nextDueDate:                   typeof r.nextDueDate === "string" ? r.nextDueDate : null,
    gracePeriodDays:               numberValue(r.gracePeriodDays),
    daysRemaining:                 numberValue(r.daysRemaining),
    lateFeePercentage:             numberValue(r.lateFeePercentage),
    estimatedLateFeeAmount:        amountValue(r.estimatedLateFeeAmount),
    amountPayableAfterGracePeriod: amountValue(r.amountPayableAfterGracePeriod),
    riskStatus:                    typeof r.riskStatus === "string" ? r.riskStatus : "GOOD",
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
