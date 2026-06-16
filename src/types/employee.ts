export interface Employee {
  id: string;

  employeeCode: string;

  name: string;

  email: string;

  phone: string;

  salaryInHand: string;

  employmentStatus: "ACTIVE" | "INACTIVE";

  appActivated: boolean;

  createdAt: string;
}
