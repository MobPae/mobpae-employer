import type { EmployeePayload, EmploymentStatus } from "../types";

export const SAMPLE_BULK_EMPLOYEE_ROWS = [
  "EMP-001,Arjun Sharma,arjun@company.com,+91 98765 11111,54000,ACTIVE,false,Engineering",
  "EMP-002,Priya Nair,priya@company.com,+91 98765 22222,62000,ACTIVE,true,Finance",
].join("\n");

export const MAX_BULK_FILE_SIZE_MB = 2;

const isStatus = (v: string): v is EmploymentStatus => v === "ACTIVE" || v === "INACTIVE";
const parseBool = (v: string) => ["true", "yes", "1"].includes(v.trim().toLowerCase());

// A plain `line.split(",")` breaks on a quoted field like "50,000" — it treats
// the comma inside the quotes as a column separator too, shifting every field
// after it. This respects double-quoted fields (and "" as an escaped quote),
// same as a real CSV parser would.
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

export interface ParsedRow { payload: EmployeePayload; row: number; errors: string[] }

export function parseRows(raw: string): ParsedRow[] {
  const rows = raw
    .split("\n")
    .map((line, i) => ({ line: line.trim(), row: i + 1 }))
    .filter(({ line }) => line.length > 0)
    .map(({ line, row }) => {
      const [code = "", name = "", email = "", phone = "", salary = "", status = "ACTIVE", app = "false", dept = ""] =
        splitCsvLine(line);
      // Strip thousands-separator commas (e.g. "50,000") before parsing —
      // otherwise Number() silently returns NaN and the row just fails
      // validation with no hint as to why.
      const salaryNum = Number(salary.replace(/,/g, ""));
      const empStatus = status.toUpperCase();
      const errors: string[] = [];
      if (!code)                                    errors.push("code required");
      if (!name)                                    errors.push("name required");
      if (!email.includes("@"))                     errors.push("valid email required");
      if (!phone)                                   errors.push("phone required");
      if (!Number.isFinite(salaryNum) || salaryNum <= 0) errors.push("salary must be positive (remove commas)");
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

  // Flag duplicate employee codes within this same paste/file — the backend
  // would reject them anyway, better to catch it before submitting.
  const codeCounts = new Map<string, number>();
  rows.forEach(r => {
    const key = r.payload.employeeCode.toLowerCase();
    if (key) codeCounts.set(key, (codeCounts.get(key) ?? 0) + 1);
  });
  rows.forEach(r => {
    const key = r.payload.employeeCode.toLowerCase();
    if (key && (codeCounts.get(key) ?? 0) > 1) r.errors.push("duplicate code in this file");
  });

  return rows;
}
