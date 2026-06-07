import { repayments as repaymentSeed } from "./mock-data";
import type { Repayment } from "../types";

let repayments: Repayment[] = [...repaymentSeed];

export const repaymentService = {
  async getRepayments(): Promise<Repayment[]> {
    return [...repayments];
  },

  async markPaid(id: string): Promise<Repayment> {
    let updatedRepayment: Repayment | undefined;

    repayments = repayments.map((repayment) => {
      if (repayment.id !== id) {
        return repayment;
      }

      updatedRepayment = { ...repayment, status: "PAID" };
      return updatedRepayment;
    });

    if (!updatedRepayment) {
      throw new Error("Repayment not found");
    }

    return updatedRepayment;
  }
};
