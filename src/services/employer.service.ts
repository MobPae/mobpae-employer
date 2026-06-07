import type { EmployerProfile } from "../types";
import { isForbidden } from "./api-errors";
import { mapEmployerProfile, unwrapItem, unwrapList } from "./api-mappers";
import { authService } from "./auth.service";
import { httpClient } from "./http-client";

const emptyProfile = {
  companyName: "",
  companyCode: "",
  payrollDate: "",
  payrollCutoffDate: "",
  contactPerson: "",
  email: "",
  phone: ""
};

export const employerService = {
  async getEmployerProfile(): Promise<EmployerProfile> {
    const currentUser = await authService.getCurrentUser();

    try {
      const { data } = await httpClient.get("/settings");
      const settings = unwrapList(data, ["settings"]);
      return mapEmployerProfile(settings.length ? settings[0] : unwrapItem(data, ["settings"]));
    } catch (error) {
      if (!isForbidden(error)) throw error;

      return {
        ...emptyProfile,
        companyName: currentUser?.companyName ?? "",
        companyCode: currentUser?.companyCode ?? "",
        contactPerson: currentUser?.name ?? "",
        email: currentUser?.email ?? ""
      };
    }
  },

  async updateEmployerProfile(payload: EmployerProfile): Promise<EmployerProfile> {
    const { data } = await httpClient.put("/settings", payload);
    return mapEmployerProfile(unwrapItem(data, ["settings"]));
  }
};
