import { Download, Plus, Search, UploadCloud, UsersRound, Zap } from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pagination } from "../../components/ui/Pagination";
import { Drawer } from "../../components/ui/Drawer";
import { Button } from "../../components/ui/Button";

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

type DrawerMode = "CREATE" | "EDIT" | "BULK" | null;

const selectCls = "h-9 rounded-lg border border-edge bg-surface px-3 text-sm text-ink-3 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15";

// ─── Page ─────────────────────────────────────────────────────────────────────
export function EmployeesPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees,    setEmployees]    = useState<Employee[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [query,        setQuery]        = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<"ALL" | EmploymentStatus>((searchParams.get("status") as EmploymentStatus) || "ALL");
  const [appFilter,    setAppFilter]    = useState<"ALL" | "ON" | "OFF">((searchParams.get("app") as "ON" | "OFF") || "ALL");
  const [selectedIds,  setSelectedIds]  = useState<string[]>([]);
  const [bulkLoading,  setBulkLoading]  = useState(false);
  const [actionId,     setActionId]     = useState<string | null>(null);
  const [page,         setPage]         = useState(Number(searchParams.get("page")) || 1);
  const [drawerMode,   setDrawerMode]   = useState<DrawerMode>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>();
  const [bulkResult,   setBulkResult]   = useState<BulkEmployeeUploadResult | null>(null);

  // Keep filters/page in the URL so refresh, back/forward, and bookmarking
  // a filtered view all just work.
  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (statusFilter !== "ALL") next.set("status", statusFilter);
    if (appFilter !== "ALL") next.set("app", appFilter);
    if (page > 1) next.set("page", String(page));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, appFilter, page]);

  const refresh = () => {
    setLoading(true);
    setLoadError(null);
    employeeService.getEmployees()
      .then(next => setEmployees(cur => mergeStable(cur, next)))
      .catch(err => { setLoadError(getApiErrorMessage(err)); toast.error("Failed to load", getApiErrorMessage(err)); })
      .finally(() => setLoading(false));
  };

  // Fetch on mount using the same handler the "Retry" button reuses.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
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

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Employees</h1>
        <p className="mt-1.5 text-sm text-ink-3">
          <span className="font-semibold text-ink">{total}</span> total ·{" "}
          <span className="font-semibold text-ink">{active}</span> active ·{" "}
          <span className="font-semibold text-ink">{appOn}</span> on app
        </p>
      </div>

      {/* Search + filters | actions toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] max-w-[300px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search employees…"
            aria-label="Search employees"
            className="h-9 w-full rounded-lg border border-edge bg-surface pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as "ALL" | EmploymentStatus)}
          aria-label="Filter by employment status"
          className={selectCls}
        >
          <option value="ALL">All employment</option>
          <option value="ACTIVE">Active only</option>
          <option value="INACTIVE">Inactive only</option>
        </select>
        <select
          value={appFilter}
          onChange={e => setAppFilter(e.target.value as "ALL" | "ON" | "OFF")}
          aria-label="Filter by app access"
          className={selectCls}
        >
          <option value="ALL">All app access</option>
          <option value="ON">App activated</option>
          <option value="OFF">Not activated</option>
        </select>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary" size="md" icon={<Zap size={13} />}
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
            >
              {bulkLoading ? "Activating…" : `Activate ${selectedIds.length}`}
            </Button>
            {totalPages > 1 && (
              <span className="text-xs text-ink-4">on this page only</span>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="h-6 w-px bg-edge" />
          <Button
            variant="secondary" size="md" icon={<Download size={14} />}
            onClick={() => exportToCsv(filtered.map(e => ({ Name: e.name, Code: e.employeeCode, Email: e.email, Phone: e.phone, Salary: e.salaryInHand, Department: e.department ?? "", Status: e.employmentStatus, AppActivated: e.appActivated ? "Yes" : "No" })), `employees-${Date.now()}`)}
          >
            Export
          </Button>
          <Button
            variant="secondary" size="md" icon={<UploadCloud size={14} />}
            onClick={() => { setBulkResult(null); setDrawerMode("BULK"); }}
          >
            Bulk add
          </Button>
          <Button
            variant="primary" size="md" icon={<Plus size={14} />}
            onClick={() => { setEditEmployee(undefined); setDrawerMode("CREATE"); }}
          >
            Add employee
          </Button>
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
        {loadError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-danger">Failed to load employees</p>
            <p className="mt-1 text-xs text-ink-3">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={refresh} className="mt-4">Retry</Button>
          </div>
        ) : loading ? (
          <div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`flex items-center gap-3.5 px-5 py-3.5 ${i < 5 ? "border-b border-edge-2" : ""}`}>
                <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-surface-muted" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-2.5 w-32 animate-pulse rounded-md bg-surface-muted" />
                  <div className="h-2 w-24 animate-pulse rounded-md bg-surface-muted" />
                </div>
                <div className="h-2.5 w-20 animate-pulse rounded-md bg-surface-muted" />
                <div className="h-4 w-16 animate-pulse rounded-full bg-surface-muted" />
              </div>
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <UsersRound size={18} strokeWidth={1.75} className="text-brand" />
            </div>
            <p className="text-sm font-medium text-ink-3">No employees added yet</p>
            <p className="mt-1 text-xs text-ink-4">Employees will appear here once your workforce is onboarded.</p>
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
            <div className="border-t border-edge-2 px-5 py-3">
              <Pagination page={safePage} totalPages={totalPages} total={filtered.length} limit={PAGE_SIZE} onPage={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Add / Edit drawer */}
      <Drawer
        open={drawerMode === "CREATE" || drawerMode === "EDIT"}
        title={drawerMode === "EDIT" ? "Edit employee" : "Add employee"}
        description={drawerMode === "EDIT" ? editEmployee?.name : "New team member"}
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
            } catch (err) { toast.error(editEmployee ? "Update failed" : "Create failed", getApiErrorMessage(err)); throw err; }
          }}
        />
      </Drawer>

      {/* Bulk drawer */}
      <Drawer open={drawerMode === "BULK"} title="Bulk add employees" description="Upload a CSV or paste rows" onClose={closeDrawer}>
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
          <div className="mt-4 overflow-hidden rounded-lg border border-danger-bg bg-danger-soft">
            <div className="border-b border-danger-bg px-3.5 py-2.5">
              <p className="text-xs font-semibold text-danger">{bulkResult!.failureCount} rows skipped</p>
            </div>
            <div className="max-h-[200px] overflow-x-auto overflow-y-auto">
              <table className="w-full border-collapse text-2xs">
                <thead>
                  <tr className="border-b border-danger-bg">
                    {["Row", "Code", "Email", "Error"].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-danger">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bulkResult!.errors.map(e => (
                    <tr key={`${e.row}-${e.email}`} className="border-b border-danger-bg/60">
                      <td className="px-3 py-1.5 text-danger">{e.row}</td>
                      <td className="px-3 py-1.5 text-ink-3">{e.employeeCode || "—"}</td>
                      <td className="px-3 py-1.5 text-ink-3">{e.email || "—"}</td>
                      <td className="px-3 py-1.5 text-ink-3">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
