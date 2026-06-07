import { Edit, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "../ui/Button";
import { DataTable } from "../ui/DataTable";
import { StatusBadge } from "../ui/StatusBadge";
import type { Employee } from "../../types";
import { formatCurrency } from "../../utils/formatters";

export function EmployeeTable({
  employees,
  selectedIds,
  onSelect,
  onSelectAll,
  onEdit,
  onToggleAccess
}: {
  employees: Employee[];
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (employee: Employee) => void;
  onToggleAccess: (employee: Employee) => void;
}) {
  return (
    <DataTable
      data={employees}
      columns={[
        {
          key: "select",
          header: (
            <input
              type="checkbox"
              className="h-4 w-4 accent-slate-950"
              checked={employees.length > 0 && selectedIds.length === employees.length}
              onChange={(event) => onSelectAll(event.target.checked)}
              aria-label="Select all employees"
            />
          ),
          render: (employee) => (
            <input
              type="checkbox"
              className="h-4 w-4 accent-slate-950"
              checked={selectedIds.includes(employee.id)}
              onChange={(event) => onSelect(employee.id, event.target.checked)}
            />
          )
        },
        {
          key: "employee",
          header: "Employee",
          render: (employee) => (
            <div>
              <p className="font-semibold text-blue-950">{employee.name}</p>
              <p className="text-xs text-slate-500">{employee.employeeCode} · {employee.department}</p>
            </div>
          )
        },
        { key: "email", header: "Email", render: (employee) => employee.email },
        { key: "phone", header: "Phone", render: (employee) => employee.phone },
        { key: "salary", header: "Salary", render: (employee) => formatCurrency(employee.salaryInHand) },
        { key: "status", header: "Status", render: (employee) => <StatusBadge status={employee.employmentStatus} /> },
        {
          key: "access",
          header: "App Access",
          render: (employee) => (
            <button className="flex items-center gap-2 text-sm font-semibold text-blue-900" onClick={() => onToggleAccess(employee)}>
              {employee.appActivated ? <ToggleRight className="text-blue-600" size={24} /> : <ToggleLeft className="text-blue-300" size={24} />}
              {employee.appActivated ? "Activated" : "Not active"}
            </button>
          )
        },
        {
          key: "actions",
          header: "Actions",
          render: (employee) => (
            <Button variant="ghost" icon={<Edit size={15} />} onClick={() => onEdit(employee)}>
              Edit
            </Button>
          )
        }
      ]}
    />
  );
}
