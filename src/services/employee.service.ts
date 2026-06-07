import { employees as employeeSeed } from "./mock-data";
import type { Employee, EmployeePayload } from "../types";

let employees: Employee[] = [...employeeSeed];

export const employeeService = {
  async getEmployees(): Promise<Employee[]> {
    return [...employees];
  },

  async getEmployeeById(id: string): Promise<Employee | undefined> {
    return employees.find((employee) => employee.id === id);
  },

  async createEmployee(payload: EmployeePayload): Promise<Employee> {
    const employee: Employee = {
      ...payload,
      id: `emp_${Date.now()}`,
      joinedAt: payload.joinedAt ?? new Date().toISOString().slice(0, 10)
    };

    employees = [employee, ...employees];
    return employee;
  },

  async updateEmployee(id: string, payload: Partial<EmployeePayload>): Promise<Employee> {
    let updatedEmployee: Employee | undefined;

    employees = employees.map((employee) => {
      if (employee.id !== id) {
        return employee;
      }

      updatedEmployee = { ...employee, ...payload };
      return updatedEmployee;
    });

    if (!updatedEmployee) {
      throw new Error("Employee not found");
    }

    return updatedEmployee;
  },

  async activateEmployee(id: string, appActivated = true): Promise<Employee> {
    return this.updateEmployee(id, { appActivated });
  },

  async bulkActivateEmployees(ids: string[]): Promise<Employee[]> {
    employees = employees.map((employee) =>
      ids.includes(employee.id) ? { ...employee, appActivated: true } : employee
    );

    return employees.filter((employee) => ids.includes(employee.id));
  }
};
