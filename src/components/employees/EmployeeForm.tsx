import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import type { Employee, EmployeePayload, EmploymentStatus } from "../../types";

const emptyPayload: EmployeePayload = {
  employeeCode: "",
  name: "",
  email: "",
  phone: "",
  salaryInHand: 0,
  employmentStatus: "ACTIVE",
  appActivated: false,
  department: ""
};

export function EmployeeForm({
  employee,
  onSubmit
}: {
  employee?: Employee;
  onSubmit: (payload: EmployeePayload) => Promise<void>;
}) {
  const [payload, setPayload] = useState<EmployeePayload>(employee ?? emptyPayload);
  const [saving, setSaving] = useState(false);

  const setField = <K extends keyof EmployeePayload>(key: K, value: EmployeePayload[K]) => {
    setPayload((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        await onSubmit(payload);
        setSaving(false);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Employee code" value={payload.employeeCode} onChange={(event) => setField("employeeCode", event.target.value)} required />
        <Input label="Full name" value={payload.name} onChange={(event) => setField("name", event.target.value)} required />
      </div>
      <Input label="Email" type="email" value={payload.email} onChange={(event) => setField("email", event.target.value)} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Phone" value={payload.phone} onChange={(event) => setField("phone", event.target.value)} required />
        <Input
          label="Salary in hand"
          type="number"
          min={0}
          value={payload.salaryInHand}
          onChange={(event) => setField("salaryInHand", Number(event.target.value))}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Department" value={payload.department} onChange={(event) => setField("department", event.target.value)} required />
        <Select
          label="Employment status"
          value={payload.employmentStatus}
          onChange={(event) => setField("employmentStatus", event.target.value as EmploymentStatus)}
          options={[
            { label: "Active", value: "ACTIVE" },
            { label: "Inactive", value: "INACTIVE" }
          ]}
        />
      </div>
      <label className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm font-semibold text-blue-900">
        App access activated
        <input
          className="h-5 w-5 accent-slate-950"
          type="checkbox"
          checked={payload.appActivated}
          onChange={(event) => setField("appActivated", event.target.checked)}
        />
      </label>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : employee ? "Save employee" : "Create employee"}
      </Button>
    </form>
  );
}
