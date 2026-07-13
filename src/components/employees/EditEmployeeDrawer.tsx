import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Employee } from "../../types/employee";

interface EditEmployeeDrawerProps {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSubmit: (
    employeeId: string,
    data: {
      employeeCode: string;
      name: string;
      email: string;
      phone: string;
      salaryInHand: number;
      employmentStatus: "ACTIVE" | "INACTIVE";
    }
  ) => Promise<void>;
}

export default function EditEmployeeDrawer({
  open,
  employee,
  onClose,
  onSubmit,
}: EditEmployeeDrawerProps) {
  const [employeeCode, setEmployeeCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [salaryInHand, setSalaryInHand] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<
    "ACTIVE" | "INACTIVE"
  >("ACTIVE");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employee) return;

    setEmployeeCode(employee.employeeCode);
    setName(employee.name);
    setEmail(employee.email);
    setPhone(employee.phone);
    setSalaryInHand(employee.salaryInHand);
    setEmploymentStatus(employee.employmentStatus);
  }, [employee]);

  if (!open || !employee) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);

      await onSubmit(employee.id, {
        employeeCode,
        name,
        email,
        phone,
        salaryInHand: Number(salaryInHand),
        employmentStatus,
      });

      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-edge">
          <div>
            <h2 className="text-lg font-semibold">Edit Employee</h2>

            <p className="text-sm text-ink-3 mt-1">
              Update employee information
            </p>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl border border-edge flex items-center justify-center hover:bg-surface-raised"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
        >
          <FormField
            label="Employee Code"
            value={employeeCode}
            disabled
            helperText="Employee code cannot be changed. Please contact support."
            onChange={setEmployeeCode}
          />

          <FormField label="Full Name" value={name} onChange={setName} />

          <FormField
            label="Email"
            value={email}
            disabled
            helperText="Email Id cannot be changed. Please contact support."
            onChange={setEmail}
          />

          <FormField label="Phone Number" value={phone} onChange={setPhone} />

          <FormField
            label="Salary In Hand"
            type="number"
            value={salaryInHand}
            onChange={setSalaryInHand}
          />

          <div>
            <label className="block text-sm font-medium text-ink-3 mb-2">
              Employment Status
            </label>

            <select
              value={employmentStatus}
              onChange={(e) =>
                setEmploymentStatus(e.target.value as "ACTIVE" | "INACTIVE")
              }
              className="w-full px-4 py-3 text-sm border border-edge rounded-xl"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="pt-6 border-t border-edge flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-edge"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-brand text-white"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  helperText?: string;
  onChange: (value: string) => void;
}

function FormField({
  label,
  value,
  placeholder,
  type = "text",
  disabled = false,
  helperText,
  onChange,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-3 mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`
            w-full
            px-4
            py-3
            text-sm
            border
            border-edge
            rounded-xl
            ${disabled ? "bg-surface-raised text-ink-3 cursor-not-allowed" : ""}
          `}
      />

      {helperText && (
        <p className="mt-2 text-xs text-ink-3">{helperText}</p>
      )}
    </div>
  );
}
