import type { EmployerProfile } from "../types";
import { mapEmployerProfile, unwrapItem, unwrapList } from "./api-mappers";
import { authService } from "./auth.service";
import { httpClient } from "./http-client";

export const employerService = {
  async getEmployerProfile(): Promise<EmployerProfile> {
    const currentUser = await authService.getCurrentUser();

    if (currentUser?.employerId) {
      const { data } = await httpClient.get(`/employers/${currentUser.employerId}`);
      return mapEmployerProfile(unwrapItem(data, ["employer"]));
    }

    const { data } = await httpClient.get("/settings");
    const settings = unwrapList(data, ["settings"]);
    return mapEmployerProfile(settings.length ? settings[0] : unwrapItem(data, ["settings"]));
  },

  async updateEmployerProfile(payload: EmployerProfile): Promise<EmployerProfile> {
    const { data } = await httpClient.put("/settings", payload);
    return mapEmployerProfile(unwrapItem(data, ["settings"]));
  }
};
