import { AlertCircle, CheckCircle2, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import type { BulkEmployeeUploadResult, EmployeePayload } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { MAX_BULK_FILE_SIZE_MB, parseRows, SAMPLE_BULK_EMPLOYEE_ROWS } from "../../utils/bulkEmployeeParser";

export function BulkEmployeeForm({ onSubmit }: { onSubmit: (p: EmployeePayload[]) => Promise<BulkEmployeeUploadResult | void> }) {
  const [raw, setRaw]     = useState(SAMPLE_BULK_EMPLOYEE_ROWS);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
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
      <div className="bg-surface-raised border border-edge rounded-lg px-4 py-3">
        <p className="text-[12px] font-[600] text-ink">CSV format</p>
        <p className="text-[11px] text-ink-3 mt-1 font-mono leading-relaxed">
          code, name, email, phone, salary, status, appActivated, department
        </p>
      </div>

      {/* Upload */}
      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-edge rounded-xl py-6 cursor-pointer hover:border-brand hover:bg-brand-soft/30 transition-colors">
        <UploadCloud size={20} className="text-ink-3" />
        <span className="text-[12px] font-[500] text-ink-3">{fileName || "Choose CSV file"}</span>
        <span className="text-[11px] text-ink-3">or paste rows below</span>
        <input
          type="file" accept=".csv,text/csv" className="sr-only"
          onChange={e => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > MAX_BULK_FILE_SIZE_MB * 1024 * 1024) {
              setFileError(`"${f.name}" is larger than ${MAX_BULK_FILE_SIZE_MB}MB — split it into smaller files.`);
              e.target.value = "";
              return;
            }
            setFileError("");
            setFileName(f.name);
            const reader = new FileReader();
            reader.onload = () => setRaw(String(reader.result ?? ""));
            reader.readAsText(f);
          }}
        />
      </label>
      {fileError && (
        <p className="flex items-center gap-1.5 text-[11px] font-[500] text-danger">
          <AlertCircle size={12} className="flex-shrink-0" /> {fileError}
        </p>
      )}

      {/* Textarea */}
      <div>
        <label className="block text-[11px] font-[500] text-ink-3 mb-1">Employee rows</label>
        <textarea
          value={raw}
          onChange={e => setRaw(e.target.value)}
          rows={5}
          className="w-full px-3 py-2.5 text-[12px] font-mono bg-white border border-edge rounded-lg text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 resize-y transition"
        />
      </div>

      {/* Summary */}
      <div className="flex gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-soft text-[12px] font-[500] text-brand">
          <CheckCircle2 size={13} />{valid.length} valid
        </span>
        {hasErr && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-danger-soft text-[12px] font-[500] text-danger">
            <AlertCircle size={13} />Fix errors before importing
          </span>
        )}
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto border border-edge rounded-lg">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-edge bg-surface-raised">
                {["Row", "Employee", "Email", "Salary", "Validation"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-[500] text-ink-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-edge-2">
              {rows.map(r => (
                <tr key={r.row} className={r.errors.length ? "bg-danger-soft/40" : ""}>
                  <td className="px-3 py-2 text-ink-3">{r.row}</td>
                  <td className="px-3 py-2">
                    <p className="font-[500] text-ink-3">{r.payload.name || "—"}</p>
                    <p className="text-ink-3">{r.payload.employeeCode || "—"}</p>
                  </td>
                  <td className="px-3 py-2 text-ink-3">{r.payload.email || "—"}</td>
                  <td className="px-3 py-2 text-ink-3 tabular-nums">{formatCurrency(r.payload.salaryInHand)}</td>
                  <td className="px-3 py-2">
                    {r.errors.length ? (
                      <span className="text-danger font-[500]">{r.errors.join(", ")}</span>
                    ) : (
                      <span className="text-brand font-[500]">Ready</span>
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
        className="w-full h-10 rounded-lg bg-brand hover:bg-brand-hover text-white text-[13px] font-[600] transition disabled:opacity-40"
      >
        {saving ? "Importing…" : `Import ${valid.length} employee${valid.length !== 1 ? "s" : ""}`}
      </button>
    </form>
  );
}
