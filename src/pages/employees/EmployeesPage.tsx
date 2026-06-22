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

// ── helpers ───────────────────────────────────────────────────────────────────

function mergeStable(cur: Employee[], next: Employee[]): Employee[] {
  const nextMap = new Map(next.map(e => [e.id, e]));
  const curSet  = new Set(cur.map(e => e.id));
  return [
    ...cur.flatMap(e => { const n = nextMap.get(e.id); return n ? [n] : []; }),
    ...next.filter(e => !curSet.has(e.id)),
  ];
}
function upsertStable(cur: Employee[], next: Employee[]): Employee[] {
  const nextMap = new Map(next.map(e => [e.id, e]));
  const curSet  = new Set(cur.map(e => e.id));
  return [
    ...cur.map(e => nextMap.get(e.id) ?? e),
    ...next.filter(e => !curSet.has(e.id)),
  ];
}

// ── drawer ────────────────────────────────────────────────────────────────────

type DrawerMode = "CREATE" | "EDIT" | "BULK" | null;

function DrawerPanel({
  open, title, subtitle, onClose, children,
}: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      )}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-[440px] bg-white border-l border-[#E4E4EF] shadow-xl flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-[#E4E4EF]">
          <div>
            <p className="text-[14px] font-[600] text-[#191A2E]">{title}</p>
            {subtitle && <p className="text-[12px] text-[#62657A] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E4E4EF] text-[#62657A] hover:text-[#62657A] hover:border-[#E4E4EF] transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function EmployeesPage() {
  const toast = useToast();
  const [employees,     setEmployees]     = useState<Employee[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState<string | null>(null);
  const [query,         setQuery]         = useState("");
  const [statusFilter,  setStatusFilter]  = useState<"ALL" | EmploymentStatus>("ALL");
  const [appFilter,     setAppFilter]     = useState<"ALL" | "ON" | "OFF">("ALL");
  const [selectedIds,   setSelectedIds]   = useState<string[]>([]);
  const [bulkLoading,   setBulkLoading]   = useState(false);
  const [actionId,      setActionId]      = useState<string | null>(null);
  const [page,          setPage]          = useState(1);
  const [drawerMode,    setDrawerMode]    = useState<DrawerMode>(null);
  const [editEmployee,  setEditEmployee]  = useState<Employee | undefined>();
  const [bulkResult,    setBulkResult]    = useState<BulkEmployeeUploadResult | null>(null);

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
    return (
      q.includes(query.toLowerCase()) &&
      (statusFilter === "ALL" || e.employmentStatus === statusFilter) &&
      (appFilter === "ALL" || (appFilter === "ON") === e.appActivated)
    );
  }), [employees, query, statusFilter, appFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const closeDrawer = () => {
    setDrawerMode(null);
    setEditEmployee(undefined);
    setBulkResult(null);
  };

  // counts for header chips
  const total    = employees.length;
  const active   = employees.filter(e => e.employmentStatus === "ACTIVE").length;
  const appOn    = employees.filter(e => e.appActivated).length;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Search */}
          <div className="relative flex-1 max-w-[280px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#62657A]" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search employees…"
              className="w-full h-9 pl-8 pr-3 text-[13px] bg-white border border-[#E4E4EF] rounded-lg focus:outline-none focus:border-[#7679FF] focus:ring-2 focus:ring-[#7679FF]/10 transition placeholder-[#B7B9C7] text-[#191A2E]"
            />
          </div>
          {/* Filters */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as "ALL" | EmploymentStatus)}
            className="h-9 px-3 text-[12px] bg-white border border-[#E4E4EF] rounded-lg text-[#62657A] focus:outline-none focus:border-[#7679FF] transition cursor-pointer"
          >
            <option value="ALL">All employment</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Inactive only</option>
          </select>
          <select
            value={appFilter}
            onChange={e => setAppFilter(e.target.value as "ALL" | "ON" | "OFF")}
            className="h-9 px-3 text-[12px] bg-white border border-[#E4E4EF] rounded-lg text-[#62657A] focus:outline-none focus:border-[#7679FF] transition cursor-pointer"
          >
            <option value="ALL">All app access</option>
            <option value="ON">App activated</option>
            <option value="OFF">Not activated</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => exportToCsv(filtered.map(e => ({
              Name:            e.name,
              Code:            e.employeeCode,
              Email:           e.email,
              Phone:           e.phone,
              Salary:          e.salaryInHand,
              Department:      e.department ?? "",
              Status:          e.employmentStatus,
              AppActivated:    e.appActivated ? "Yes" : "No",
            })), `employees-${Date.now()}`)}
            className="h-9 px-3.5 flex items-center gap-2 text-[12px] font-[500] text-[#62657A] bg-white border border-[#E4E4EF] rounded-lg hover:border-[#E4E4EF] hover:bg-[#F7F7FB] transition-colors"
          >
            <Download size={14} />Export
          </button>
          <button
            onClick={() => { setBulkResult(null); setDrawerMode("BULK"); }}
            className="h-9 px-3.5 flex items-center gap-2 text-[12px] font-[500] text-[#62657A] bg-white border border-[#E4E4EF] rounded-lg hover:border-[#E4E4EF] hover:bg-[#F7F7FB] transition-colors"
          >
            <UploadCloud size={14} />Bulk add
          </button>
          <button
            onClick={() => { setEditEmployee(undefined); setDrawerMode("CREATE"); }}
            className="h-9 px-3.5 flex items-center gap-2 text-[12px] font-[600] text-white bg-[#7679FF] rounded-lg hover:bg-[#5659D9] transition-colors"
          >
            <Plus size={14} />Add employee
          </button>
        </div>
      </div>

      {/* Summary + bulk action bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-[#E4E4EF] rounded-xl text-[12px]">
        <div className="flex items-center gap-4">
          <span className="text-[#62657A]">{filtered.length} shown</span>
          <span className="text-[#62657A]">·</span>
          <span className="text-[#62657A]"><span className="font-[600] text-[#191A2E]">{active}</span> active</span>
          <span className="text-[#62657A]"><span className="font-[600] text-[#191A2E]">{appOn}</span> app activated</span>
          <span className="text-[#62657A]">of <span className="font-[600] text-[#191A2E]">{total}</span> total</span>
        </div>
        {selectedIds.length > 0 && (
          <button
            disabled={bulkLoading}
            onClick={async () => {
              const ids = [...selectedIds];
              setBulkLoading(true);
              try {
                const updated = await employeeService.bulkActivateEmployees(ids);
                const updMap = new Map(updated.map(e => [e.id, e]));
                setEmployees(cur => upsertStable(
                  cur.map(e => ids.includes(e.id) && !updMap.has(e.id) ? { ...e, appActivated: true } : e),
                  updated
                ));
                setSelectedIds([]);
                toast.success("Activated", `${ids.length} employee${ids.length > 1 ? "s" : ""} activated`);
              } catch (err) {
                toast.error("Bulk activation failed", getApiErrorMessage(err));
              } finally {
                setBulkLoading(false);
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#7679FF] text-white text-[12px] font-[500] hover:bg-[#5659D9] disabled:opacity-50 transition-colors"
          >
            <Zap size={12} />
            {bulkLoading ? "Activating…" : `Activate ${selectedIds.length} selected`}
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="bg-white border border-[#E4E4EF] rounded-xl overflow-hidden">
        {loadError ? (
          <div className="py-14 text-center">
            <p className="text-[13px] font-[500] text-red-600">Failed to load employees</p>
            <p className="text-[12px] text-[#62657A] mt-1">{loadError}</p>
            <button onClick={refresh} className="mt-4 h-8 px-4 text-[12px] font-[500] bg-white border border-[#E4E4EF] rounded-lg hover:bg-[#F7F7FB] transition-colors text-[#62657A]">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#F0F0F8] last:border-0">
                <div className="w-8 h-8 rounded-full bg-[#F0F0F8] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-32 bg-[#F0F0F8] rounded animate-pulse" />
                  <div className="h-2 w-24 bg-[#F0F0F8] rounded animate-pulse" />
                </div>
                <div className="h-2.5 w-20 bg-[#F0F0F8] rounded animate-pulse" />
                <div className="h-4 w-16 bg-[#F0F0F8] rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#F0F0F8] flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#62657A]">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[13px] font-[500] text-[#62657A]">No employees added yet</p>
            <p className="text-[12px] text-[#62657A] mt-1">Employees will appear here once your workforce is onboarded.</p>
          </div>
        ) : (
          <div className="px-5 py-4">
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
                } catch (err) {
                  toast.error("Update failed", getApiErrorMessage(err));
                } finally {
                  setActionId(null);
                }
              }}
              actionEmployeeId={actionId}
            />
            <div className="px-5 pb-4">
              <Pagination
                page={safePage}
                totalPages={totalPages}
                total={filtered.length}
                limit={PAGE_SIZE}
                onPage={setPage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit drawer */}
      <DrawerPanel
        open={drawerMode === "CREATE" || drawerMode === "EDIT"}
        title={drawerMode === "EDIT" ? "Edit employee" : "Add employee"}
        subtitle={drawerMode === "EDIT" ? editEmployee?.name : "New team member"}
        onClose={closeDrawer}
      >
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
            } catch (err) {
              toast.error(editEmployee ? "Update failed" : "Create failed", getApiErrorMessage(err));
              throw err;
            }
          }}
        />
      </DrawerPanel>

      {/* Bulk drawer */}
      <DrawerPanel
        open={drawerMode === "BULK"}
        title="Bulk add employees"
        subtitle="Upload a CSV or paste rows"
        onClose={closeDrawer}
      >
        <BulkEmployeeForm
          onSubmit={async (payloads: EmployeePayload[]) => {
            try {
              const result = await employeeService.bulkCreateEmployees(payloads);
              setBulkResult(result);
              setEmployees(cur => upsertStable(cur, result.created));
              if (result.failureCount > 0) {
                toast.error("Some rows skipped", `${result.successCount} created, ${result.failureCount} failed`);
              } else {
                toast.success("Import complete", `${result.successCount} employee${result.successCount !== 1 ? "s" : ""} added`);
                closeDrawer();
              }
              return result;
            } catch (err) {
              toast.error("Import failed", getApiErrorMessage(err));
              throw err;
            }
          }}
        />
        {(bulkResult?.errors.length ?? 0) > 0 && (
          <div className="mt-4 bg-red-50 border border-red-100 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-red-100">
              <p className="text-[12px] font-[600] text-red-700">{bulkResult!.failureCount} rows skipped</p>
            </div>
            <div className="overflow-x-auto max-h-52 overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-red-100">
                    {["Row", "Code", "Email", "Error"].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-[500] text-red-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-50">
                  {bulkResult!.errors.map(e => (
                    <tr key={`${e.row}-${e.email}`}>
                      <td className="px-3 py-2 text-red-500">{e.row}</td>
                      <td className="px-3 py-2 text-[#62657A]">{e.employeeCode || "—"}</td>
                      <td className="px-3 py-2 text-[#62657A]">{e.email || "—"}</td>
                      <td className="px-3 py-2 text-[#62657A]">{e.message}</td>
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
