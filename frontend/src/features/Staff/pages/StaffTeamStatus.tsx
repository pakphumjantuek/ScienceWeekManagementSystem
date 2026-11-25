import { Loading } from "../../../components/Loading";
import {
  useGetAllTeamStatusQuery,
  useUpdateTeamStatusMutation,
} from "../../Team/TeamApi";
import { withStaffAuth } from "../../../HOC";
import { usePagination } from "../../../utils/usePagination";
import TablePagination from "@mui/material/TablePagination";
import { showSuccessOk, showError } from "../../../utils";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getStatusBadgeClass, statusOptionsUser } from "../../Team/type";
import { handleDownloadPdf, handleDownloadWord } from "../../../Apis/Export";
import useFilteredData from "../../../components/useFilteredData";
import { TitlePrefix, type Student } from "../../student/type";
import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, FileText, FileType } from "lucide-react";
import { Printer } from "lucide-react";
import { ChangeTeamLevelModal } from "../../Team/components/ChangeTeamLevelModal";
import { exportTeamSigns } from "../../../utils/teamSignExport";

const StaffTeamStatus = () => {
  const { competitionLevelID } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { competitionName } = location.state || {};
  const isRov = competitionName?.toLowerCase().includes("rov");
  const requiresProject = location.state?.requiresProject;
  const mainPlayersCount = location.state?.mainPlayersCount;
  const yearId = location.state?.yearId;
  const yearName = location.state?.yearName;
  const competitionYearID = location.state?.competitionYearID;
  const baseUrl = import.meta.env.VITE_API_BASE_URLS;

  const { data, isLoading } = useGetAllTeamStatusQuery(
    Number(competitionLevelID),
  );

  const [updateTeamStatus] = useUpdateTeamStatusMutation();

  const [selectedTeamForChangeLevel, setSelectedTeamForChangeLevel] = useState<any>(null);
  const [isChangeLevelModalOpen, setIsChangeLevelModalOpen] = useState(false);

  const handleOpenChangeLevelModal = (team: any) => {
    setSelectedTeamForChangeLevel({
      ...team,
      competitionLevelID: Number(competitionLevelID),
      competitionLevelName: location.state?.levelName || location.state?.competitionLevelName,
    });
    setIsChangeLevelModalOpen(true);
  };

  const handleUpdateTeamStatus = async (teamID: number, status: number) => {
    const scrollTop = window.scrollY;
    try {
      await updateTeamStatus({ teamID, status }).unwrap();
      showSuccessOk("อัปเดตสถานะทีมเรียบร้อย");
    } catch (e: any) {
      showError(e?.data ?? e?.message ?? "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      // การ refetch หลังบันทึกไม่ควรพาหน้าจอกระโดดไปตำแหน่งอื่น
      requestAnimationFrame(() =>
        requestAnimationFrame(() => window.scrollTo(0, scrollTop)),
      );
    }
  };

  const {
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    setPage,
  } = usePagination({
    storageKey: `staff-team-status-${competitionLevelID}`,
    initialRowsPerPage: 100,
  });

  const { searchTerm, setSearchTerm, filteredData } = useFilteredData(
    data?.verifiedTeams ?? [],
    ["school_name"],
  );

  useEffect(() => {
    const total = filteredData?.length ?? 0;
    const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [filteredData?.length, rowsPerPage, page, setPage]);

  const pagedTeams = useMemo(
    () =>
      filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredData, page, rowsPerPage],
  );

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 via-slate-100 to-sky-100/70 font-sarabun">
      {/* Header */}
      <div className="mx-auto max-w-8xl px-4 pt-8 pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            {competitionName}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-900">
              รายชื่อทีมที่สมัคร ทั้งหมด {data?.verifiedTeams?.length ?? 0} ทีม
              (สิทธิ์เจ้าหน้าที่)
            </h1>
          </div>

          {/* Actions + Search */}
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-blue-400/30 transition-colors hover:bg-gray-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() =>
                  competitionYearID
                    ? navigate(
                        `/staff/competitionLevelList/${competitionYearID}`,
                        {
                          state: {
                            competitionName,
                            requiresProject,
                            yearId,
                            yearName,
                          },
                        },
                      )
                    : navigate(-1)
                }
                aria-label="ย้อนกลับ"
                title="ย้อนกลับ"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-blue-500/30 transition-colors hover:bg-red-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => handleDownloadPdf(Number(competitionLevelID))}
                aria-label="ดาวน์โหลดรายชื่อทีมเป็น PDF"
                title="ดาวน์โหลดรายชื่อทีมเป็น PDF"
              >
                <FileText className="h-4 w-4" />
                ดาวน์โหลดรายชื่อ
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-blue-500/30 transition-colors hover:bg-blue-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => handleDownloadWord(Number(competitionLevelID))}
                aria-label="ดาวน์โหลดรายชื่อทีมเป็น Word"
                title="ดาวน์โหลดรายชื่อทีมเป็น Word"
              >
                <FileType className="h-4 w-4" />
                ดาวน์โหลดรายชื่อ
              </button>
              {isRov && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-emerald-500/30 transition-colors hover:bg-emerald-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onClick={() => exportTeamSigns(filteredData, `ป้ายชื่อทีม ${competitionName ?? ""}`)}
                  aria-label="พิมพ์ป้ายชื่อและรหัสทีม"
                  title="พิมพ์ป้าย A4 แนวนอน (ทีมละ 1 หน้า)"
                >
                  <Printer className="h-4 w-4" />
                  พิมพ์ป้ายทีม
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35A7.5 7.5 0 103.5 3.5a7.5 7.5 0 0013.15 13.15z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="ค้นหาชื่อทีม/โรงเรียน"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-blue-200 px-10 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                aria-label="ค้นหาชื่อทีม/โรงเรียน"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto max-w-8xl px-4 pb-10">
        <div className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border border-blue-100 border-collapse text-sm text-slate-900">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="px-6 py-3.5 text-center text-[13px] font-semibold uppercase border-l border-blue-600 first:border-l-0">
                    ลำดับ
                  </th>
                  {competitionName?.toLowerCase().includes("rov") && (
                    <th className="px-6 py-3.5 text-center text-[13px] font-semibold uppercase border-l border-blue-600 first:border-l-0">
                      รหัสทีม
                    </th>
                  )}
                  <th className="px-6 py-3.5 text-center text-[13px] font-semibold uppercase border-l border-blue-600 first:border-l-0">
                    ชื่อทีม
                  </th>
                  {requiresProject && (
                    <th className="px-6 py-3.5 text-center text-[13px] font-semibold uppercase border-l border-blue-600 first:border-l-0">
                      โครงงาน
                    </th>
                  )}
                  <th className="px-6 py-3.5 text-center text-[13px] font-semibold uppercase border-l border-blue-600 first:border-l-0">
                    สมาชิก
                  </th>
                  <th className="px-6 py-3.5 text-center text-[13px] font-semibold uppercase border-l border-blue-600 first:border-l-0">
                    สถานะ
                  </th>
                  <th className="px-6 py-3.5 text-center text-[13px] font-semibold uppercase border-l border-blue-600 first:border-l-0">
                    จัดการสถานะ
                  </th>
                  <th className="px-6 py-3.5 text-left text-[13px] font-semibold uppercase border-l border-blue-600 first:border-l-0">
                    สมาชิกในทีม
                  </th>
                </tr>
              </thead>

              <tbody className="[&>tr:nth-child(odd)]:bg-white [&>tr:nth-child(even)]:bg-blue-50/40 [&>tr:hover]:bg-blue-50/70">
                {pagedTeams.map((team: any, idx: number) => {
                  const currentStatus = statusOptionsUser.find(
                    (o) => o.value === team.status,
                  );
                  const index = page * rowsPerPage + idx + 1;
                  return (
                    <tr
                      key={team.teamID ?? ""}
                      className="transition-colors hover:bg-blue-50"
                    >
                      <td className="px-6 py-3.5 text-center border-t border-l border-blue-100 first:border-l-0">
                        {index}
                      </td>
                      {competitionName?.toLowerCase().includes("rov") && (
                        <td className="px-6 py-3.5 text-center border-t border-l border-blue-100 first:border-l-0">
                          {team.teamNumberInLevel}
                        </td>
                      )}
                      <td className="px-6 py-3.5 text-left border-t border-l border-blue-100 first:border-l-0">
                        <div className="font-medium text-slate-900">
                          {team.school_name}{" "}
                          {team.nameOrdinal !== 0 && team.nameOrdinal}
                        </div>
                        {requiresProject && team.projectName && (
                          <div className="mt-1 text-xs text-slate-600">
                            ชื่อโครงงาน: {team.projectName}
                          </div>
                        )}
                      </td>

                      {requiresProject && (
                        <td className="px-6 py-3.5 text-center border-t border-l border-blue-100 first:border-l-0">
                          {team.projectPDFLink ? (
                            <a
                              href={`${baseUrl}${team.projectPDFLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <button className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-xs font-medium text-white shadow-sm ring-1 ring-sky-400/30 hover:bg-sky-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500">
                                เปิดไฟล์
                              </button>
                            </a>
                          ) : (
                            <p className="text-slate-500 italic">
                              ยังไม่มีไฟล์โครงงาน
                            </p>
                          )}
                        </td>
                      )}

                      <td className="px-6 py-3.5 text-center border-t border-l border-blue-100 first:border-l-0">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm ring-1 ring-blue-500/30 transition-colors hover:bg-blue-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() =>
                              navigate(`/staff/student/${team.teamID}`, {
                                state: {
                                  currentTeam: team,
                                  mainPlayersCount,
                                  requiresProject,
                                  competitionName,
                                  competitionLevelID:
                                    Number(competitionLevelID),
                                  yearId,
                                  yearName,
                                  competitionYearID,
                                },
                              })
                            }
                            title="สมาชิกในทีม"
                            aria-label="สมาชิกในทีม"
                          >
                            สมาชิกในทีม
                          </button>
                          <button
                            className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm ring-1 ring-amber-400/30 transition-colors hover:bg-amber-600 focus:outline-none"
                            onClick={() =>
                              navigate(`/staff/adminform`, {
                                state: {
                                  returnUrl: `/staff/competitionLevel/${competitionLevelID}/match`,
                                  currentTeam: team,
                                  requiresProject,
                                  competitionName,
                                  yearId,
                                  yearName,
                                  competitionYearID,
                                  school_name: team.school_name,
                                  school_Code: team.school_code,
                                  competitionLevelID: Number(competitionLevelID),
                                },
                              })
                            }
                            title="แก้ไขข้อมูลทีม / อาจารย์ที่ปรึกษา"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            แก้ไขทีม
                          </button>
                          <button
                            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            onClick={() => handleOpenChangeLevelModal(team)}
                            disabled={team.status === 3 || team.status === "CheckedIn" || team.status === "เช็คอินแล้ว"}
                            title={
                              team.status === 3 || team.status === "CheckedIn" || team.status === "เช็คอินแล้ว"
                                ? "ทีมลงทะเบียนเช็คอินเข้างานแล้ว ไม่สามารถย้ายระดับชั้นได้"
                                : "ย้ายระดับชั้นการแข่งขัน"
                            }
                            aria-label="ย้ายระดับชั้นการแข่งขัน"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            ย้ายระดับชั้น
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 text-center border-t border-l border-blue-100 first:border-l-0">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                            team.status ?? 0,
                          )}`}
                          aria-label={`สถานะ: ${
                            currentStatus?.label ?? "ไม่ทราบสถานะ"
                          }`}
                          title={`สถานะ: ${
                            currentStatus?.label ?? "ไม่ทราบสถานะ"
                          }`}
                        >
                          <span aria-hidden="true">●</span>
                          {currentStatus?.label ?? "ไม่ทราบสถานะ"}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-center border-t border-l border-blue-100 first:border-l-0">
                        <select
                          title="เปลี่ยนสถานะทีม"
                          className="w-56 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          value={team.status}
                          onChange={(e) => {
                            const newStatus = Number(e.target.value);
                            if (newStatus !== team.status) {
                              handleUpdateTeamStatus(
                                team.teamID ?? 0,
                                newStatus,
                              );
                            }
                          }}
                        >
                          {statusOptionsUser.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-3.5 text-left align-top border-t border-l border-blue-100 first:border-l-0">
                        {team.students && team.students.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {team.students.map((s: Student) => {
                              const prefix =
                                TitlePrefix.find(
                                  (p) => p.value === s.titlePrefix,
                                )?.label ?? "";
                              const fullName = `${prefix} ${(
                                s.firstName ?? ""
                              ).trim()} ${(s.lastName ?? "").trim()}`.trim();
                              return (
                                <span
                                  key={s.studentID}
                                  className="text-xs text-slate-800 "
                                >
                                  {fullName || "-"}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            ไม่มีสมาชิก
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={6 + (requiresProject ? 1 : 0) + (isRov ? 1 : 0)}
                      className="px-6 py-16 border-t border-blue-100"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 ring-1 ring-blue-100">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-7 w-7"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75V12zm0 5.25h.007v.008H3.75v-.008z"
                            />
                          </svg>
                        </div>
                        <p className="text-base font-medium text-slate-800">
                          ไม่พบผลการค้นหา
                        </p>
                        <p className="text-sm text-slate-500">
                          โปรดเปลี่ยนคำค้นหาหรือเคลียร์ช่องค้นหา
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-blue-100 bg-blue-50/70 px-4 py-2">
            <TablePagination
              component="div"
              count={filteredData?.length ?? 0}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[100, 50, 25, 10]}
              labelRowsPerPage="จำนวนทีมต่อหน้า"
            />
          </div>
        </div>
      </div>

      <ChangeTeamLevelModal
        isOpen={isChangeLevelModalOpen}
        onClose={() => setIsChangeLevelModalOpen(false)}
        team={selectedTeamForChangeLevel}
        competitionYearID={competitionYearID}
      />
    </div>
  );
};

export default withStaffAuth(StaffTeamStatus);
