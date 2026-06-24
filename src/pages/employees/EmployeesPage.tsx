import { Download, Plus, Search, UploadCloud, X, Zap } from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "../../components/ui/Pagination";

const PAGE_SIZE = 15;
import { BulkEmployeeForm } from "../../components/employees/BulkEmployeeForm";
import { EmployeeForm } from "../../components/employees/EmployeeForm";
import { EmployeeTable } from "../../components/employees/EmployeeTable";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api-errors";
import { employeeService } from "../../services/employee.service";
import type { BulkEmployeeUploadResult, Employee, EmployeePayload, EmploymentStatus } from "../../types";

// ─── helpers ──────────────────────────────────────────────────────────────────
function mergeStable(cur: Employee[], next: Employee[]): Employee[] {
  const nextMap = new Map(next.map(e => [e.id, e]));
  const curSet  = new Set(cur.map(e => e.id));
  return [...cur.flatMap(e => { const n = nextMap.get(e.id); return n ? [n] : []; }), ...next.filter(e => !curSet.has(e.id))];
}
function upsertStable(cur: Employee[], next: Employee[]): Employee[] {
  const nextMap = new Map(next.map(e => [e.id, e]));
  const curSet  = new Set(cur.map(e => e.id));
  return [...cur.map(e => nextMap.get(e.id) ?? e), ...next.filter(e => !curSet.has(e.id))];
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
type DrawerMode = "CREATE" | "EDIT" | "BULK" | null;

function DrawerPanel({ open, title, subtitle, onClose, children }: {
  open: boolean; title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />}
      <div className={`fixed inset-y-0 right-0 z-40 w-[440px] bg-white flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ borderLeft: "1px solid #E5E7EB", boxShadow: "0 8px 40px rgba(17,24,39,0.10)" }}>
        <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{title}</p>
            {subtitle && <p style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #E5E7EB", color: "#6B7280", background: "transparent", cursor: "pointer" }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>{children}</div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function EmployeesPage() {
  const toast = useToast();
  const [employees,    setEmployees]    = useState<Employee[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [query,        setQuery]        = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | EmploymentStatus>("ALL");
  const [appFilter,    setAppFilter]    = useState<"ALL" | "ON" | "OFF">("ALL");
  const [selectedIds,  setSelectedIds]  = useState<string[]>([]);
  const [bulkLoading,  setBulkLoading]  = useState(false);
  const [actionId,     setActionId]     = useState<string | null>(null);
  const [page,         setPage]         = useState(1);
  const [drawerMode,   setDrawerMode]   = useState<DrawerMode>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>();
  const [bulkResult,   setBulkResult]   = useState<BulkEmployeeUploadResult | null>(null);

  const refresh = () => {
    setLoading(true);
    setLoadError(null);
    employeeService.getEmployees()
      .then(next => setEmployees(cur => mergeStable(cur, next)))
      .catch(err => { setLoadError(getApiErrorMessage(err)); toast.error("Failed to load", getApiErrorMessage(err)); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => employees.filter(e => {
    const q = `${e.employeeCode} ${e.name} ${e.email} ${e.phone}`.toLowerCase();
    return q.includes(query.toLowerCase()) &&
      (statusFilter === "ALL" || e.employmentStatus === statusFilter) &&
      (appFilter === "ALL" || (appFilter === "ON") === e.appActivated);
  }), [employees, query, statusFilter, appFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const closeDrawer = () => { setDrawerMode(null); setEditEmployee(undefined); setBulkResult(null); };

  const total  = employees.length;
  const active = employees.filter(e => e.employmentStatus === "ACTIVE").length;
  const appOn  = employees.filter(e => e.appActivated).length;

  const btnBase: React.CSSProperties = { height: 36, display: "flex", alignItems: "center", gap: 7, padding: "0 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "Inter, ui-sans-serif, sans-serif" }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", letterSpacing: "-0.025em", margin: 0 }}>Employees</h1>
          <p style={{ fontSize: 14, color: "#6B7280", marginTop: 6 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>{total}</span> total · <span style={{ fontWeight: 600, color: "#111827" }}>{active}</span> active · <span style={{ fontWeight: 600, color: "#111827" }}>{appOn}</span> on app
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => exportToCsv(filtered.map(e => ({ Name: e.name, Code: e.employeeCode, Email: e.email, Phone: e.phone, Salary: e.salaryInHand, Department: e.department ?? "", Status: e.employmentStatus, AppActivated: e.appActivated ? "Yes" : "No" })), `employees-${Date.now()}`)}
            style={{ ...btnBase, background: "white", border: "1px solid #E5E7EB", color: "#6B7280" }}>
            <Download size={14} />Export
          </button>
          <button onClick={() => { setBulkResult(null); setDrawerMode("BULK"); }}
            style={{ ...btnBase, background: "white", border: "1px solid #E5E7EB", color: "#6B7280" }}>
            <UploadCloud size={14} />Bulk add
          </button>
          <button onClick={() => { setEditEmployee(undefined); setDrawerMode("CREATE"); }}
            style={{ ...btnBase, background: "#6C4CFF", border: "none", color: "white", boxShadow: "0 4px 14px rgba(108,76,255,0.25)", fontWeight: 600 }}>
            <Plus size={14} />Add employee
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search employees…"
            style={{ width: "100%", height: 38, paddingLeft: 36, paddingRight: 12, fontSize: 13, background: "white", border: "1px solid #E5E7EB", borderRadius: 10, color: "#111827", outline: "none", fontFamily: "inherit" }}
            onFocus={e => (e.target.style.borderColor = "#6C4CFF")}
            onBlur={e  => (e.target.style.borderColor = "#E5E7EB")}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as "ALL" | EmploymentStatus)}
          style={{ height: 38, padding: "0 12px", fontSize: 13, background: "white", border: "1px solid #E5E7EB", borderRadius: 10, color: "#6B7280", cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
          <option value="ALL">All employment</option>
          <option value="ACTIVE">Active only</option>
          <option value="INACTIVE">Inactive only</option>
        </select>
        <select value={appFilter} onChange={e => setAppFilter(e.target.value as "ALL" | "ON" | "OFF")}
          style={{ height: 38, padding: "0 12px", fontSize: 13, background: "white", border: "1px solid #E5E7EB", borderRadius: 10, color: "#6B7280", cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
          <option value="ALL">All app access</option>
          <option value="ON">App activated</option>
          <option value="OFF">Not activated</option>
        </select>
        {selectedIds.length > 0 && (
          <button
            disabled={bulkLoading}
            onClick={async () => {
              const ids = [...selectedIds];
              setBulkLoading(true);
              try {
                const updated = await employeeService.bulkActivateEmployees(ids);
                const updMap = new Map(updated.map(e => [e.id, e]));
                setEmployees(cur => upsertStable(cur.map(e => ids.includes(e.id) && !updMap.has(e.id) ? { ...e, appActivated: true } : e), updated));
                setSelectedIds([]);
                toast.success("Activated", `${ids.length} employee${ids.length > 1 ? "s" : ""} activated`);
              } catch (err) { toast.error("Bulk activation failed", getApiErrorMessage(err)); }
              finally { setBulkLoading(false); }
            }}
            style={{ ...btnBase, marginLeft: "auto", background: "#6C4CFF", border: "none", color: "white", boxShadow: "0 4px 14px rgba(108,76,255,0.25)", fontWeight: 600, opacity: bulkLoading ? 0.7 : 1 }}>
            <Zap size={13} />{bulkLoading ? "Activating…" : `Activate ${selectedIds.length}`}
          </button>
        )}
      </div>

      {/* Table card */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(17,24,39,0.04)", overflow: "hidden" }}>
        {loadError ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#DC2626" }}>Failed to load employees</p>
            <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{loadError}</p>
            <button onClick={refresh} style={{ marginTop: 16, height: 34, padding: "0 16px", fontSize: 12, fontWeight: 500, background: "white", border: "1px solid #E5E7EB", borderRadius: 8, cursor: "pointer", color: "#6B7280", fontFamily: "inherit" }}>Retry</button>
          </div>
        ) : loading ? (
          <div>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < 5 ? "1px solid #F9FAFB" : "none" }}>
                <div className="animate-pulse" style={{ width: 32, height: 32, borderRadius: "50%", background: "#F3F4F6", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="animate-pulse" style={{ height: 10, width: 128, background: "#F3F4F6", borderRadius: 6 }} />
                  <div className="animate-pulse" style={{ height: 8, width: 96, background: "#F3F4F6", borderRadius: 6 }} />
                </div>
                <div className="animate-pulse" style={{ height: 10, width: 80, background: "#F3F4F6", borderRadius: 6 }} />
                <div className="animate-pulse" style={{ height: 18, width: 60, background: "#F3F4F6", borderRadius: 999 }} />
              </div>
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F3F0FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C4CFF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#6B7280" }}>No employees added yet</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>Employees will appear here once your workforce is onboarded.</p>
          </div>
        ) : (
          <>
            <EmployeeTable
              employees={paginated}
              selectedIds={selectedIds}
              onSelect={(id, sel) => setSelectedIds(cur => sel ? [...cur, id] : cur.filter(x => x !== id))}
              onSelectAll={sel => setSelectedIds(sel ? paginated.map(e => e.id) : [])}
              onEdit={emp => { setEditEmployee(emp); setDrawerMode("EDIT"); }}
              onToggleAccess={async emp => {
                setActionId(emp.id);
                try {
                  const updated = await employeeService.activateEmployee(emp.id, !emp.appActivated);
                  setEmployees(cur => upsertStable(cur, [updated]));
                  toast.success("App access updated", `${emp.name} is now ${updated.appActivated ? "activated" : "inactive"}`);
                } catch (err) { toast.error("Update failed", getApiErrorMessage(err)); }
                finally { setActionId(null); }
              }}
              actionEmployeeId={actionId}
            />
            <div style={{ padding: "8px 20px 16px", borderTop: "1px solid #F9FAFB" }}>
              <Pagination page={safePage} totalPages={totalPages} total={filtered.length} limit={PAGE_SIZE} onPage={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Add / Edit drawer */}
      <DrawerPanel open={drawerMode === "CREATE" || drawerMode === "EDIT"} title={drawerMode === "EDIT" ? "Edit employee" : "Add employee"} subtitle={drawerMode === "EDIT" ? editEmployee?.name : "New team member"} onClose={closeDrawer}>
        <EmployeeForm
          employee={editEmployee}
          onSubmit={async (payload: EmployeePayload) => {
            try {
              let emp: Employee;
              if (editEmployee) {
                const { appActivated, ...rest } = payload;
                emp = await employeeService.updateEmployee(editEmployee.id, rest);
                if (payload.employmentStatus === "ACTIVE" && appActivated !== emp.appActivated) {
                  emp = await employeeService.activateEmployee(editEmployee.id, appActivated);
                }
              } else {
                emp = await employeeService.createEmployee(payload);
                if (payload.employmentStatus === "ACTIVE" && emp.appActivated !== payload.appActivated) {
                  emp = await employeeService.activateEmployee(emp.id, payload.appActivated);
                }
              }
              setEmployees(cur => upsertStable(cur, [emp]));
              toast.success(editEmployee ? "Employee updated" : "Employee created", emp.name);
              closeDrawer();
            } catch (err) { toast.error(editEmployee ? "Update failed" : "Create failed", getApiErrorMessage(err)); throw err; }
          }}
        />
      </DrawerPanel>

      {/* Bulk drawer */}
      <DrawerPanel open={drawerMode === "BULK"} title="Bulk add employees" subtitle="Upload a CSV or paste rows" onClose={closeDrawer}>
        <BulkEmployeeForm
          onSubmit={async (payloads: EmployeePayload[]) => {
            try {
              const result = await employeeService.bulkCreateEmployees(payloads);
              setBulkResult(result);
              setEmployees(cur => upsertStable(cur, result.created));
              if (result.failureCount > 0) { toast.error("Some rows skipped", `${result.successCount} created, ${result.failureCount} failed`); }
              else { toast.success("Import complete", `${result.successCount} employee${result.successCount !== 1 ? "s" : ""} added`); closeDrawer(); }
              return result;
            } catch (err) { toast.error("Import failed", getApiErrorMessage(err)); throw err; }
          }}
        />
        {(bulkResult?.errors.length ?? 0) > 0 && (
          <div style={{ marginTop: 16, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #FECACA" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#DC2626" }}>{bulkResult!.failureCount} rows skipped</p>
            </div>
            <div style={{ overflowX: "auto", maxHeight: 200, overflowY: "auto" }}>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #FECACA" }}>
                    {["Row", "Code", "Email", "Error"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500, color: "#DC2626" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bulkResult!.errors.map(e => (
                    <tr key={`${e.row}-${e.email}`} style={{ borderBottom: "1px solid #FEE2E2" }}>
                      <td style={{ padding: "7px 12px", color: "#DC2626" }}>{e.row}</td>
                      <td style={{ padding: "7px 12px", color: "#6B7280" }}>{e.employeeCode || "—"}</td>
                      <td style={{ padding: "7px 12px", color: "#6B7280" }}>{e.email || "—"}</td>
                      <td style={{ padding: "7px 12px", color: "#6B7280" }}>{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DrawerPanel>
    </div>
  );
}
