import React from "react";

export interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface FeedTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function FeedTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "Tidak ada data tersedia",
  className = "",
}: FeedTableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-xl border-[1.5px] border-border-card bg-surface-card ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-[1.5px] border-border-subtle bg-slate-50">
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-content-secondary ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-sm text-content-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-slate-50 transition-colors"
              >
                {columns.map((col, cIdx) => (
                  <td
                    key={cIdx}
                    className={`py-3 px-4 text-sm text-content-primary align-middle min-h-touch ${col.className || ""}`}
                  >
                    {col.accessor(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
