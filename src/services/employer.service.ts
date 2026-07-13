import type { EmployerProfile, EmployerProfilePayload } from "../types";
import { isNotFound } from "./api-errors";
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
  contactPerson: payload.contactPerson,
  email: payload.companyEmail,
  phone: payload.phone
});

export interface EmployerProductConfig {
  id: string;
  productId: string;
  maximumAdvanceAmountOverride: number | null;
  maximumAdvancePercentageOverride: number | null;
  requiresEmployerApproval: boolean;
  isEnabled: boolean;
  product: { productType: string; name: string };
}

/** Only the advance-limit fields the employer is allowed to see */
export interface ProductAdvanceRules {
  defaultAdvancePercentage: number;   // e.g. 10 (platform default %)
  hardCeilingPercentage: number;      // e.g. 50 (absolute max %)
  platformMaxAdvanceAmount: number;   // e.g. 5000 (₹ cap for interest-free tier)
}

export const employerService = {
  async getEmployerProfile(): Promise<EmployerProfile> {
    const currentUser = await authService.getCurrentUser();

    try {
      const { data } = await httpClient.get("/employers/profile");
      return mapEmployerProfile(unwrapItem(data, ["profile", "employer"]));
    } catch (err) {
      // Only fall back to auth user data on 404 — auth/server errors should surface
      if (!isNotFound(err)) throw err;
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
  },

  /** Get the employer's own product configs (SA advance limit override, etc.) */
  async getMyProductConfigs(): Promise<EmployerProductConfig[]> {
    const { data } = await httpClient.get("/employers/my/product-configs");
    return Array.isArray(data) ? data : data?.data ?? [];
  },

  /** Set the employer's advance percentage override (or null to clear) */
  async setAdvanceOverride(productType: string, maximumAdvancePercentageOverride: number | null): Promise<EmployerProductConfig> {
    const { data } = await httpClient.put(
      `/employers/my/product-configs/${productType}`,
      { maximumAdvancePercentageOverride }
    );
    return data;
  },

  /** Get the advance limit rules the employer is allowed to see */
  async getProductAdvanceRules(productType: string): Promise<ProductAdvanceRules> {
    const { data } = await httpClient.get(`/employers/my/product-configs/${productType}/rules`);
    return data;
  },
};
