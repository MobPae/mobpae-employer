export function exportToCsv<T extends Record<string, unknown>>(rows: T[], filename: string) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const escape  = (v: unknown) => {
    let s = v == null ? "" : String(v);
    // Neutralize CSV/formula injection: Excel/Sheets treat leading =,+,-,@,tab,CR
    // as a formula trigger, so prefix with a benign apostrophe to force text.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const csv = [
    headers.join(","),
    ...rows.map(row => headers.map(h => escape(row[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
