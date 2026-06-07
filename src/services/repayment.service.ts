import type { Repayment } from "../types";
import { mapRepayment, unwrapItem, unwrapList } from "./api-mappers";
import { httpClient } from "./http-client";

export const repaymentService = {
  async getRepayments(): Promise<Repayment[]> {
    const { data } = await httpClient.get("/repayments");
    return unwrapList(data, ["repayments"]).map(mapRepayment);
  },

  async markPaid(id: string): Promise<Repayment> {
    const { data } = await httpClient.post(`/repayments/${id}/pay`);
    return mapRepayment(unwrapItem(data, ["repayment"]));
  }
};
