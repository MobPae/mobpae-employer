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
    <div className="overflow-hidden rounded-lg border border-blue-100 bg-white">
      <div className="overflow-x-auto scrollbar-soft">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-blue-50/70">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 text-xs font-semibold uppercase text-blue-700/70 ${column.className ?? ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {data.length ? (
              data.map((item, index) => (
                <tr key={index} className="hover:bg-blue-50/45">
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-3 text-slate-700 ${column.className ?? ""}`}>
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={columns.length}>
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
