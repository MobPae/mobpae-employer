import type {
  Employee,
  EmployerProfile,
  NotificationItem,
  PayrollSummary,
  Repayment,
  SalaryRequest
} from "../types";

export const employerProfile: EmployerProfile = {
  companyName: "Nimbus Retail Pvt Ltd",
  companyCode: "NRPL-4821",
  payrollDate: "2026-06-30",
  payrollCutoffDate: "2026-06-25",
  contactPerson: "Ananya Mehra",
  email: "hr@nimbusretail.com",
  phone: "+91 98765 43210"
};

export const employees: Employee[] = [
  {
    id: "emp_001",
    employeeCode: "NR-1001",
    name: "Aarav Sharma",
    email: "aarav.sharma@nimbusretail.com",
    phone: "+91 98111 00234",
    salaryInHand: 52000,
    employmentStatus: "ACTIVE",
    appActivated: true,
    department: "Store Operations",
    joinedAt: "2024-04-12"
  },
  {
    id: "emp_002",
    employeeCode: "NR-1002",
    name: "Priya Nair",
    email: "priya.nair@nimbusretail.com",
    phone: "+91 98222 10345",
    salaryInHand: 61000,
    employmentStatus: "ACTIVE",
    appActivated: true,
    department: "Finance",
    joinedAt: "2023-11-05"
  },
  {
    id: "emp_003",
    employeeCode: "NR-1003",
    name: "Kabir Sethi",
    email: "kabir.sethi@nimbusretail.com",
    phone: "+91 98333 20456",
    salaryInHand: 47000,
    employmentStatus: "ACTIVE",
    appActivated: false,
    department: "Logistics",
    joinedAt: "2025-02-21"
  },
  {
    id: "emp_004",
    employeeCode: "NR-1004",
    name: "Meera Rao",
    email: "meera.rao@nimbusretail.com",
    phone: "+91 98444 30567",
    salaryInHand: 73000,
    employmentStatus: "ACTIVE",
    appActivated: true,
    department: "People Ops",
    joinedAt: "2022-08-15"
  },
  {
    id: "emp_005",
    employeeCode: "NR-1005",
    name: "Vikram Joshi",
    email: "vikram.joshi@nimbusretail.com",
    phone: "+91 98555 40678",
    salaryInHand: 39000,
    employmentStatus: "INACTIVE",
    appActivated: false,
    department: "Warehouse",
    joinedAt: "2024-12-02"
  },
  {
    id: "emp_006",
    employeeCode: "NR-1006",
    name: "Isha Banerjee",
    email: "isha.banerjee@nimbusretail.com",
    phone: "+91 98666 50789",
    salaryInHand: 68000,
    employmentStatus: "ACTIVE",
    appActivated: false,
    department: "Merchandising",
    joinedAt: "2023-06-19"
  }
];

export const salaryRequests: SalaryRequest[] = [
  {
    id: "sr_001",
    requestId: "REQ-24061",
    employeeId: "emp_001",
    employeeName: "Aarav Sharma",
    employeeCode: "NR-1001",
    requestedAmount: 12000,
    approvedAmount: 12000,
    status: "DISBURSED",
    createdDate: "2026-06-05",
    purpose: "Medical expense"
  },
  {
    id: "sr_002",
    requestId: "REQ-24062",
    employeeId: "emp_003",
    employeeName: "Kabir Sethi",
    employeeCode: "NR-1003",
    requestedAmount: 9000,
    approvedAmount: 0,
    status: "SUBMITTED",
    createdDate: "2026-06-06",
    purpose: "School fees"
  },
  {
    id: "sr_003",
    requestId: "REQ-24063",
    employeeId: "emp_002",
    employeeName: "Priya Nair",
    employeeCode: "NR-1002",
    requestedAmount: 18000,
    approvedAmount: 15000,
    status: "APPROVED",
    createdDate: "2026-06-04",
    purpose: "Home repair"
  },
  {
    id: "sr_004",
    requestId: "REQ-24064",
    employeeId: "emp_006",
    employeeName: "Isha Banerjee",
    employeeCode: "NR-1006",
    requestedAmount: 14000,
    approvedAmount: 0,
    status: "UNDER_REVIEW",
    createdDate: "2026-06-03",
    purpose: "Travel"
  },
  {
    id: "sr_005",
    requestId: "REQ-24065",
    employeeId: "emp_004",
    employeeName: "Meera Rao",
    employeeCode: "NR-1004",
    requestedAmount: 21000,
    approvedAmount: 21000,
    status: "REPAID",
    createdDate: "2026-05-29",
    purpose: "Family support"
  }
];

export const repayments: Repayment[] = [
  {
    id: "rp_001",
    employeeId: "emp_001",
    employeeName: "Aarav Sharma",
    salaryRequestId: "REQ-24061",
    amount: 12000,
    dueDate: "2026-06-30",
    status: "PENDING"
  },
  {
    id: "rp_002",
    employeeId: "emp_002",
    employeeName: "Priya Nair",
    salaryRequestId: "REQ-24063",
    amount: 15000,
    dueDate: "2026-06-30",
    status: "PENDING"
  },
  {
    id: "rp_003",
    employeeId: "emp_004",
    employeeName: "Meera Rao",
    salaryRequestId: "REQ-24065",
    amount: 21000,
    dueDate: "2026-05-31",
    status: "PAID"
  },
  {
    id: "rp_004",
    employeeId: "emp_006",
    employeeName: "Isha Banerjee",
    salaryRequestId: "REQ-23991",
    amount: 6200,
    dueDate: "2026-05-31",
    status: "OVERDUE"
  }
];

export const payrollSummary: PayrollSummary = {
  payrollDate: 30,
  payrollCutoffDate: 25,
  employeesDue: 3,
  pendingRecoveries: 3,
  completedRecoveries: 1,
  totalRecoveryAmount: 33200
};

export const notifications: NotificationItem[] = [
  {
    id: "note_001",
    title: "Request needs HR review",
    description: "Kabir Sethi submitted REQ-24062 for INR 9,000.",
    createdAt: "2026-06-06T10:20:00.000Z",
    type: "REQUEST"
  },
  {
    id: "note_002",
    title: "Payroll cutoff approaching",
    description: "Recovery file locks on 25 Jun 2026.",
    createdAt: "2026-06-05T14:45:00.000Z",
    type: "PAYROLL"
  },
  {
    id: "note_003",
    title: "Activation coverage below target",
    description: "2 active employees still need app access activated.",
    createdAt: "2026-06-04T08:15:00.000Z",
    type: "EMPLOYEE"
  }
];
