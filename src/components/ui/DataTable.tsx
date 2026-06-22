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
    <div className="overflow-hidden rounded-xl border border-[#E4E4EF] bg-white">
      <div className="overflow-x-auto scrollbar-soft">
        <table className="min-w-full divide-y divide-[#E4E4EF] text-left text-[13px]">
          <thead className="bg-[#F0F0F8]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 text-[11px] font-[700] uppercase tracking-[0.06em] text-[#62657A] ${column.className ?? ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4EF]">
            {data.length ? (
              data.map((item, index) => (
                <tr key={index} className="hover:bg-[#F7F7FB] transition-colors">
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-3 text-[#191A2E] ${column.className ?? ""}`}>
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-[12px] text-[#62657A]" colSpan={columns.length}>
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
