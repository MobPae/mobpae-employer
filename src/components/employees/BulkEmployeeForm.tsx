import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, UploadCloud } from "lucide-react";
import { Button } from "../ui/Button";
import { DataTable } from "../ui/DataTable";
import { StatusBadge } from "../ui/StatusBadge";
import type { EmployeePayload, EmploymentStatus } from "../../types";
import { formatCurrency } from "../../utils/formatters";

const sampleRows = [
  "NR-2001,Rohan Kapoor,rohan.kapoor@nimbusretail.com,+91 98765 11111,54000,ACTIVE,false,Store Operations",
  "NR-2002,Neha Menon,neha.menon@nimbusretail.com,+91 98765 22222,62000,ACTIVE,true,Finance"
].join("\n");

interface ParsedBulkEmployee {
  payload: EmployeePayload;
  rowNumber: number;
  errors: string[];
}

const isEmploymentStatus = (value: string): value is EmploymentStatus =>
  value === "ACTIVE" || value === "INACTIVE";

const parseBoolean = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1";
};

const parseRows = (value: string): ParsedBulkEmployee[] => {
  return value
    .split("\n")
    .map((row, index) => ({ row, rowNumber: index + 1 }))
    .filter(({ row }) => row.trim().length > 0)
    .map(({ row, rowNumber }) => {
      const [employeeCode = "", name = "", email = "", phone = "", salary = "", status = "ACTIVE", appActivated = "false", department = ""] =
        row.split(",").map((cell) => cell.trim());
      const salaryInHand = Number(salary);
      const employmentStatus = status.toUpperCase();
      const errors: string[] = [];

      if (!employeeCode) errors.push("employeeCode required");
      if (!name) errors.push("name required");
      if (!email.includes("@")) errors.push("valid email required");
      if (!phone) errors.push("phone required");
      if (!Number.isFinite(salaryInHand) || salaryInHand <= 0) errors.push("salaryInHand must be positive");
      if (!isEmploymentStatus(employmentStatus)) errors.push("status must be ACTIVE or INACTIVE");
      if (!department) errors.push("department required");

      return {
        rowNumber,
        errors,
        payload: {
          employeeCode,
          name,
          email,
          phone,
          salaryInHand: Number.isFinite(salaryInHand) ? salaryInHand : 0,
          employmentStatus: isEmploymentStatus(employmentStatus) ? employmentStatus : "ACTIVE",
          appActivated: parseBoolean(appActivated),
          department
        }
      };
    });
};

export function BulkEmployeeForm({
  onSubmit
}: {
  onSubmit: (payloads: EmployeePayload[]) => Promise<void>;
}) {
  const [rawRows, setRawRows] = useState(sampleRows);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const parsedRows = useMemo(() => parseRows(rawRows), [rawRows]);
  const validRows = parsedRows.filter((row) => row.errors.length === 0);
  const hasErrors = parsedRows.some((row) => row.errors.length > 0);

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!validRows.length || hasErrors) {
          return;
        }

        setSaving(true);
        await onSubmit(validRows.map((row) => row.payload));
        setSaving(false);
      }}
    >
      <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
        <p className="text-sm font-semibold text-slate-950">Upload a CSV or paste employee rows</p>
        <p className="mt-1 text-sm leading-5 text-slate-500">
          Format: employeeCode, name, email, phone, salaryInHand, employmentStatus, appActivated, department
        </p>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-blue-200 bg-white px-4 py-6 text-center transition hover:bg-blue-50/60">
        <UploadCloud className="text-blue-600" size={24} />
        <span className="text-sm font-semibold text-slate-950">
          {uploadedFileName || "Choose CSV file"}
        </span>
        <span className="text-xs text-slate-500">CSV content will populate the rows below for review before import.</span>
        <input
          className="sr-only"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (!file) {
              return;
            }

            setUploadedFileName(file.name);
            const reader = new FileReader();
            reader.onload = () => setRawRows(String(reader.result ?? ""));
            reader.readAsText(file);
          }}
        />
      </label>

      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        Employee CSV rows
        <textarea
          className="min-h-40 w-full rounded-md border border-blue-100 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          value={rawRows}
          onChange={(event) => setRawRows(event.target.value)}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">
          <CheckCircle2 size={16} />
          {validRows.length} valid
        </span>
        {hasErrors ? (
          <span className="inline-flex items-center gap-2 rounded-md bg-rose-50 px-3 py-2 font-semibold text-rose-700">
            <AlertCircle size={16} />
            Fix rows before importing
          </span>
        ) : null}
      </div>

      <DataTable
        data={parsedRows}
        emptyMessage="Paste at least one employee row."
        columns={[
          { key: "row", header: "Row", render: (row) => row.rowNumber },
          { key: "employee", header: "Employee", render: (row) => <div><p className="font-semibold text-slate-950">{row.payload.name || "-"}</p><p className="text-xs text-slate-500">{row.payload.employeeCode || "-"}</p></div> },
          { key: "email", header: "Email", render: (row) => row.payload.email || "-" },
          { key: "salary", header: "Salary", render: (row) => formatCurrency(row.payload.salaryInHand) },
          { key: "status", header: "Status", render: (row) => <StatusBadge status={row.payload.employmentStatus} /> },
          { key: "result", header: "Validation", render: (row) => row.errors.length ? <span className="text-xs font-semibold text-rose-600">{row.errors.join(", ")}</span> : <span className="text-xs font-semibold text-emerald-700">Ready</span> }
        ]}
      />

      <Button type="submit" disabled={saving || !validRows.length || hasErrors}>
        {saving ? "Importing..." : `Import ${validRows.length} Employees`}
      </Button>
    </form>
  );
}
