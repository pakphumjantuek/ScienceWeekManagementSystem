import { Loading } from "../../../components/Loading";
import {
  useDeleteCompetitionLevelMutation,
  useGetAllCompetitionLevelQuery,
  useCloseCompetitionLevelMutation,
} from "../CompetitionLevelApi";
import { handleDownloadWordCompetitionLevels } from "../../../Apis/Export";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../utils/confirmDelete";
import { withAdminAuth } from "../../../HOC";
import { usePagination } from "../../../utils/usePagination";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { formatThaiDateTime } from "../../../utils/dateUtils";
import { useMemo, useState, type ChangeEvent } from "react";
import type { CompetitionLevel } from "../type";
import { useSelector } from "react-redux";
import type { RootState } from "../../../Redux/store";

const CompetitionLevelList = () => {
  const userData = useSelector((state: RootState) => state.userAuthStore);
  const roleLower = (userData.role || "").toLowerCase();
  const isStaff = roleLower === "staff" || roleLower === "เจ้าหน้าที่";

  const { competitionYearID } = useParams<{ competitionYearID: string }>();
  const location = useLocation();
  const {
    competitionName = "",
    requiresProject,
    yearId = "",
    yearName = "",
  } = location.state || {};
  const navigate = useNavigate();
  const { data: competitionLevels, isLoading } = useGetAllCompetitionLevelQuery(
    Number(competitionYearID),
  );
  const [deleteCompetitionLevels] = useDeleteCompetitionLevelMutation();
  const [closeCompetitionLevel] = useCloseCompetitionLevelMutation();
  const [selectedLevelIds, setSelectedLevelIds] = useState<number[]>([]);

  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  const handleAdd = () => {
    navigate(`/admin/competitionLevelList/${competitionYearID}/new`, {
      state: {
        competitionName,
        requiresProject,
        yearId,
        yearName,
      },
    });
  };
  const handleEdit = (id: number) => {
    navigate(`/admin/competitionLevelList/${competitionYearID}/edit/${id}`, {
      state: {
        competitionName,
        requiresProject,
        yearId,
        yearName,
      },
    });
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDelete(
      "ยืนยันการลบข้อมูลระดับชั้นนี้หรือไม่",
    );
    if (!isConfirmed) return;
    try {
      await deleteCompetitionLevels(id).unwrap();
      await showSuccessOk("ลบข้อมูลสำเร็จ");
    } catch (error) {
      await showError("ไม่สามารถลบข้อมูลได้");
    }
  };
  const handleCloseCompetitionLevel = async (id: number) => {
    const isConfirmed = await confirmDelete(
      "คุณต้องการปิดกิจกรรมนี้ใช่หรือไม่?",
    );
    if (!isConfirmed) return;
    try {
      await closeCompetitionLevel({ competitionLevelID: id }).unwrap();
      await showSuccessOk("ปิดกิจกรรมสำเร็จ!");
    } catch {
      await showError("ไม่สามารถปิดกิจกรรมได้");
    }
  };

  const rows = (competitionLevels ?? []) as CompetitionLevel[];
  const isRov = competitionName?.toLowerCase().includes("rov");
  const visibleRows = useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [page, rows, rowsPerPage],
  );
  const visibleLevelIds = visibleRows
    .map((level) => level.competitionLevelID)
    .filter((id): id is number => typeof id === "number");
  const isAllVisibleSelected =
    visibleLevelIds.length > 0 &&
    visibleLevelIds.every((id) => selectedLevelIds.includes(id));

  const toggleLevelSelection = (competitionLevelId: number) => {
    setSelectedLevelIds((current) =>
      current.includes(competitionLevelId)
        ? current.filter((id) => id !== competitionLevelId)
        : [...current, competitionLevelId],
    );
  };

  const toggleSelectAllVisible = () => {
    setSelectedLevelIds((current) => {
      if (isAllVisibleSelected) {
        return current.filter((id) => !visibleLevelIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleLevelIds]));
    });
  };

  const handleExportSelected = async () => {
    if (selectedLevelIds.length === 0) {
      await showError("กรุณาเลือกระดับชั้นอย่างน้อย 1 รายการ");
      return;
    }

    await handleDownloadWordCompetitionLevels(selectedLevelIds);
  };

  const handleExportAll = async () => {
    const allIds = rows
      .map((level) => level.competitionLevelID)
      .filter((id): id is number => typeof id === "number");

    if (allIds.length === 0) {
      await showError("ไม่พบระดับชั้นสำหรับดาวน์โหลด");
      return;
    }

    setSelectedLevelIds(allIds);
    await handleDownloadWordCompetitionLevels(allIds);
  };

  const actionButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-400/30 transition-colors hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500";

  const resultButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-yellow-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-yellow-400/30 transition-colors hover:bg-yellow-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500";

  const editButtonClass = resultButtonClass;

  const deleteButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-rose-400/30 transition-colors hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500";

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              ระดับชั้น {competitionName}
            </h1>
            <p className="mt-1 text-base text-slate-600">
              เลือกระดับชั้นเพื่อพิมพ์รายชื่อได้ทีละระดับหรือหลายระดับพร้อมกัน
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isStaff && (
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-base font-medium text-white shadow-sm ring-1 ring-green-400/30 transition-colors hover:bg-green-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
                onClick={handleAdd}
              >
                เพิ่มระดับชั้น
              </button>
            )}
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-base font-medium text-white shadow-sm ring-1 ring-blue-400/30 transition-colors hover:bg-blue-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleExportSelected}
            >
              พิมพ์ที่เลือก ({selectedLevelIds.length})
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-base font-medium text-white shadow-sm ring-1 ring-indigo-400/30 transition-colors hover:bg-indigo-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={handleExportAll}
            >
              พิมพ์ทั้งหมด
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-slate-500 px-4 py-2 text-base font-medium text-white shadow-sm ring-1 ring-slate-400/30 transition-colors hover:bg-slate-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              onClick={() =>
                yearId
                  ? navigate(`/admin/competitionYearsList/${yearId}`, {
                      state: { yearName },
                    })
                  : navigate(`/admin/year`)
              }
            >
              ย้อนกลับ
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-base text-slate-900">
            <thead className="bg-slate-900 text-slate-100">
              <tr>
                <th className="px-4 py-4 text-center font-bold text-base">
                  <input
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="h-4 w-4 rounded border-slate-300"
                    title="เลือกทั้งหมดในหน้านี้"
                  />
                </th>
                <th className="px-6 py-4 text-left font-bold text-base">
                  ระดับชั้น
                </th>
                <th className="px-6 py-4 text-center font-bold text-base">
                  วันและเวลาแข่งขัน
                </th>
                <th className="px-6 py-4 text-center font-bold text-base">
                  จำนวนสมาชิก
                </th>
                <th className="px-6 py-4 text-center font-bold text-base">
                  ตั้งค่า
                </th>
                <th className="px-6 py-4 text-center font-bold text-base">
                  ดำเนินการ
                </th>
                <th className="px-6 py-4 text-center font-bold text-base">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.map((level) => {
                const competitionLevelId = level.competitionLevelID ?? 0;
                const isSelected =
                  selectedLevelIds.includes(competitionLevelId);

                return (
                  <tr key={competitionLevelId} className="hover:bg-slate-50/80">
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          toggleLevelSelection(competitionLevelId)
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="px-6 py-4">{level.levelName ?? "-"}</td>
                    <td className="px-6 py-4 text-center font-medium">
                      {level.competitionDateTime
                        ? formatThaiDateTime(level.competitionDateTime)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      หลัก {level.mainPlayersCount ?? 0} คน / สำรอง{" "}
                      {level.reservePlayersCount ?? 0} คน
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isRov ? (
                          <button
                            className={actionButtonClass}
                            onClick={() =>
                              navigate(
                                `/admin/competitionLevel/${competitionLevelId}/matchrov`,
                                {
                                  state: {
                                    mainPlayersCount: level.mainPlayersCount,
                                    competitionName,
                                    requiresProject,
                                    yearId,
                                    yearName,
                                    competitionYearID,
                                    isCertificateNumberGenerated:
                                      level.isCertificateNumberGenerated,
                                  },
                                },
                              )
                            }
                          >
                            ลงทะเบียน (ROV)
                          </button>
                        ) : (
                          <button
                            className={actionButtonClass}
                            onClick={() =>
                              navigate(
                                `/admin/competitionLevel/${competitionLevelId}/match`,
                                {
                                  state: {
                                    requiresProject,
                                    competitionName,
                                    yearId,
                                    yearName,
                                    competitionYearID,
                                    mainPlayersCount: level.mainPlayersCount,
                                  },
                                },
                              )
                            }
                          >
                            ลงทะเบียน
                          </button>
                        )}

                        {isRov && (
                          <button
                            className={resultButtonClass}
                            onClick={() =>
                              navigate(`/matchuser/${competitionLevelId}`)
                            }
                          >
                            เเสดงผลการแข่งขัน
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isStaff ? (
                        <span className="text-slate-400">-</span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className={editButtonClass}
                            onClick={() => handleEdit(competitionLevelId)}
                          >
                            แก้ไข
                          </button>
                          <button
                            className={deleteButtonClass}
                            onClick={() => handleDelete(competitionLevelId)}
                          >
                            ลบ
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isStaff ? (
                        <span className="text-slate-400">-</span>
                      ) : (
                        <button
                          className={deleteButtonClass}
                          onClick={() =>
                            handleCloseCompetitionLevel(competitionLevelId)
                          }
                        >
                          ปิดการแข่งขัน
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {visibleRows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center text-slate-500"
                  >
                    ไม่มีรายการระดับชั้น
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>จำนวนแถวต่อหน้า</span>
            <select
              value={rowsPerPage}
              onChange={(event) =>
                handleChangeRowsPerPage({
                  target: { value: event.target.value },
                } as ChangeEvent<HTMLInputElement>)
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-2"
            >
              {[5, 10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={(event) =>
                handleChangePage(event as any, Math.max(page - 1, 0))
              }
              disabled={page === 0}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <span>หน้า {page + 1}</span>
            <button
              type="button"
              onClick={(event) => handleChangePage(event as any, page + 1)}
              disabled={(page + 1) * rowsPerPage >= rows.length}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAdminAuth(CompetitionLevelList);
