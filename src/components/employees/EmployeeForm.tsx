import { useState } from "react";
import type { Employee, EmployeePayload, EmploymentStatus } from "../../types";

const empty: EmployeePayload = {
  employeeCode: "",
  name: "",
  email: "",
  phone: "",
  salaryInHand: 0,
  employmentStatus: "ACTIVE",
  appActivated: false,
  department: "",
};

function validateSalary(v: number): string | null {
  if (!v || v <= 0) return "Salary must be greater than zero";
  return null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-[500] text-[#62657A] mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full h-9 px-3 text-[13px] bg-white border border-[#E4E4EF] rounded-lg text-[#191A2E] placeholder-[#B7B9C7] focus:outline-none focus:border-[#7679FF] focus:ring-2 focus:ring-[#7679FF]/10 transition";
const selectCls = inputCls + " appearance-none cursor-pointer";

export function EmployeeForm({ employee, onSubmit }: { employee?: Employee; onSubmit: (p: EmployeePayload) => Promise<void> }) {
  const [form, setForm]         = useState<EmployeePayload>(employee ?? empty);
  const [salaryErr, setSalaryErr] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

  const set = <K extends keyof EmployeePayload>(k: K, v: EmployeePayload[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sErr = validateSalary(form.salaryInHand);
    setSalaryErr(sErr);
    if (sErr) return;
    setSaving(true);
    try { await onSubmit(form); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Employee code">
          <input className={inputCls} value={form.employeeCode} onChange={e => set("employeeCode", e.target.value)} required placeholder="EMP-001" />
        </Field>
        <Field label="Full name">
          <input className={inputCls} value={form.name} onChange={e => set("name", e.target.value)} required placeholder="Arjun Sharma" />
        </Field>
      </div>

      <Field label="Email">
        <input className={inputCls} type="email" value={form.email} onChange={e => set("email", e.target.value)} required placeholder="arjun@company.com" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
          <input className={inputCls} value={form.phone} onChange={e => set("phone", e.target.value)} required placeholder="+91 98765 00000" />
        </Field>
        <Field label="Salary in hand (₹)">
          <input
            className={`${inputCls}${salaryErr ? " border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
            type="number"
            min={1}
            value={form.salaryInHand || ""}
            onChange={e => {
              const v = Number(e.target.value);
              set("salaryInHand", v);
              setSalaryErr(validateSalary(v));
            }}
            required
            placeholder="50000"
          />
          {salaryErr && <p className="text-[11px] text-red-600 mt-1">{salaryErr}</p>}
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Department">
          <input className={inputCls} value={form.department} onChange={e => set("department", e.target.value)} placeholder="Engineering" />
        </Field>
        <Field label="Employment status">
          <select className={selectCls} value={form.employmentStatus} onChange={e => set("employmentStatus", e.target.value as EmploymentStatus)}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
      </div>

      {/* App access toggle */}
      <div className="flex items-center justify-between bg-[#F7F7FB] border border-[#E4E4EF] rounded-lg px-4 py-3">
        <div>
          <p className="text-[13px] font-[500] text-[#191A2E]">App access</p>
          <p className="text-[11px] text-[#62657A] mt-0.5">Allow employee to use the MobPae app</p>
        </div>
        <button
          type="button"
          onClick={() => set("appActivated", !form.appActivated)}
          style={{ width: 36, height: 20 }}
          className={`relative inline-flex items-center rounded-full transition-colors flex-shrink-0 ${form.appActivated ? "bg-[#7679FF]" : "bg-[#E4E4EF]"}`}
        >
          <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transition-transform ${form.appActivated ? "translate-x-[17px]" : "translate-x-[2px]"}`} />
        </button>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full h-10 rounded-lg bg-[#7679FF] hover:bg-[#5659D9] text-white text-[13px] font-[600] transition disabled:opacity-50"
      >
        {saving ? "Saving…" : employee ? "Save changes" : "Add employee"}
      </button>
    </form>
  );
}
