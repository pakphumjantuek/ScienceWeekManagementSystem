import TablePagination from "@mui/material/TablePagination";
import type { ChangeEvent, ReactNode } from "react";

type Align = "left" | "center" | "right";

type AdminCrudColumn<T> = {
  key: string;
  header: string;
  align?: Align;
  renderCell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

type AdminCrudTableProps<T> = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  columns: AdminCrudColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyMessage: string;
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (_: unknown, page: number) => void;
  onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: number[];
  labelRowsPerPage?: string;
};

const ALIGN_CLASS: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function AdminCrudTable<T>({
  title,
  subtitle,
  actions,
  columns,
  rows,
  rowKey,
  emptyMessage,
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25, 50],
  labelRowsPerPage = "จำนวนรายการต่อหน้า",
}: AdminCrudTableProps<T>) {
  const pagedRows = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <div className="w-full font-sarabun">
      <div className="w-full overflow-hidden rounded-2xl border border-slate-300/80 bg-slate-100/75 shadow-sm backdrop-blur-sm">
        <div className="border-b border-slate-300/80 px-4 pb-4 pt-6 md:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-base text-slate-600">{subtitle}</p>
          )}
          {actions && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-base text-slate-900">
            <thead className="bg-blue-700/90 text-white">
              <tr>
                {columns.map((column, index) => {
                  const isLast = index === columns.length - 1;
                  const alignClass = ALIGN_CLASS[column.align ?? "left"];
                  return (
                    <th
                      key={column.key}
                      className={`border-b border-slate-300 px-6 py-3.5 text-sm font-semibold uppercase ${alignClass} ${!isLast ? "border-r" : ""} ${column.headerClassName ?? ""}`}
                    >
                      {column.header}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="[&>tr:nth-child(odd)]:bg-slate-50/40 [&>tr:nth-child(even)]:bg-slate-100/70 [&>tr:hover]:bg-slate-100/80">
              {pagedRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="transition-colors hover:bg-slate-50"
                >
                  {columns.map((column, index) => {
                    const isLast = index === columns.length - 1;
                    const alignClass = ALIGN_CLASS[column.align ?? "left"];
                    return (
                      <td
                        key={column.key}
                        className={`border-b border-slate-300 px-6 py-3.5 ${alignClass} ${!isLast ? "border-r" : ""} ${column.cellClassName ?? ""}`}
                      >
                        {column.renderCell(row)}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="border-b border-slate-300 px-6 py-12 text-center text-slate-600"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/90 px-4 py-2">
          <TablePagination
            component="div"
            sx={{
              color: "#334155",
              ".MuiTablePagination-toolbar": {
                backgroundColor: "rgba(241, 245, 249, 0.7)",
                borderRadius: 1,
              },
            }}
            count={count}
            page={page}
            onPageChange={onPageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={onRowsPerPageChange}
            rowsPerPageOptions={rowsPerPageOptions}
            labelRowsPerPage={labelRowsPerPage}
          />
        </div>
      </div>
    </div>
  );
}
