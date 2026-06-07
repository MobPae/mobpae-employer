import type { Repayment } from "../types";
import { isForbidden } from "./api-errors";
import { mapRepayment, unwrapItem, unwrapList } from "./api-mappers";
import { authService } from "./auth.service";
import { httpClient } from "./http-client";

export const repaymentService = {
  async getRepayments(): Promise<Repayment[]> {
    const currentUser = await authService.getCurrentUser();
    if (currentUser?.role === "EMPLOYER") {
      return [];
    }

    try {
      const { data } = await httpClient.get("/repayments");
      return unwrapList(data, ["repayments"]).map(mapRepayment);
    } catch (error) {
      if (isForbidden(error)) return [];
      throw error;
    }
  },

  async markPaid(id: string): Promise<Repayment> {
    const { data } = await httpClient.post(`/repayments/${id}/pay`);
    return mapRepayment(unwrapItem(data, ["repayment"]));
  }
};
