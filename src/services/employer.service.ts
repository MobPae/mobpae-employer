import { employerProfile } from "./mock-data";
import type { EmployerProfile } from "../types";

let profile: EmployerProfile = { ...employerProfile };

export const employerService = {
  async getEmployerProfile(): Promise<EmployerProfile> {
    return { ...profile };
  },

  async updateEmployerProfile(payload: EmployerProfile): Promise<EmployerProfile> {
    profile = { ...payload };
    return { ...profile };
  }
};
