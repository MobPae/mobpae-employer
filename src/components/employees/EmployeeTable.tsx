import { Pencil } from "lucide-react";
import { useState } from "react";
import type { Employee } from "../../types";
import { formatCurrency } from "../../utils/formatters";

const AVATAR_COLORS: Record<string, string> = {
  A: "#EF4444", B: "#EC4899", C: "#A855F7", D: "#315eff",
  E: "#6366F1", F: "#3B82F6", G: "#0EA5E9", H: "#06B6D4",
  I: "#10B981", J: "#22C55E", K: "#84CC16", L: "#EAB308",
  M: "#F59E0B", N: "#F97316", O: "#EF4444", P: "#315eff",
  Q: "#8B5CF6", R: "#D946EF", S: "#EC4899", T: "#F43F5E",
  U: "#315eff", V: "#6366F1", W: "#3B82F6", X: "#0EA5E9",
  Y: "#14B8A6", Z: "#10B981",
};
const avatarColor = (name: string) => AVATAR_COLORS[name.charAt(0).toUpperCase()] ?? "var(--color-brand)";

function Toggle({ on, loading, onClick }: { on: boolean; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      role="switch"
      aria-checked={on}
      title={on ? "Deactivate app access" : "Activate app access"}
      aria-label={on ? "Deactivate app access" : "Activate app access"}
      className={`relative inline-flex h-[18px] w-8 flex-shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${on ? "bg-brand" : "bg-edge-strong"}`}
    >
      <span
        className={`absolute inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-[left] ${on ? "left-[18px]" : "left-0.5"}`}
      />
    </button>
  );
}

function EmpBadge({ status }: { status: "ACTIVE" | "INACTIVE" }) {
  return status === "ACTIVE" ? (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-success-bg px-2.5 text-xs font-semibold text-success">
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-success" />
      Active
    </span>
  ) : (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-surface-muted px-2.5 text-xs font-semibold text-ink-3">
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ink-4" />
      Inactive
    </span>
  );
}

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
  employees, selectedIds, onSelect, onSelectAll, onEdit, onToggleAccess, actionEmployeeId,
}: EmployeeTableProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!employees.length) return (
    <div className="py-12 text-center">
      <p className="text-[13px] font-medium text-ink-3">No employees match your search</p>
      <p className="mt-1 text-xs text-ink-4">Try adjusting your filters</p>
    </div>
  );

  const allSelected = employees.length > 0 && selectedIds.length === employees.length;
  const thCls = "px-5 py-3.5 text-left text-[11.5px] font-semibold uppercase tracking-[0.07em] text-ink-4 whitespace-nowrap";

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-edge-2 bg-surface-raised">
              <th className="w-11 px-5 py-3.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => onSelectAll(e.target.checked)}
                  title={allSelected ? "Deselect all on this page" : "Select all on this page"}
                  aria-label={allSelected ? "Deselect all employees on this page" : "Select all employees on this page"}
                  className="h-3.5 w-3.5 cursor-pointer rounded accent-brand"
                />
              </th>
              <th className={thCls}>Employee</th>
              <th className={thCls}>Phone</th>
              <th className={thCls}>Salary</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>App Access</th>
              <th className="w-16 px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const isSelected = selectedIds.includes(emp.id);
              const isHovered  = hovered === emp.id;
              const ac = avatarColor(emp.name);
              return (
                <tr
                  key={emp.id}
                  className={`border-b border-edge-2 transition-colors ${isSelected ? "bg-brand-soft/50" : isHovered ? "bg-surface-raised" : ""}`}
                  onMouseEnter={() => setHovered(emp.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <td className="px-5 py-4 align-middle">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => onSelect(emp.id, e.target.checked)}
                      aria-label={`Select ${emp.name}`}
                      className="h-3.5 w-3.5 cursor-pointer rounded accent-brand"
                    />
                  </td>
                  <td className="py-4 pr-5 align-middle">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ background: ac }}
                      >
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13.5px] font-semibold text-ink">
                          {emp.name}
                          <span className="ml-1.5 font-medium text-ink-4 font-mono text-[11.5px]">
                            {emp.employeeCode}{emp.department ? ` · ${emp.department}` : ""}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-ink-3">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-5 align-middle text-[13.5px] text-ink-3">{emp.phone}</td>
                  <td className="py-4 pr-5 align-middle text-[13.5px] font-semibold tabular-nums text-ink">
                    {formatCurrency(emp.salaryInHand)}
                  </td>
                  <td className="py-4 pr-5 align-middle">
                    <EmpBadge status={emp.employmentStatus} />
                  </td>
                  <td className="py-4 pr-5 align-middle">
                    <div className="flex items-center gap-2">
                      <Toggle on={emp.appActivated} loading={actionEmployeeId === emp.id} onClick={() => onToggleAccess(emp)} />
                      <span className={`text-xs font-medium ${emp.appActivated ? "text-brand" : "text-ink-4"}`}>
                        {actionEmployeeId === emp.id ? "…" : emp.appActivated ? "On" : "Off"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pr-5 align-middle">
                    <button
                      onClick={() => onEdit(emp)}
                      className="flex h-[30px] items-center gap-1.5 rounded-lg bg-brand-soft px-3.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-muted"
                    >
                      <Pencil size={11} />Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-edge-2 bg-surface-raised px-5 py-3">
        <p className="text-xs text-ink-4">
          {employees.length} {employees.length === 1 ? "employee" : "employees"}
        </p>
      </div>
    </>
  );
}
