import { Loading } from "../../../components/Loading";
import { useGetAllYearQuery } from "../../Year/YearApi";
import { withStaffAuth } from "../../../HOC";
import { useNavigate } from "react-router-dom";
import { usePagination } from "../../../utils/usePagination";
import TablePagination from "@mui/material/TablePagination";
import { useMemo } from "react";

const StaffYearList = () => {
  const { data: years = [], isLoading } = useGetAllYearQuery();
  const navigate = useNavigate();

  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  const pagedYears = useMemo(
    () => years.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [years, page, rowsPerPage],
  );

  if (isLoading) return <Loading />;

  return (
    <div className="w-full space-y-6 font-sarabun">
      <div className="w-full overflow-hidden rounded-2xl border border-slate-300/80 bg-slate-100/75 shadow-sm backdrop-blur-sm">
        <div className="border-b border-slate-300/80 px-4 pb-4 pt-6 md:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
            ปีการแข่งขัน (สิทธิ์เจ้าหน้าที่)
          </h1>
          <p className="mt-1 text-base text-slate-600">
            ดูรายการปีการแข่งขันทั้งหมดและกิจกรรมที่จัดการแข่งขัน
          </p>
        </div>

        {/* ===== Mobile: Card list ===== */}
        <div className="divide-y divide-slate-200 md:hidden">
          {pagedYears.length === 0 ? (
            <div className="px-4 py-12 text-center text-slate-600">
              ไม่มีรายการปีการแข่งขัน
            </div>
          ) : (
            pagedYears.map((year) => (
              <div key={year.yearID ?? ""} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-semibold">
                      {year.yearName}
                    </div>
                    <div className="text-sm text-slate-600">
                      ปี: {year.yearNumber}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      เลขรันเกียรติบัตรล่าสุด:{" "}
                      {year.minCertificateNumber && year.maxCertificateNumber
                        ? `เริ่มจาก ${year.minCertificateNumber} ถึง ${year.maxCertificateNumber}`
                        : "ยังไม่มีการรัน"}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                      year.isActive
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-rose-50 text-rose-700 ring-rose-200"
                    }`}
                  >
                    {year.isActive ? "เปิด" : "ปิด"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2">
                  <button
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-indigo-400/30 transition-colors hover:bg-indigo-700 hover:shadow-md"
                    onClick={() =>
                      navigate(`/staff/competitionYearsList/${year.yearID}`, {
                        state: { yearName: year.yearName },
                      })
                    }
                    title="ลงทะเบียนกิจกรรมปี"
                    aria-label="ลงทะเบียนกิจกรรมปี"
                  >
                    รายการจัดการแข่งขัน
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ===== Desktop: Table ===== */}
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full table-auto border-collapse text-base text-slate-900">
            <thead className="bg-indigo-700 text-white">
              <tr>
                <th className="border-b border-r border-slate-300 px-6 py-3.5 text-left text-sm font-semibold uppercase">
                  ปีการแข่งขัน
                </th>
                <th className="border-b border-r border-slate-300 px-6 py-3.5 text-left text-sm font-semibold uppercase">
                  ชื่องานการแข่งขัน
                </th>
                <th className="border-b border-r border-slate-300 px-6 py-3.5 text-left text-sm font-semibold uppercase">
                  เลขเกียรติบัตรล่าสุด
                </th>
                <th className="border-b border-slate-300 px-6 py-3.5 text-center text-sm font-semibold uppercase">
                  รายการจัดการแข่งขัน
                </th>
              </tr>
            </thead>

            <tbody className="[&>tr:nth-child(odd)]:bg-slate-50/40 [&>tr:nth-child(even)]:bg-slate-100/70 [&>tr:hover]:bg-slate-100/80">
              {pagedYears.map((year) => (
                <tr
                  key={year.yearID ?? ""}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="border-b border-r border-slate-300 px-6 py-3.5">
                    {year.yearNumber}
                  </td>
                  <td className="border-b border-r border-slate-300 px-6 py-3.5">
                    {year.yearName}
                  </td>
                  <td className="border-b border-r border-slate-300 px-6 py-3.5">
                    {year.minCertificateNumber && year.maxCertificateNumber ? (
                      <div className="flex flex-col gap-0.5 text-sm text-slate-700">
                        <div>
                          <span className="text-slate-400 font-medium">
                            ตอนนี้ถึง:{" "}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {year.minCertificateNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">
                            ปัจจุบันถึง:{" "}
                          </span>
                          <span className="font-semibold text-indigo-600">
                            {year.maxCertificateNumber}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">
                        ยังไม่ดำเนินการ{" "}
                      </span>
                    )}
                  </td>

                  <td className="border-b border-slate-300 px-6 py-3.5 text-center">
                    <div className="flex justify-center items-center">
                      <button
                        className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-indigo-400/30 transition-colors hover:bg-green-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onClick={() =>
                          navigate(
                            `/staff/competitionYearsList/${year.yearID}`,
                            {
                              state: { yearName: year.yearName },
                            },
                          )
                        }
                        title="ลงทะเบียนกิจกรรมปี"
                        aria-label="ลงทะเบียนกิจกรรมปี"
                      >
                        คลิกดู
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {years.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="border-b border-slate-300 px-6 py-12 text-center text-slate-600"
                  >
                    ไม่มีรายการปีการแข่งขัน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-200 bg-slate-50/90 px-2 py-1.5 md:px-4 md:py-2">
          <TablePagination
            component="div"
            sx={{
              color: "#334155",
              ".MuiTablePagination-toolbar": {
                backgroundColor: "rgba(241, 245, 249, 0.7)",
                borderRadius: 1,
              },
            }}
            count={years.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="จำนวนรายการต่อหน้า"
          />
        </div>
      </div>
    </div>
  );
};

export default withStaffAuth(StaffYearList);
