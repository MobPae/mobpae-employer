import { X } from "lucide-react";
import { useState } from "react";

interface AddEmployeeDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    employeeCode: string;
    name: string;
    email: string;
    phone: string;
    salaryInHand: number;
  }) => Promise<void>;
}

export default function AddEmployeeDrawer({
  open,
  onClose,
  onSubmit,
}: AddEmployeeDrawerProps) {
  const [employeeCode, setEmployeeCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [salaryInHand, setSalaryInHand] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);

      await onSubmit({
        employeeCode,
        name,
        email,
        phone,
        salaryInHand: Number(salaryInHand),
      });

      setEmployeeCode("");
      setName("");
      setEmail("");
      setPhone("");
      setSalaryInHand("");

      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="
          fixed
          top-0
          right-0
          h-screen
          w-full
          max-w-md
          bg-white
          shadow-2xl
          z-50
          flex
          flex-col
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Add Employee
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Create a new employee account
            </p>
          </div>

          <button
            onClick={onClose}
            className="
              h-9
              w-9
              rounded-xl
              border
              border-slate-200
              flex
              items-center
              justify-center
              hover:bg-slate-50
            "
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
        >
          <FormField
            label="Employee Code"
            value={employeeCode}
            onChange={setEmployeeCode}
            placeholder="EMP006"
          />

          <FormField
            label="Full Name"
            value={name}
            onChange={setName}
            placeholder="Amit Kumar"
          />

          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="amit@xyz.com"
          />

          <FormField
            label="Phone Number"
            value={phone}
            onChange={setPhone}
            placeholder="9999999999"
          />

          <FormField
            label="Salary In Hand"
            type="number"
            value={salaryInHand}
            onChange={setSalaryInHand}
            placeholder="50000"
          />

          {/* Footer */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="
                px-4
                py-2
                rounded-xl
                border
                border-slate-200
                text-sm
                font-medium
                hover:bg-slate-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="
                px-4
                py-2
                rounded-xl
                bg-blue-600
                text-white
                text-sm
                font-medium
                hover:bg-blue-700
                disabled:opacity-50
              "
            >
              {loading ? "Adding..." : "Add Employee"}
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
  onChange: (value: string) => void;
}

function FormField({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
          px-4
          py-3
          text-sm
          border
          border-slate-200
          rounded-xl
          focus:outline-none
          focus:ring-2
          focus:ring-blue-100
          focus:border-blue-500
        "
      />
    </div>
  );
}
