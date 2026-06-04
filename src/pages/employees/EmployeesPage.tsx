import { Plus, Upload, Search } from "lucide-react";

export default function EmployeesPage() {
  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="flex flex-wrap gap-3">
        <StatChip label="Total Employees" value="124" color="blue" />

        <StatChip label="Active" value="118" color="green" />

        <StatChip label="Inactive" value="6" color="red" />

        <StatChip label="Outstanding" value="₹42K" color="indigo" />
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search employee..."
              className="
                w-full
                pl-10
                pr-4
                py-2
                text-sm
                border
                border-slate-200
                rounded-xl
                focus:outline-none
                focus:ring-2
                focus:ring-blue-100
              "
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              className="
                flex items-center gap-2
                px-4 py-2
                border border-slate-200
                rounded-xl
                text-sm
                hover:bg-slate-50
              "
            >
              <Upload size={16} />
              Import CSV
            </button>

            <button
              className="
                flex items-center gap-2
                px-4 py-2
                bg-blue-600
                text-white
                rounded-xl
                text-sm
                hover:bg-blue-700
              "
            >
              <Plus size={16} />
              Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                ID
              </th>

              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                Employee
              </th>

              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                Salary
              </th>

              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                Limit
              </th>

              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                Outstanding
              </th>

              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                Status
              </th>

              <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            <EmployeeRow
              employeeId="EMP001"
              name="Rahul Sharma"
              email="rahul@xyz.com"
              salary="₹25,000"
              limit="₹10,000"
              outstanding="₹2,500"
              status="ACTIVE"
            />

            <EmployeeRow
              employeeId="EMP002"
              name="Priya Verma"
              email="priya@xyz.com"
              salary="₹30,000"
              limit="₹12,000"
              outstanding="-"
              status="ACTIVE"
            />

            <EmployeeRow
              employeeId="EMP003"
              name="Amit Singh"
              email="amit@xyz.com"
              salary="₹18,000"
              limit="₹7,200"
              outstanding="-"
              status="INACTIVE"
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const styles: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    indigo: "bg-indigo-50 text-indigo-700",
  };

  return (
    <div
      className={`
        flex items-center gap-2
        px-3 py-1.5
        rounded-full
        text-sm
        font-medium
        ${styles[color]}
      `}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function EmployeeRow({
  employeeId,
  name,
  email,
  salary,
  limit,
  outstanding,
  status,
}: {
  employeeId: string;
  name: string;
  email: string;
  salary: string;
  limit: string;
  outstanding: string;
  status: string;
}) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <span className="text-xs font-medium text-slate-500">{employeeId}</span>
      </td>

      <td className="px-4 py-3">
        <div>
          <div className="text-sm font-medium text-slate-900">{name}</div>

          <div className="text-[11px] text-slate-500">{email}</div>
        </div>
      </td>

      <td className="px-4 py-3 text-sm font-medium text-slate-900">{salary}</td>

      <td className="px-4 py-3 text-sm text-slate-700">{limit}</td>

      <td className="px-4 py-3 text-sm text-slate-700">{outstanding}</td>

      <td className="px-4 py-3">
        <span
          className={
            status === "ACTIVE"
              ? "inline-flex px-2 py-1 rounded-full text-[11px] font-medium bg-green-100 text-green-700"
              : "inline-flex px-2 py-1 rounded-full text-[11px] font-medium bg-red-100 text-red-700"
          }
        >
          {status}
        </span>
      </td>

      <td className="px-4 py-3 text-right">
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
          View
        </button>
      </td>
    </tr>
  );
}
