import { AlertCircle, CheckCircle2, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import type { BulkEmployeeUploadResult, EmployeePayload, EmploymentStatus } from "../../types";
import { formatCurrency } from "../../utils/formatters";

const SAMPLE = [
  "EMP-001,Arjun Sharma,arjun@company.com,+91 98765 11111,54000,ACTIVE,false,Engineering",
  "EMP-002,Priya Nair,priya@company.com,+91 98765 22222,62000,ACTIVE,true,Finance",
].join("\n");

const isStatus = (v: string): v is EmploymentStatus => v === "ACTIVE" || v === "INACTIVE";
const parseBool = (v: string) => ["true", "yes", "1"].includes(v.trim().toLowerCase());

interface ParsedRow { payload: EmployeePayload; row: number; errors: string[] }

function parseRows(raw: string): ParsedRow[] {
  return raw
    .split("\n")
    .map((line, i) => ({ line: line.trim(), row: i + 1 }))
    .filter(({ line }) => line.length > 0)
    .map(({ line, row }) => {
      const [code = "", name = "", email = "", phone = "", salary = "", status = "ACTIVE", app = "false", dept = ""] =
        line.split(",").map(c => c.trim());
      const salaryNum = Number(salary);
      const empStatus = status.toUpperCase();
      const errors: string[] = [];
      if (!code)                                    errors.push("code required");
      if (!name)                                    errors.push("name required");
      if (!email.includes("@"))                     errors.push("valid email required");
      if (!phone)                                   errors.push("phone required");
      if (!Number.isFinite(salaryNum) || salaryNum <= 0) errors.push("salary must be positive");
      if (!isStatus(empStatus))                     errors.push("status: ACTIVE or INACTIVE");
      return {
        row,
        errors,
        payload: {
          employeeCode: code, name, email, phone,
          salaryInHand: Number.isFinite(salaryNum) ? salaryNum : 0,
          employmentStatus: isStatus(empStatus) ? empStatus : "ACTIVE",
          appActivated: parseBool(app),
          department: dept,
        },
      };
    });
}

export function BulkEmployeeForm({ onSubmit }: { onSubmit: (p: EmployeePayload[]) => Promise<BulkEmployeeUploadResult | void> }) {
  const [raw, setRaw]     = useState(SAMPLE);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);

  const rows   = useMemo(() => parseRows(raw), [raw]);
  const valid  = rows.filter(r => r.errors.length === 0);
  const hasErr = rows.some(r => r.errors.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid.length || hasErr) return;
    setSaving(true);
    try { await onSubmit(valid.map(r => r.payload)); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info */}
      <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
        <p className="text-[12px] font-[600] text-slate-800">CSV format</p>
        <p className="text-[11px] text-slate-500 mt-1 font-mono leading-relaxed">
          code, name, email, phone, salary, status, appActivated, department
        </p>
      </div>

      {/* Upload */}
      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-6 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
        <UploadCloud size={20} className="text-slate-400" />
        <span className="text-[12px] font-[500] text-slate-600">{fileName || "Choose CSV file"}</span>
        <span className="text-[11px] text-slate-400">or paste rows below</span>
        <input
          type="file" accept=".csv,text/csv" className="sr-only"
          onChange={e => {
            const f = e.target.files?.[0];
            if (!f) return;
            setFileName(f.name);
            const reader = new FileReader();
            reader.onload = () => setRaw(String(reader.result ?? ""));
            reader.readAsText(f);
          }}
        />
      </label>

      {/* Textarea */}
      <div>
        <label className="block text-[11px] font-[500] text-slate-500 mb-1">Employee rows</label>
        <textarea
          value={raw}
          onChange={e => setRaw(e.target.value)}
          rows={5}
          className="w-full px-3 py-2.5 text-[12px] font-mono bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y transition"
        />
      </div>

      {/* Summary */}
      <div className="flex gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-[12px] font-[500] text-emerald-700">
          <CheckCircle2 size={13} />{valid.length} valid
        </span>
        {hasErr && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 text-[12px] font-[500] text-red-600">
            <AlertCircle size={13} />Fix errors before importing
          </span>
        )}
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto border border-slate-100 rounded-lg">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Row", "Employee", "Email", "Salary", "Validation"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-[500] text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(r => (
                <tr key={r.row} className={r.errors.length ? "bg-red-50/40" : ""}>
                  <td className="px-3 py-2 text-slate-400">{r.row}</td>
                  <td className="px-3 py-2">
                    <p className="font-[500] text-slate-700">{r.payload.name || "—"}</p>
                    <p className="text-slate-400">{r.payload.employeeCode || "—"}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{r.payload.email || "—"}</td>
                  <td className="px-3 py-2 text-slate-600 tabular-nums">{formatCurrency(r.payload.salaryInHand)}</td>
                  <td className="px-3 py-2">
                    {r.errors.length ? (
                      <span className="text-red-600 font-[500]">{r.errors.join(", ")}</span>
                    ) : (
                      <span className="text-emerald-600 font-[500]">Ready</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !valid.length || hasErr}
        className="w-full h-10 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-[13px] font-[600] transition disabled:opacity-40"
      >
        {saving ? "Importing…" : `Import ${valid.length} employee${valid.length !== 1 ? "s" : ""}`}
      </button>
    </form>
  );
}
