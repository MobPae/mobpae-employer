import { Pencil } from "lucide-react";
import { useState } from "react";
import type { Employee } from "../../types";
import { formatCurrency } from "../../utils/formatters";

const P  = "#6C4CFF";
const PS = "#F3F0FF";
const T1 = "#111827";
const T2 = "#6B7280";
const T3 = "#9CA3AF";

// Per-letter colorful avatar (matches admin design)
const AVATAR_COLORS: Record<string, string> = {
  A: "#EF4444", B: "#EC4899", C: "#A855F7", D: "#6C4CFF",
  E: "#6366F1", F: "#3B82F6", G: "#0EA5E9", H: "#06B6D4",
  I: "#10B981", J: "#22C55E", K: "#84CC16", L: "#EAB308",
  M: "#F59E0B", N: "#F97316", O: "#EF4444", P2: "#6C4CFF",
  Q: "#8B5CF6", R: "#D946EF", S: "#EC4899", T: "#F43F5E",
  U: "#6C4CFF", V: "#6366F1", W: "#3B82F6", X: "#0EA5E9",
  Y: "#14B8A6", Z: "#10B981",
};
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charAt(0).toUpperCase()] ?? P;

function Toggle({ on, loading, onClick }: { on: boolean; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={on ? "Deactivate app access" : "Activate app access"}
      style={{
        width: 32, height: 18, borderRadius: 999,
        background: on ? P : "#E5E7EB",
        border: "none", cursor: loading ? "not-allowed" : "pointer",
        position: "relative", display: "inline-flex", alignItems: "center",
        flexShrink: 0, transition: "background 0.2s", opacity: loading ? 0.5 : 1,
      }}
    >
      <span style={{
        display: "inline-block", width: 14, height: 14, borderRadius: "50%",
        background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        position: "absolute", left: on ? 16 : 2, transition: "left 0.2s",
      }} />
    </button>
  );
}

function EmpBadge({ status }: { status: "ACTIVE" | "INACTIVE" }) {
  return status === "ACTIVE" ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 24, padding: "0 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "#DCFCE7", color: "#16A34A" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A", flexShrink: 0 }} />Active
    </span>
  ) : (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 24, padding: "0 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "#F3F4F6", color: T2 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: T3, flexShrink: 0 }} />Inactive
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

const HEADERS = ["", "Employee", "Phone", "Salary", "Status", "App Access", ""];

export function EmployeeTable({
  employees, selectedIds, onSelect, onSelectAll, onEdit, onToggleAccess, actionEmployeeId,
}: EmployeeTableProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!employees.length) return (
    <div style={{ padding: "48px 0", textAlign: "center" }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: T2 }}>No employees match your search</p>
      <p style={{ fontSize: 12, color: T3, marginTop: 4 }}>Try adjusting your filters</p>
    </div>
  );

  const allSelected = employees.length > 0 && selectedIds.length === employees.length;

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
              {/* Checkbox */}
              <th style={{ padding: "14px 16px 14px 20px", width: 44 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => onSelectAll(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: P, cursor: "pointer" }}
                />
              </th>
              {/* Employee */}
              <th style={{ padding: "14px 20px 14px 0", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>Employee</th>
              {/* Phone */}
              <th style={{ padding: "14px 20px 14px 0", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Phone</th>
              {/* Salary */}
              <th style={{ padding: "14px 20px 14px 0", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Salary</th>
              {/* Status */}
              <th style={{ padding: "14px 20px 14px 0", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Status</th>
              {/* App Access */}
              <th style={{ padding: "14px 20px 14px 0", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.07em" }}>App Access</th>
              {/* Actions */}
              <th style={{ padding: "14px 20px 14px 0", width: 60 }} />
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const isSelected = selectedIds.includes(emp.id);
              const isHovered  = hovered === emp.id;
              const ac = avatarColor(emp.name);
              const rowBg = isSelected ? `${PS}80` : isHovered ? "#FAFAFC" : "transparent";
              return (
                <tr
                  key={emp.id}
                  style={{ borderBottom: "1px solid #F9FAFB", background: rowBg, transition: "background 0.1s", cursor: "default" }}
                  onMouseEnter={() => setHovered(emp.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Checkbox */}
                  <td style={{ padding: "16px 16px 16px 20px", verticalAlign: "middle" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => onSelect(emp.id, e.target.checked)}
                      style={{ width: 14, height: 14, accentColor: P, cursor: "pointer" }}
                    />
                  </td>
                  {/* Employee name + code */}
                  <td style={{ padding: "16px 20px 16px 0", verticalAlign: "middle" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: ac, color: "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 700, flexShrink: 0,
                      }}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: T1, margin: 0 }}>
                          {emp.name}
                          <span style={{ fontSize: 11.5, fontWeight: 500, color: T3, fontFamily: "ui-monospace, monospace", marginLeft: 6 }}>
                            {emp.employeeCode}{emp.department ? ` · ${emp.department}` : ""}
                          </span>
                        </p>
                        <p style={{ fontSize: 12.5, color: T2, margin: "2px 0 0" }}>{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Phone */}
                  <td style={{ padding: "16px 20px 16px 0", verticalAlign: "middle", fontSize: 13.5, color: T2 }}>
                    {emp.phone}
                  </td>
                  {/* Salary */}
                  <td style={{ padding: "16px 20px 16px 0", verticalAlign: "middle", fontSize: 13.5, fontWeight: 600, color: T1, fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(emp.salaryInHand)}
                  </td>
                  {/* Employment status */}
                  <td style={{ padding: "16px 20px 16px 0", verticalAlign: "middle" }}>
                    <EmpBadge status={emp.employmentStatus} />
                  </td>
                  {/* App access toggle */}
                  <td style={{ padding: "16px 20px 16px 0", verticalAlign: "middle" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Toggle on={emp.appActivated} loading={actionEmployeeId === emp.id} onClick={() => onToggleAccess(emp)} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: emp.appActivated ? P : T3 }}>
                        {actionEmployeeId === emp.id ? "…" : emp.appActivated ? "On" : "Off"}
                      </span>
                    </div>
                  </td>
                  {/* Edit button */}
                  <td style={{ padding: "16px 20px 16px 0", verticalAlign: "middle" }}>
                    <button
                      onClick={() => onEdit(emp)}
                      style={{
                        height: 30, padding: "0 14px",
                        background: "#F3F0FF", color: P,
                        border: "none", borderRadius: 8,
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
                      }}
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
      {/* Footer strip */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
        <p style={{ fontSize: 12, color: T3, margin: 0 }}>
          {employees.length} {employees.length === 1 ? "employee" : "employees"}
        </p>
      </div>
    </>
  );
}
