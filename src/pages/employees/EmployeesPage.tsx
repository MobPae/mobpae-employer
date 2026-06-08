import { Filter, Plus, Search, UploadCloud, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BulkEmployeeForm } from "../../components/employees/BulkEmployeeForm";
import { EmployeeForm } from "../../components/employees/EmployeeForm";
import { EmployeeTable } from "../../components/employees/EmployeeTable";
import { Button } from "../../components/ui/Button";
import { Drawer } from "../../components/ui/Drawer";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { employeeService } from "../../services/employee.service";
import type { Employee, EmployeePayload, EmploymentStatus } from "../../types";

const mergeEmployeesByStableOrder = (currentEmployees: Employee[], nextEmployees: Employee[]) => {
  const nextById = new Map(nextEmployees.map((employee) => [employee.id, employee]));
  const currentIds = new Set(currentEmployees.map((employee) => employee.id));
  const retainedEmployees = currentEmployees.flatMap((employee) => {
    const nextEmployee = nextById.get(employee.id);
    return nextEmployee ? [nextEmployee] : [];
  });
  const newEmployees = nextEmployees.filter((employee) => !currentIds.has(employee.id));

  return [...retainedEmployees, ...newEmployees];
};

const upsertEmployeesByStableOrder = (currentEmployees: Employee[], nextEmployees: Employee[]) => {
  const nextById = new Map(nextEmployees.map((employee) => [employee.id, employee]));
  const currentIds = new Set(currentEmployees.map((employee) => employee.id));
  const updatedEmployees = currentEmployees.map((employee) => nextById.get(employee.id) ?? employee);
  const newEmployees = nextEmployees.filter((employee) => !currentIds.has(employee.id));

  return [...updatedEmployees, ...newEmployees];
};

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | EmploymentStatus>("ALL");
  const [activation, setActivation] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerMode, setDrawerMode] = useState<"CREATE" | "EDIT" | "BULK_CREATE" | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();

  const refresh = () => {
    employeeService.getEmployees().then((nextEmployees) => {
      setEmployees((currentEmployees) => mergeEmployeesByStableOrder(currentEmployees, nextEmployees));
      setSelectedIds((currentIds) => currentIds.filter((id) => nextEmployees.some((employee) => employee.id === id)));
    });
  };

  const upsertEmployees = (nextEmployees: Employee[]) => {
    setEmployees((currentEmployees) => upsertEmployeesByStableOrder(currentEmployees, nextEmployees));
  };

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
        actions={
          <>
            <Button variant="secondary" icon={<UploadCloud size={16} />} onClick={() => setDrawerMode("BULK_CREATE")}>
              Bulk Add
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => setDrawerMode("CREATE")}>
              Add Employee
            </Button>
          </>
        }
      />

      <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <Input icon={<Search size={16} />} placeholder="Search employees" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as "ALL" | EmploymentStatus)}
            options={[
              { label: "Employment: All", value: "ALL" },
              { label: "Employment: Active", value: "ACTIVE" },
              { label: "Employment: Inactive", value: "INACTIVE" }
            ]}
          />
          <Select
            value={activation}
            onChange={(event) => setActivation(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            options={[
              { label: "App access: All", value: "ALL" },
              { label: "App access: Activated", value: "ACTIVE" },
              { label: "App access: Inactive", value: "INACTIVE" }
            ]}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-blue-50/70 px-3 py-2 text-sm text-blue-800">
          <div className="flex items-center gap-2 font-semibold">
            <Filter size={16} />
            {filteredEmployees.length} employees shown · {selectedIds.length} selected
          </div>
          <Button
            variant="secondary"
            icon={<Zap size={15} />}
            disabled={!selectedIds.length}
            onClick={async () => {
              const updatedEmployees = await employeeService.bulkActivateEmployees(selectedIds);
              const updatedEmployeeIds = new Set(updatedEmployees.map((employee) => employee.id));
              setEmployees((currentEmployees) =>
                upsertEmployeesByStableOrder(
                  currentEmployees.map((employee) =>
                    selectedIds.includes(employee.id) && !updatedEmployeeIds.has(employee.id)
                      ? { ...employee, appActivated: true }
                      : employee
                  ),
                  updatedEmployees
                )
              );
              setSelectedIds([]);
            }}
          >
            Activate selected
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
              const updatedEmployee = await employeeService.activateEmployee(employee.id, !employee.appActivated);
              upsertEmployees([updatedEmployee]);
            }}
          />
        </div>
      </section>

      <Drawer
        open={drawerMode === "CREATE" || drawerMode === "EDIT"}
        title={drawerMode === "EDIT" ? "Edit Employee" : "Add Employee"}
        description="Employee records are served from the dummy service and can be swapped to API calls later."
        onClose={closeDrawer}
      >
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={async (payload: EmployeePayload) => {
            let updatedEmployee: Employee;
            if (editingEmployee) {
              const { appActivated, ...employeeDetails } = payload;
              updatedEmployee = await employeeService.updateEmployee(editingEmployee.id, employeeDetails);
              updatedEmployee = { ...updatedEmployee, appActivated: editingEmployee.appActivated };

              if (appActivated !== editingEmployee.appActivated) {
                updatedEmployee = await employeeService.activateEmployee(editingEmployee.id, appActivated);
              }
            } else {
              updatedEmployee = await employeeService.createEmployee(payload);

              if (updatedEmployee.appActivated !== payload.appActivated) {
                updatedEmployee = await employeeService.activateEmployee(updatedEmployee.id, payload.appActivated);
              }
            }
            upsertEmployees([updatedEmployee]);
            closeDrawer();
          }}
        />
      </Drawer>

      <Drawer
        open={drawerMode === "BULK_CREATE"}
        title="Bulk Add Employees"
        description="Paste employee rows and import them through the employee service."
        onClose={closeDrawer}
      >
        <BulkEmployeeForm
          onSubmit={async (payloads: EmployeePayload[]) => {
            const createdEmployees = await employeeService.bulkCreateEmployees(payloads);
            upsertEmployees(createdEmployees);
            closeDrawer();
          }}
        />
      </Drawer>
    </>
  );
}
