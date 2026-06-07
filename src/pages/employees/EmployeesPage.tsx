import { Filter, Plus, Search, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmployeeForm } from "../../components/employees/EmployeeForm";
import { EmployeeTable } from "../../components/employees/EmployeeTable";
import { Button } from "../../components/ui/Button";
import { Drawer } from "../../components/ui/Drawer";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { employeeService } from "../../services/employee.service";
import type { Employee, EmployeePayload, EmploymentStatus } from "../../types";

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | EmploymentStatus>("ALL");
  const [activation, setActivation] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerMode, setDrawerMode] = useState<"CREATE" | "EDIT" | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();

  const refresh = () => employeeService.getEmployees().then(setEmployees);

  useEffect(() => {
    refresh();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const searchable = `${employee.employeeCode} ${employee.name} ${employee.email} ${employee.phone}`.toLowerCase();
      const matchesQuery = searchable.includes(query.toLowerCase());
      const matchesStatus = status === "ALL" || employee.employmentStatus === status;
      const matchesActivation = activation === "ALL" || employee.appActivated === (activation === "ACTIVE");
      return matchesQuery && matchesStatus && matchesActivation;
    });
  }, [activation, employees, query, status]);

  const closeDrawer = () => {
    setDrawerMode(null);
    setEditingEmployee(undefined);
  };

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Employees"
        description="Manage employee eligibility, app activation and salary access controls."
        actions={<Button icon={<Plus size={16} />} onClick={() => setDrawerMode("CREATE")}>Add Employee</Button>}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <Input icon={<Search size={16} />} placeholder="Search employees" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as "ALL" | EmploymentStatus)}
            options={[
              { label: "All statuses", value: "ALL" },
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" }
            ]}
          />
          <Select
            value={activation}
            onChange={(event) => setActivation(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            options={[
              { label: "All access", value: "ALL" },
              { label: "Activated", value: "ACTIVE" },
              { label: "Not activated", value: "INACTIVE" }
            ]}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <div className="flex items-center gap-2 font-semibold">
            <Filter size={16} />
            {filteredEmployees.length} employees shown · {selectedIds.length} selected
          </div>
          <Button
            variant="secondary"
            icon={<Zap size={15} />}
            disabled={!selectedIds.length}
            onClick={async () => {
              await employeeService.bulkActivateEmployees(selectedIds);
              setSelectedIds([]);
              refresh();
            }}
          >
            Bulk Activation
          </Button>
        </div>

        <div className="mt-4">
          <EmployeeTable
            employees={filteredEmployees}
            selectedIds={selectedIds}
            onSelect={(id, selected) => setSelectedIds((current) => (selected ? [...current, id] : current.filter((value) => value !== id)))}
            onSelectAll={(selected) => setSelectedIds(selected ? filteredEmployees.map((employee) => employee.id) : [])}
            onEdit={(employee) => {
              setEditingEmployee(employee);
              setDrawerMode("EDIT");
            }}
            onToggleAccess={async (employee) => {
              await employeeService.activateEmployee(employee.id, !employee.appActivated);
              refresh();
            }}
          />
        </div>
      </section>

      <Drawer
        open={Boolean(drawerMode)}
        title={drawerMode === "EDIT" ? "Edit Employee" : "Add Employee"}
        description="Employee records are served from the dummy service and can be swapped to API calls later."
        onClose={closeDrawer}
      >
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={async (payload: EmployeePayload) => {
            if (editingEmployee) {
              await employeeService.updateEmployee(editingEmployee.id, payload);
            } else {
              await employeeService.createEmployee(payload);
            }
            await refresh();
            closeDrawer();
          }}
        />
      </Drawer>
    </>
  );
}
