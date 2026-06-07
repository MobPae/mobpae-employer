import { CheckCircle2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { repaymentService } from "../../services/repayment.service";
import type { Repayment, RepaymentStatus } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

export function RepaymentsPage() {
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | RepaymentStatus>("ALL");
  const refresh = () => repaymentService.getRepayments().then(setRepayments);

  useEffect(() => {
    refresh();
  }, []);

  const filteredRepayments = useMemo(
    () =>
      repayments.filter((repayment) => {
        const searchable = `${repayment.employeeName} ${repayment.salaryRequestId}`.toLowerCase();
        return searchable.includes(query.toLowerCase()) && (status === "ALL" || repayment.status === status);
      }),
    [query, repayments, status]
  );

  return (
    <>
      <PageHeader eyebrow="Recovery ledger" title="Repayments" description="Track payroll-linked recovery amounts by employee, request and due date." />

      <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
          <Input icon={<Search size={16} />} placeholder="Search repayments" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as "ALL" | RepaymentStatus)}
            options={[
              { label: "All statuses", value: "ALL" },
              { label: "Pending", value: "PENDING" },
              { label: "Paid", value: "PAID" },
              { label: "Overdue", value: "OVERDUE" }
            ]}
          />
        </div>

        <div className="mt-4">
          <DataTable
            data={filteredRepayments}
            columns={[
              { key: "employee", header: "Employee", render: (repayment) => <span className="font-semibold text-blue-950">{repayment.employeeName}</span> },
              { key: "request", header: "Salary Request", render: (repayment) => repayment.salaryRequestId },
              { key: "amount", header: "Amount", render: (repayment) => formatCurrency(repayment.amount) },
              { key: "due", header: "Due Date", render: (repayment) => formatDate(repayment.dueDate) },
              { key: "status", header: "Status", render: (repayment) => <StatusBadge status={repayment.status} /> },
              {
                key: "actions",
                header: "Actions",
                render: (repayment) => (
                  <Button
                    variant="secondary"
                    icon={<CheckCircle2 size={15} />}
                    disabled={repayment.status === "PAID"}
                    onClick={async () => {
                      await repaymentService.markPaid(repayment.id);
                      refresh();
                    }}
                  >
                    Mark Paid
                  </Button>
                )
              }
            ]}
          />
        </div>
      </section>
    </>
  );
}
