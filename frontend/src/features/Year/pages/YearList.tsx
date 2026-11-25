import { Loading } from "../../../components/Loading";
import {
  useDeleteYearMutation,
  useGetAllYearQuery,
  useTeamcertificateNumberMutation,
  useCloneYearMutation,
} from "../YearApi";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../utils/confirmDelete";
import { withAdminAuth } from "../../../HOC";
import { useNavigate } from "react-router-dom";
import { usePagination } from "../../../utils/usePagination";
import TablePagination from "@mui/material/TablePagination";
import { useMemo } from "react";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import type { RootState } from "../../../Redux/store";
import { handleDownloadWinnersByYearWord } from "../../../Apis/Export";

const YearList = () => {
  const { data: years = [], isLoading } = useGetAllYearQuery();
  const [teamcertificateNumber] = useTeamcertificateNumberMutation();
  const [deleteYears] = useDeleteYearMutation();
  const [cloneYear] = useCloneYearMutation();
  const navigate = useNavigate();
  const userData = useSelector((state: RootState) => state.userAuthStore);
  const roleLower = (userData.role || "").toLowerCase();
  const isStaff = roleLower === "staff" || roleLower === "เจ้าหน้าที่";

  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  const pagedYears = useMemo(
    () => years.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [years, page, rowsPerPage],
  );

  if (isLoading) return <Loading />;

  const handleAdd = () => {
    navigate("/admin/year/new");
  };

  const handleEdit = (id: number) => {
    navigate(`/admin/year/${id}/edit`);
  };

  const handleTeamcertificateNumber = async (id: number) => {
    const isConfirmed = await confirmDelete(
      "คุณต้องการปิดกิจกรรมนี้ใช่หรือไม่?",
    );
    if (!isConfirmed) return;
    try {
      await teamcertificateNumber({ yearId: id }).unwrap();
      await showSuccessOk("ปิดกิจกรรมสำเร็จ!");
    } catch {
      await showError("ไม่สามารถปิดกิจกรรมได้");
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDelete(
      "คุณต้องการลบปีการเเข่งขันนี้ใช่หรือไม่?",
    );
    if (!isConfirmed) return;
    try {
      await deleteYears(id).unwrap();
      await showSuccessOk("ลบปีการเเข่งขันสำเร็จ!");
    } catch {
      await showError("ไม่สามารถลบปีการเเข่งขันได้");
    }
  };

  const handleClone = async (sourceYearId: number) => {
    const srcYear = years?.find((y) => y.yearID === sourceYearId);
    const srcNumberStr = srcYear?.yearNumber ? String(srcYear.yearNumber) : "";
    const defaultNewNumber = srcYear?.yearNumber
      ? srcYear.yearNumber + 1
      : 2569;
    const defaultNewName = srcYear?.yearName
      ? srcYear.yearName.replace(srcNumberStr, String(defaultNewNumber))
      : `งานสัปดาห์วิทยาศาสตร์ประจำปี ${defaultNewNumber}`;

    const result = await Swal.fire({
      title: "คัดลอกปีการแข่งขัน",
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label for="clone-year-number" class="mb-1 block text-sm font-medium text-slate-700">
              เลขปีใหม่
            </label>
            <input
              id="clone-year-number"
              type="number"
              class="swal2-input !m-0 !w-full"
              value="${defaultNewNumber}"
              placeholder="เช่น 2569"
            />
          </div>
          <div>
            <label for="clone-year-name" class="mb-1 block text-sm font-medium text-slate-700">
              ชื่อปีการแข่งขันใหม่ (เปลี่ยนปีด้านในให้อัตโนมัติ)
            </label>
            <input
              id="clone-year-name"
              type="text"
              class="swal2-input !m-0 !w-full"
              value="${defaultNewName}"
              placeholder="ระบุชื่อปีการแข่งขัน"
            />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "คัดลอกปี",
      cancelButtonText: "ยกเลิก",
      focusConfirm: false,
      didOpen: () => {
        const numInput = document.getElementById(
          "clone-year-number",
        ) as HTMLInputElement | null;
        const nameInput = document.getElementById(
          "clone-year-name",
        ) as HTMLInputElement | null;
        if (!numInput || !nameInput || !srcNumberStr) return;

        numInput.addEventListener("input", () => {
          const nextVal = numInput.value.trim();
          if (nextVal && nameInput.value) {
            // แทนที่ปีเดิมด้วยปีใหม่ตามที่ผู้ใช้พิมพ์
            if (nameInput.value.includes(srcNumberStr)) {
              nameInput.value = nameInput.value.replace(srcNumberStr, nextVal);
            }
          }
        });
      },
      preConfirm: () => {
        const yearNumberInput = document.getElementById(
          "clone-year-number",
        ) as HTMLInputElement | null;
        const yearNameInput = document.getElementById(
          "clone-year-name",
        ) as HTMLInputElement | null;

        const newYearNumber = Number(yearNumberInput?.value ?? "0");
        const newYearName = yearNameInput?.value.trim() ?? "";

        if (!newYearNumber) {
          Swal.showValidationMessage("กรุณากรอกเลขปีใหม่");
          return;
        }

        if (!newYearName) {
          Swal.showValidationMessage("กรุณากรอกชื่อปีการแข่งขันใหม่");
          return;
        }

        return { newYearNumber, newYearName };
      },
    });

    if (!result.isConfirmed || !result.value) return;

    const { newYearNumber, newYearName } = result.value;

    try {
      await cloneYear({
        sourceYearId,
        newYearNumber,
        newYearName,
        copyTeams: false,
        copyMatches: false,
        copyCertificateBackgroundFile: true,
        copyCertificateConfig: true,
        resetCertificateStartNumberToOne: true,
        copyCompetitionYears: true,
        copyCompetitionLevels: true,
        copyAwards: true,
      }).unwrap();

      await showSuccessOk("คัดลอกปีสำเร็จ!");
    } catch (e: any) {
      await showError(e?.data ?? "คัดลอกปีไม่สำเร็จ");
    }
  };

  return (
    <div className="w-full space-y-6 font-sarabun">
      <div className="w-full overflow-hidden rounded-2xl border border-slate-300/80 bg-slate-100/75 shadow-sm backdrop-blur-sm">
        <div className="border-b border-slate-300/80 px-4 pb-4 pt-6 md:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
            ปีการแข่งขัน
          </h1>
          <p className="mt-1 text-base text-slate-600">
            จัดการรายการปีการแข่งขันทั้งหมด
          </p>

          {/* Actions */}
          {!isStaff && (
            <div className="mt-4 flex  flex-wrap  items-center gap-2">
              <button
                className="inline-flex  items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-700/20 transition-colors hover:bg-green-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                onClick={handleAdd}
                aria-label="เพิ่มปีแข่งขัน"
                title="เพิ่มปีแข่งขัน"
              >
                เพิ่มปีการแข่งขัน
              </button>
            </div>
          )}
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
                    className="inline-flex w-full justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-800 hover:shadow-md"
                    onClick={() => handleDownloadWinnersByYearWord(year.yearID ?? 0)}
                    title="ดาวน์โหลดผู้ชนะทั้งหมดของปีนี้"
                    aria-label="ดาวน์โหลดผู้ชนะทั้งหมดของปีนี้"
                  >
                    ดาวน์โหลดผู้ชนะทั้งหมด Word
                  </button>

                  <button
                    className="inline-flex w-full justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-amber-400/30 transition-colors hover:bg-amber-700 hover:shadow-md"
                    onClick={() =>
                      navigate(`/admin/competitionYearsList/${year.yearID}`, {
                        state: { yearName: year.yearName },
                      })
                    }
                    title="ลงทะเบียนกิจกรรมปี"
                    aria-label="ลงทะเบียนกิจกรรมปี"
                  >
                    ลงทะเบียนกิจกรรม
                  </button>

                  {!isStaff && (
                    <button
                      className="inline-flex w-full justify-center rounded-md bg-slate-500 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 transition-colors hover:bg-slate-600 hover:shadow-md"
                      onClick={() =>
                        navigate(`/admin/uploadBackgroundYear/${year.yearID}`, {
                          state: { yearName: year.yearName },
                        })
                      }
                      title="ตั้งค่าเกียรติบัตร"
                      aria-label="ตั้งค่าเกียรติบัตร"
                    >
                      ตั้งค่าเกียรติบัตร
                    </button>
                  )}

                  {!isStaff && (
                    <div className="flex gap-2">
                      <button
                        className="inline-flex flex-1 justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 hover:shadow-md"
                        onClick={() => handleEdit(year.yearID ?? 0)}
                        title="แก้ไข"
                        aria-label="แก้ไข"
                      >
                        แก้ไข
                      </button>

                      <button
                        className="inline-flex flex-1 justify-center rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 hover:shadow-md"
                        onClick={() => handleClone(year.yearID ?? 0)}
                        title="คัดลอกปี"
                        aria-label="คัดลอกปี"
                      >
                        คัดลอกปี
                      </button>

                      <button
                        className="inline-flex flex-1 justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700 hover:shadow-md"
                        onClick={() => handleDelete(year.yearID ?? 0)}
                        title="ลบ"
                        aria-label="ลบ"
                      >
                        ลบ
                      </button>
                    </div>
                  )}

                  {!isStaff && (
                    <button
                      className="inline-flex w-full justify-center rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-800 hover:shadow-md"
                      onClick={() =>
                        handleTeamcertificateNumber(year.yearID ?? 0)
                      }
                      title="ปิดกิจกรรม"
                      aria-label="ปิดกิจกรรม"
                    >
                      ปิดกิจกรรม
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ===== Desktop: Table ===== */}
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full table-auto border-collapse text-base text-slate-900">
            <thead className="bg-blue-700/90 text-white">
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
                <th className="border-b border-r border-slate-300 px-6 py-3.5 text-left text-sm font-semibold uppercase">
                  สถานะ
                </th>
                <th className="border-b border-r border-slate-300 px-6 py-3.5 text-center text-sm font-semibold uppercase">
                  ลงทะเบียนกิจกรรมปีนี้
                </th>
                <th className="hidden border-b border-r border-slate-300 px-6 py-3.5 text-center text-sm font-semibold uppercase lg:table-cell">
                  ตั้งค่าเกียรติบัตร
                </th>
                <th className="border-b border-slate-300 px-6 py-3.5 text-center text-sm font-semibold uppercase">
                  จัดการ
                </th>
                {/* <th className="px-6 py-3.5 text-center text-[13px] font-semibold uppercase border-l border-slate-300 first:border-l-0">
                    ปิดกิจกรรม
                  </th> */}
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
                          <span className="font-semibold text-blue-600">
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
                  <td className="border-b border-r border-slate-300 px-6 py-3.5">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${
                        year.isActive
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-rose-50 text-rose-700 ring-rose-200"
                      }`}
                    >
                      {year.isActive ? "เปิด" : "ปิด"}
                    </span>
                  </td>

                  <td className="border-b border-r border-slate-300 px-6 py-3.5 text-center">
                    <div className="flex justify-center items-center">
                      <button
                        className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-amber-400/30 transition-colors hover:bg-amber-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        onClick={() =>
                          navigate(
                            `/admin/competitionYearsList/${year.yearID}`,
                            {
                              state: { yearName: year.yearName },
                            },
                          )
                        }
                        title="ลงทะเบียนกิจกรรมปี"
                        aria-label="ลงทะเบียนกิจกรรมปี"
                      >
                        รายการจัดการเเข่งขัน
                      </button>
                    </div>
                  </td>

                  <td className="hidden border-b border-r border-slate-300 px-6 py-3.5 text-center lg:table-cell">
                    {isStaff ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <button
                        className="inline-flex items-center gap-2 rounded-md bg-slate-500 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 transition-colors hover:bg-slate-600 hover:shadow-md"
                        onClick={() =>
                          navigate(
                            `/admin/uploadBackgroundYear/${year.yearID}`,
                            {
                              state: { yearName: year.yearName },
                            },
                          )
                        }
                        title="ตั้งค่าเกียรติบัตร"
                        aria-label="ตั้งค่าเกียรติบัตร"
                      >
                        ตั้งค่า
                      </button>
                    )}
                  </td>

                  <td className="border-b border-slate-300 px-6 py-3.5 text-center">
                    <div className="flex flex-wrap justify-center items-center gap-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-800 hover:shadow-md"
                        onClick={() =>
                          handleDownloadWinnersByYearWord(year.yearID ?? 0)
                        }
                        title="ดาวน์โหลดผู้ชนะทั้งหมดของปีนี้"
                        aria-label="ดาวน์โหลดผู้ชนะทั้งหมดของปีนี้"
                      >
                        ดาวน์โหลดผู้ชนะทั้งหมด Word
                      </button>
                      {!isStaff && (
                        <>
                          <button
                            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 hover:shadow-md"
                            onClick={() => handleEdit(year.yearID ?? 0)}
                            title="แก้ไข"
                            aria-label="แก้ไข"
                          >
                            แก้ไข
                          </button>

                          <button
                            className="inline-flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 hover:shadow-md"
                            onClick={() => handleClone(year.yearID ?? 0)}
                            title="คัดลอกปี"
                            aria-label="คัดลอกปี"
                          >
                            คัดลอก
                          </button>

                          <button
                            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-rose-400/30 transition-colors hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                            onClick={() => handleDelete(year.yearID ?? 0)}
                            title="ลบ"
                            aria-label="ลบ"
                          >
                            ลบ
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                  {/* <td className="px-6 py-3.5 text-center border-t border-l border-slate-300 first:border-l-0">
                      <div className="flex justify-center items-center">
                        <button
                          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-red-700 hover:shadow-md"
                          onClick={() =>
                            handleTeamcertificateNumber(year.yearID ?? 0)
                          }
                          title="ปิดกิจกรรม"
                          aria-label="ปิดกิจกรรม"
                        >
                          ปิดกิจกรรม
                        </button>
                      </div>
                    </td> */}
                </tr>
              ))}

              {years.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
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

export default withAdminAuth(YearList);
