import type { EmployerProfile, EmployerProfilePayload } from "../types";
import { mapEmployerProfile, unwrapItem } from "./api-mappers";
import { authService } from "./auth.service";
import { httpClient } from "./http-client";

const emptyProfile = {
  companyName: "",
  companyCode: "",
  contactPerson: "",
  companyEmail: "",
  loginEmail: "",
  phone: "",
  status: ""
};

const toEmployerProfileApiPayload = (payload: EmployerProfilePayload) => ({
  companyName: payload.companyName,
  contactPerson: payload.contactPerson,
  email: payload.companyEmail,
  phone: payload.phone
});

export const employerService = {
  async getEmployerProfile(): Promise<EmployerProfile> {
    const currentUser = await authService.getCurrentUser();

    try {
      const { data } = await httpClient.get("/employers/profile");
      return mapEmployerProfile(unwrapItem(data, ["profile", "employer"]));
    } catch {
      if (!currentUser) throw new Error("Unable to load employer profile");

      return {
        ...emptyProfile,
        companyName: currentUser?.companyName ?? "",
        companyCode: currentUser?.companyCode ?? "",
        contactPerson: currentUser?.name ?? "",
        companyEmail: currentUser?.email ?? "",
        loginEmail: currentUser?.email ?? ""
      };
    }
  },

  async updateEmployerProfile(payload: EmployerProfilePayload): Promise<EmployerProfile> {
    const { data } = await httpClient.put("/employers/profile", toEmployerProfileApiPayload(payload));
    return mapEmployerProfile(unwrapItem(data, ["profile", "employer"]));
  }
};
