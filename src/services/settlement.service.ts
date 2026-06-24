import type { EmployerSettlement, SettlementSummary } from "../types";
import { mapSettlement, mapSettlementSummary, unwrapItem, unwrapList } from "./api-mappers";
import { httpClient } from "./http-client";

export const settlementService = {
  async getSettlements(): Promise<EmployerSettlement[]> {
    const { data } = await httpClient.get("/employer-settlements/employer");
    return unwrapList(data, ["settlements", "employerSettlements"]).map(mapSettlement);
  },

  async getSettlementSummary(): Promise<SettlementSummary> {
    const { data } = await httpClient.get("/employer-settlements/employer/summary");
    return mapSettlementSummary(unwrapItem(data, ["summary", "settlementSummary"]));
  },

  async getSettlementById(id: string): Promise<EmployerSettlement> {
    const { data } = await httpClient.get(`/employer-settlements/${id}`);
    return mapSettlement(unwrapItem(data, ["settlement", "employerSettlement"]));
  },

  async sendReport(id: string): Promise<void> {
    await httpClient.post(`/employer-settlements/${id}/send-report`);
  },
};
