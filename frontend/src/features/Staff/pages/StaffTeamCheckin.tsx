import { Loading } from "../../../components/Loading";
import {
  useGetAllTeamStatusQuery,
  useUpdateawardMutation,
  useUpdateTeamStatusMutation,
} from "../../Team/TeamApi";
import { withStaffAuth } from "../../../HOC";
import { usePagination } from "../../../utils/usePagination";
import TablePagination from "@mui/material/TablePagination";
import { confirmDelete, showSuccessOk } from "../../../utils";
import { useLocation, useParams } from "react-router-dom";
import { useGetAllRewardTypeQuery } from "../../RewardType/RewardTypeApi";
import { useFilteredData } from "../../../components";
import { useEffect, useMemo } from "react";
import { handleDownloadWinnersWord } from "../../../Apis/Export";
import { TitlePrefix, type Student } from "../../student/type";

/** สี badge ของรางวัล */
const getRewardBadgeClass = (rewardType?: string) => {
  const name = (rewardType ?? "").toLowerCase();
  if (name.includes("ชนะเลิศ") || name.includes("gold"))
    return "bg-amber-100 text-amber-800 ring-1 ring-amber-300";
  if (name.includes("รองชนะเลิศ") || name.includes("silver"))
    return "bg-slate-100 text-slate-800 ring-1 ring-slate-300";
  if (name.includes("ชมเชย") || name.includes("bronze"))
    return "bg-orange-100 text-orange-800 ring-1 ring-orange-300";
  if (name.includes("เข้าร่วม"))
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
};

const StaffTeamCheckin = () => {
  const { competitionLevelID } = useParams();
  const location = useLocation();
  const requiresProject = location.state?.requiresProject;
  const { data, isLoading } = useGetAllTeamStatusQuery(
    Number(competitionLevelID),
  );
  const [updateaward] = useUpdateawardMutation();
  const { data: rewardTypeData } = useGetAllRewardTypeQuery();
  const [updateTeamStatus] = useUpdateTeamStatusMutation();

  const {
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    setPage,
  } = usePagination({ storageKey: `staff-team-checkin-${competitionLevelID}` });

  // ค้นหา
  const { searchTerm, setSearchTerm, filteredData } = useFilteredData(
    data?.checkedInTeams ?? [],
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

  const handleUpdateAward = async (teamID: number, rewardTypeId: number) => {
    await updateaward({ teamID, rewardTypeId });
    showSuccessOk("อัปเดตรางวัลเรียบร้อยแล้ว");
  };

  // ตั้งค่าสถานะทีมเป็น 1 (เช่น อนุมัติ/ยืนยันการเข้าร่วม)
  const changeStatus = async (teamID: number) => {
    const isConfirm = await confirmDelete("ยืนยันการลบทีมออกจากกิจกรรม");
    if (isConfirm) {
      await updateTeamStatus({ teamID, status: 1 });
      showSuccessOk("ลบทีมออกจากกิจกรรมเรียบร้อยแล้ว");
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 via-slate-100 to-sky-100/70 font-sarabun">
      {/* Header */}
      <div className="mx-auto max-w-8xl px-4 pt-8 pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-900">
              รายชื่อทีมที่ลงทะเบียนแล้ว ทั้งหมด{" "}
              {data?.checkedInTeams?.length ?? 0} ทีม (สิทธิ์เจ้าหน้าที่)
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-blue-500/30 transition-colors hover:bg-red-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => handleDownloadWinnersWord(Number(competitionLevelID))}
              aria-label="ดาวน์โหลดรายชื่อผู้ชนะเป็น Word"
              title="ดาวน์โหลดรายชื่อผู้ชนะเป็น Word"
            >
              ดาวน์โหลด Word
            </button>

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
            <table className="min-w-full border-collapse border border-blue-100 text-sm text-slate-900">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="border-l border-blue-600 px-6 py-3.5 text-center text-[13px] font-semibold uppercase first:border-l-0">
                    ลำดับ
                  </th>
                  <th className="border-l border-blue-600 px-6 py-3.5 text-left text-[13px] font-semibold uppercase first:border-l-0">
                    ชื่อทีม
                  </th>
                  <th className="border-l border-blue-600 px-6 py-3.5 text-center text-[13px] font-semibold uppercase first:border-l-0">
                    ผลรางวัล
                  </th>
                  <th className="border-l border-blue-600 px-3 py-3.5 text-center text-[13px] font-semibold uppercase first:border-l-0">
                    เลือกรางวัล
                  </th>
                  <th className="border-l border-blue-600 px-6 py-3.5 text-center text-[13px] font-semibold uppercase first:border-l-0">
                    ดำเนินการ
                  </th>
                </tr>
              </thead>

              <tbody className="[&>tr:nth-child(odd)]:bg-white [&>tr:nth-child(even)]:bg-blue-50/40 [&>tr:hover]:bg-blue-50/70">
                {pagedTeams.map((team: any, index: number) => (
                  <tr
                    key={team.teamID ?? ""}
                    className="transition-colors hover:bg-blue-50"
                  >
                    <td className="border-t border-l border-blue-100 px-6 py-3.5 text-center first:border-l-0">
                      {index + 1 + page * rowsPerPage}
                    </td>
                    <td className="border-t border-l border-blue-100 px-6 py-3.5 first:border-l-0">
                      <div className="font-medium text-slate-900">
                        {team.school_name}{" "}
                        {team.nameOrdinal !== 0 && team.nameOrdinal}
                      </div>
                      {requiresProject && team.projectName && (
                        <div className="mt-1 text-xs text-slate-600">
                          โครงงาน: {team.projectName}
                        </div>
                      )}
                      {!requiresProject && team.students?.length > 0 && (
                        <div className="mt-1 text-xs text-slate-600">
                          สมาชิก: {team.students.map((student: Student) => {
                            const prefix = TitlePrefix.find(
                              (item) => item.value === student.titlePrefix,
                            )?.label ?? "";
                            return `${prefix}${student.firstName ?? ""} ${student.lastName ?? ""}`.trim();
                          }).filter(Boolean).join(", ")}
                        </div>
                      )}
                    </td>

                    <td className="border-t border-l border-blue-100 px-6 py-3.5 text-center first:border-l-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getRewardBadgeClass(
                          team.rewardType ?? "เข้าร่วมการแข่งขัน",
                        )}`}
                        title={team.rewardType ?? "เข้าร่วมการแข่งขัน"}
                        aria-label={`ผลรางวัล: ${
                          team.rewardType ?? "เข้าร่วมการแข่งขัน"
                        }`}
                      >
                        {team.rewardType ?? "เข้าร่วมการแข่งขัน"}
                      </span>
                    </td>

                    <td className="border-t border-l border-blue-100 px-6 py-3.5 text-center first:border-l-0">
                      <div className="inline-flex">
                        <select
                          defaultValue={team.rewardTypeId ?? ""}
                          onChange={(e) =>
                            handleUpdateAward(
                              team.teamID ?? 0,
                              Number(e.target.value),
                            )
                          }
                          className="w-56 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          aria-label="เลือกรางวัลให้ทีม"
                          title="เลือกรางวัลให้ทีม"
                        >
                          <option value="">— เลือกรางวัล —</option>
                          {rewardTypeData?.map((rewardType) => (
                            <option
                              key={rewardType.rewardTypeID}
                              value={rewardType.rewardTypeID}
                            >
                              {rewardType.rewardTypeName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td className="border-t border-l border-blue-100 px-6 py-3.5 text-center first:border-l-0">
                      <button
                        className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-blue-500/30 transition-colors hover:bg-blue-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => changeStatus(team.teamID ?? 0)}
                        aria-label="ยืนยันสถานะทีม"
                        title="ยืนยันสถานะทีม"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="border-t border-blue-100 px-6 py-16"
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
                          ไม่พบทีม
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
              count={filteredData.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="จำนวนทีมต่อหน้า"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default withStaffAuth(StaffTeamCheckin);
