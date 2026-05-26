import { useEffect, useMemo, useState } from "react";
import {
  IndianRupee,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  User,
  X,
} from "lucide-react";
import { api } from "../services/api";
import { getAuthUser } from "../services/auth";

type EmployeeStatus = "ACTIVE" | "INACTIVE";
type ActivationStatus = "PENDING" | "ACTIVATED";

type Employee = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  employeeCode?: string;
  salaryInHand?: number;
  availableLimit?: number;
  status?: EmployeeStatus;
  activationStatus?: ActivationStatus;
};

type EmployeeForm = {
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  salaryInHand: string;
};

const initialForm: EmployeeForm = {
  employeeCode: "",
  name: "",
  email: "",
  phone: "",
  salaryInHand: "",
};

export function EmployeesPage() {
  const authUser = getAuthUser();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState<EmployeeForm>(initialForm);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | EmployeeStatus>(
    "ALL"
  );
  const [activationFilter, setActivationFilter] = useState<
    "ALL" | ActivationStatus
  >("ALL");
  const [error, setError] = useState("");

  async function fetchEmployees() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/employees");

      const data =
        response.data?.data?.data ||
        response.data?.data?.items ||
        response.data?.data ||
        response.data ||
        [];

      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      setError("Unable to load employees");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function handleCreateEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    if (!authUser?.employerId) {
      setFormError("Employer ID not found. Please login again.");
      return;
    }

    if (
      !form.employeeCode.trim() ||
      !form.name.trim() ||
      !form.email.trim() ||
      !form.salaryInHand.trim()
    ) {
      setFormError("Employee code, name, email and salary are required.");
      return;
    }

    const salary = Number(form.salaryInHand);

    if (!salary || salary <= 0) {
      setFormError("Salary in hand must be greater than 0.");
      return;
    }

    setCreating(true);

    try {
      await api.post("/employees", {
        employerId: authUser.employerId,
        employeeCode: form.employeeCode.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        salaryInHand: salary,
      });

      setSuccess("Employee added successfully.");
      setForm(initialForm);
      setModalOpen(false);
      await fetchEmployees();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to add employee";

      setFormError(Array.isArray(message) ? message[0] : message);
    } finally {
      setCreating(false);
    }
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const value =
        `${employee.name} ${employee.email} ${employee.phone} ${employee.employeeCode} ${employee.status} ${employee.activationStatus}`.toLowerCase();

      const matchesSearch = value.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || employee.status === statusFilter;
      const matchesActivation =
        activationFilter === "ALL" ||
        employee.activationStatus === activationFilter;

      return matchesSearch && matchesStatus && matchesActivation;
    });
  }, [employees, search, statusFilter, activationFilter]);

  const summary = useMemo(() => {
    return {
      total: employees.length,
      active: employees.filter((item) => item.status === "ACTIVE").length,
      inactive: employees.filter((item) => item.status === "INACTIVE").length,
      activated: employees.filter(
        (item) => item.activationStatus === "ACTIVATED"
      ).length,
    };
  }, [employees]);

  function formatAmount(value?: number) {
    if (!value) return "-";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function getStatusClass(status?: EmployeeStatus) {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "INACTIVE":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  }

  function getActivationClass(status?: ActivationStatus) {
    switch (status) {
      case "ACTIVATED":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Employees</p>
          <h2 className="mt-2 text-2xl font-black">Company Employees</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add employees, view salary advance limits, and track app activation
            status.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={fetchEmployees}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <button
            onClick={() => {
              setForm(initialForm);
              setFormError("");
              setSuccess("");
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      </section>

      {success && (
        <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Total Employees" value={summary.total} />
        <SummaryCard label="Active" value={summary.active} />
        <SummaryCard label="Inactive" value={summary.inactive} />
        <SummaryCard label="App Activated" value={summary.activated} />
      </section>

      <section className="rounded-[1.5rem] bg-white p-4 shadow-soft">
        <div className="grid gap-3 xl:grid-cols-[1fr_180px_220px]">
          <div className="relative">
            <Search
              className="absolute left-4 top-3.5 text-slate-400"
              size={18}
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee, email, phone..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "ALL" | EmployeeStatus)
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-50"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            value={activationFilter}
            onChange={(event) =>
              setActivationFilter(
                event.target.value as "ALL" | ActivationStatus
              )
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-50"
          >
            <option value="ALL">All Activation</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVATED">Activated</option>
          </select>
        </div>
      </section>

      {loading && (
        <div className="flex items-center gap-2 rounded-[1.5rem] bg-white p-6 text-sm font-semibold text-slate-500 shadow-soft">
          <Loader2 className="animate-spin text-primary" size={18} />
          Loading employees...
        </div>
      )}

      {error && (
        <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-6 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <section className="overflow-hidden rounded-[1.5rem] bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Salary In Hand</th>
                  <th className="px-5 py-4">Available Limit</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">App Activation</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                          <User size={18} />
                        </span>

                        <div>
                          <p className="font-bold text-slate-900">
                            {employee.name || "-"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {employee.email || "-"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {employee.phone || employee.employeeCode || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1 font-black text-slate-900">
                        <IndianRupee size={15} />
                        {formatAmount(employee.salaryInHand).replace("₹", "")}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1 font-black text-slate-900">
                        <IndianRupee size={15} />
                        {formatAmount(employee.availableLimit).replace("₹", "")}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          employee.status
                        )}`}
                      >
                        {employee.status || "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${getActivationClass(
                          employee.activationStatus
                        )}`}
                      >
                        {employee.activationStatus || "-"}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No employees found. Add your first employee to start
                      managing salary advance access.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={handleCreateEmployee}
            className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-soft"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black">Add Employee</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add an employee under your company. Salary limit will be
                  calculated automatically by backend rules.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {formError}
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input
                label="Employee Code"
                value={form.employeeCode}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, employeeCode: value }))
                }
                placeholder="EMP-1001"
              />

              <Input
                label="Full Name"
                value={form.name}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, name: value }))
                }
                placeholder="Employee name"
              />

              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, email: value }))
                }
                placeholder="employee@example.com"
              />

              <Input
                label="Phone"
                value={form.phone}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, phone: value }))
                }
                placeholder="Optional"
              />

              <Input
                label="Salary In Hand"
                type="number"
                value={form.salaryInHand}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, salaryInHand: value }))
                }
                placeholder="30000"
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating && <Loader2 className="animate-spin" size={16} />}
                {creating ? "Adding..." : "Add Employee"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-5 shadow-soft">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-2 text-2xl font-black text-slate-900">{value}</h3>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label>
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}
