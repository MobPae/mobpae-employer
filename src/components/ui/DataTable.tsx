import type { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: ReactNode;
  render: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T>({ columns, data, emptyMessage = "No records found." }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-edge-2 text-left text-sm">
          <thead className="bg-surface-raised">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-2xs font-semibold uppercase tracking-[0.07em] text-ink-4 ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-edge-2">
            {data.length ? (
              data.map((item, i) => (
                <tr key={i} className="transition-colors hover:bg-surface-raised">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-ink ${col.className ?? ""}`}>
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-12 text-center text-sm text-ink-3" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
