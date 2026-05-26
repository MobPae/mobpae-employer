import { useEffect, useMemo, useState } from "react";
import { IndianRupee, Loader2, RefreshCcw, Search, User } from "lucide-react";
import { api } from "../services/api";

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

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
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
            View employees linked to your company, their salary advance limits,
            and app activation status.
          </p>
        </div>

        <button
          onClick={fetchEmployees}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </section>

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
                      No employees found. Employees will appear here once they
                      are added/imported for your company.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
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
