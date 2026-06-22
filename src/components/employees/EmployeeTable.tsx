import { Pencil } from "lucide-react";
import type { Employee } from "../../types";
import { formatCurrency } from "../../utils/formatters";

// ── mini toggle ───────────────────────────────────────────────────────────────

function Toggle({ on, loading, onClick }: { on: boolean; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={on ? "Deactivate app access" : "Activate app access"}
      style={{ width: 32, height: 18 }}
      className={`relative inline-flex items-center rounded-full transition-colors disabled:opacity-40 flex-shrink-0 ${on ? "bg-[#7679FF]" : "bg-[#E4E4EF]"}`}
    >
      <span
        className={`inline-block w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[15px]" : "translate-x-[2px]"}`}
      />
    </button>
  );
}

// ── employment badge ──────────────────────────────────────────────────────────

function EmpBadge({ status }: { status: "ACTIVE" | "INACTIVE" }) {
  return status === "ACTIVE" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-[500] bg-[#EBF6E3] text-[#3B6D11]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#4E8A18]" />Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-[500] bg-[#F0F0F8] text-[#62657A]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#8D90A3]" />Inactive
    </span>
  );
}

// ── table ─────────────────────────────────────────────────────────────────────

export interface EmployeeTableProps {
  employees: Employee[];
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (employee: Employee) => void;
  onToggleAccess: (employee: Employee) => void;
  actionEmployeeId?: string | null;
}

export function EmployeeTable({
  employees,
  selectedIds,
  onSelect,
  onSelectAll,
  onEdit,
  onToggleAccess,
  actionEmployeeId,
}: EmployeeTableProps) {
  if (!employees.length) {
    return (
      <div className="py-14 text-center">
        <p className="text-[13px] font-[500] text-[#62657A]">No employees match your search</p>
        <p className="text-[12px] text-[#62657A] mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  const allSelected = employees.length > 0 && selectedIds.length === employees.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-[12px]">
        <colgroup>
          <col style={{ width: "3%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "11%" }} />
          <col style={{ width: "7%" }} />
        </colgroup>
        <thead>
          <tr className="border-b border-[#E4E4EF]">
            <th className="pb-2.5 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={e => onSelectAll(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#E4E4EF] accent-[#7679FF]"
              />
            </th>
            {["Employee", "Email", "Phone", "Salary", "Status", "App Access", ""].map(h => (
              <th key={h} className="pb-2.5 text-left text-[11px] font-[500] text-[#62657A] pr-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0F0F8]">
          {employees.map(emp => (
            <tr key={emp.id} className={`hover:bg-[#F7F7FB]/60 transition-colors ${selectedIds.includes(emp.id) ? "bg-[#ECEBFF]/30" : ""}`}>
              <td className="py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(emp.id)}
                  onChange={e => onSelect(emp.id, e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#E4E4EF] accent-[#7679FF]"
                />
              </td>
              <td className="py-3 pr-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#F0F0F8] flex items-center justify-center text-[11px] font-[700] text-[#62657A] flex-shrink-0">
                    {emp.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-[500] text-[#191A2E] truncate leading-none">{emp.name}</p>
                    <p className="text-[11px] text-[#62657A] mt-0.5 truncate">{emp.employeeCode}{emp.department ? ` · ${emp.department}` : ""}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-3 text-[#62657A] truncate">{emp.email}</td>
              <td className="py-3 pr-3 text-[#62657A]">{emp.phone}</td>
              <td className="py-3 pr-3 font-[600] text-[#62657A] tabular-nums">{formatCurrency(emp.salaryInHand)}</td>
              <td className="py-3 pr-3"><EmpBadge status={emp.employmentStatus} /></td>
              <td className="py-3 pr-3">
                <div className="flex items-center gap-2">
                  <Toggle
                    on={emp.appActivated}
                    loading={actionEmployeeId === emp.id}
                    onClick={() => onToggleAccess(emp)}
                  />
                  <span className={`text-[11px] font-[500] ${emp.appActivated ? "text-[#5659D9]" : "text-[#62657A]"}`}>
                    {actionEmployeeId === emp.id ? "…" : emp.appActivated ? "On" : "Off"}
                  </span>
                </div>
              </td>
              <td className="py-3">
                <button
                  onClick={() => onEdit(emp)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E4E4EF] text-[#62657A] hover:text-[#62657A] hover:border-[#E4E4EF] transition-colors"
                >
                  <Pencil size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
