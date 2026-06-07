import type { Employee, EmployeePayload } from "../types";
import { mapEmployee, toEmployeeApiPayload, unwrapItem, unwrapList } from "./api-mappers";
import { httpClient } from "./http-client";

export const employeeService = {
  async getEmployees(): Promise<Employee[]> {
    const { data } = await httpClient.get("/employees");
    return unwrapList(data, ["employees"]).map(mapEmployee);
  },

  async getEmployeeById(id: string): Promise<Employee | undefined> {
    const { data } = await httpClient.get(`/employees/${id}`);
    return mapEmployee(unwrapItem(data, ["employee"]));
  },

  async createEmployee(payload: EmployeePayload): Promise<Employee> {
    const { data } = await httpClient.post("/employees", toEmployeeApiPayload(payload));
    return mapEmployee(unwrapItem(data, ["employee"]));
  },

  async bulkCreateEmployees(payloads: EmployeePayload[]): Promise<Employee[]> {
    const responses = await Promise.all(payloads.map((payload) => this.createEmployee(payload)));
    return responses;
  },

  async updateEmployee(id: string, payload: Partial<EmployeePayload>): Promise<Employee> {
    const { data } = await httpClient.patch(`/employees/${id}`, payload);
    return mapEmployee(unwrapItem(data, ["employee"]));
  },

  async activateEmployee(id: string, appActivated = true): Promise<Employee> {
    const { data } = await httpClient.patch(`/employees/${id}/activation`, {
      appActivated,
      isAppActivated: appActivated
    });
    return mapEmployee(unwrapItem(data, ["employee"]));
  },

  async bulkActivateEmployees(ids: string[]): Promise<Employee[]> {
    const { data } = await httpClient.patch("/employees/bulk-activation", {
      employeeIds: ids,
      ids,
      appActivated: true,
      isAppActivated: true
    });
    return unwrapList(data, ["employees"]).map(mapEmployee);
  }
};
