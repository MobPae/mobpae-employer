import { DataTable } from "../ui/DataTable";
import { StatusBadge } from "../ui/StatusBadge";
import type { Repayment } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

export function RecoveryTable({ recoveries }: { recoveries: Repayment[] }) {
  return (
    <DataTable
      data={recoveries}
      columns={[
        { key: "employee", header: "Employee", render: (recovery) => <span className="font-semibold text-slate-950">{recovery.employeeName}</span> },
        { key: "request", header: "Salary Request", render: (recovery) => recovery.salaryRequestId },
        { key: "amount", header: "Recovery Amount", render: (recovery) => formatCurrency(recovery.amount) },
        { key: "due", header: "Due Date", render: (recovery) => formatDate(recovery.dueDate) },
        { key: "status", header: "Status", render: (recovery) => <StatusBadge status={recovery.status} /> }
      ]}
    />
  );
}
