import { Pencil, Zap } from "lucide-react";
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
      className={`relative inline-flex items-center rounded-full transition-colors disabled:opacity-40 flex-shrink-0 ${on ? "bg-emerald-500" : "bg-slate-200"}`}
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-[500] bg-emerald-50 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-[500] bg-slate-100 text-slate-500">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Inactive
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
        <p className="text-[13px] font-[500] text-slate-500">No employees found</p>
        <p className="text-[12px] text-slate-400 mt-1">Try adjusting your filters or add employees</p>
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
          <tr className="border-b border-slate-100">
            <th className="pb-2.5 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={e => onSelectAll(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 accent-slate-800"
              />
            </th>
            {["Employee", "Email", "Phone", "Salary", "Status", "App Access", ""].map(h => (
              <th key={h} className="pb-2.5 text-left text-[11px] font-[500] text-slate-400 pr-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {employees.map(emp => (
            <tr key={emp.id} className={`hover:bg-slate-50/60 transition-colors ${selectedIds.includes(emp.id) ? "bg-blue-50/30" : ""}`}>
              <td className="py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(emp.id)}
                  onChange={e => onSelect(emp.id, e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 accent-slate-800"
                />
              </td>
              <td className="py-3 pr-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-[700] text-slate-500 flex-shrink-0">
                    {emp.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-[500] text-slate-800 truncate leading-none">{emp.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{emp.employeeCode}{emp.department ? ` · ${emp.department}` : ""}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-3 text-slate-500 truncate">{emp.email}</td>
              <td className="py-3 pr-3 text-slate-500">{emp.phone}</td>
              <td className="py-3 pr-3 font-[600] text-slate-700 tabular-nums">{formatCurrency(emp.salaryInHand)}</td>
              <td className="py-3 pr-3"><EmpBadge status={emp.employmentStatus} /></td>
              <td className="py-3 pr-3">
                <div className="flex items-center gap-2">
                  <Toggle
                    on={emp.appActivated}
                    loading={actionEmployeeId === emp.id}
                    onClick={() => onToggleAccess(emp)}
                  />
                  <span className={`text-[11px] font-[500] ${emp.appActivated ? "text-emerald-700" : "text-slate-400"}`}>
                    {actionEmployeeId === emp.id ? "…" : emp.appActivated ? "On" : "Off"}
                  </span>
                </div>
              </td>
              <td className="py-3">
                <button
                  onClick={() => onEdit(emp)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors"
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
