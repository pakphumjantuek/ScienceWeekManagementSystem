import { Loading } from "../../../../components/Loading";
import { useDeleteTeamMutation, useGetAllTeamQuery } from "../../TeamApi";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../../utils/confirmDelete";
import { withAdminAuth } from "../../../../HOC";
import { useNavigate } from "react-router-dom";
import { usePagination } from "../../../../utils/usePagination";
import useFilteredData from "../../../../components/useFilteredData";
import { TitlePrefix } from "../../../student/type";
import { useEffect } from "react";
import { AdminCrudTable } from "../../../../components/admin/AdminCrudTable";
import type { Team } from "../../type";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../Redux/store";

const TeamList = () => {
  const { data: teams, isLoading } = useGetAllTeamQuery();
  const [deleteteams] = useDeleteTeamMutation();
  const navigate = useNavigate();

  const userData = useSelector((state: RootState) => state.userAuthStore);
  const roleLower = (userData.role || "").toLowerCase();
  const isStaff = roleLower === "staff" || roleLower === "เจ้าหน้าที่";

  const {
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    setPage,
  } = usePagination();

  const { searchTerm, setSearchTerm, filteredData } = useFilteredData(
    teams ?? [],
    ["school_name"],
  );

  useEffect(() => {
    const total = filteredData?.length ?? 0;
    const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [filteredData?.length, rowsPerPage, page, setPage]);

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDelete("คุณต้องการลบทีมนี้ใช่หรือไม่?");
    if (!isConfirmed) return;
    try {
      await deleteteams(id).unwrap();
      await showSuccessOk("ลบทีมสำเร็จ!");
    } catch (error: any) {
      await showError(error?.data?.errorMessages?.[0] ?? "ไม่สามารถลบทีมได้");
    }
  };
  if (isLoading) return <Loading />;

  const editButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 transition-colors hover:bg-amber-700 hover:shadow-md";

  const deleteButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-rose-400/30 transition-colors hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500";

  const rows = (filteredData ?? []) as Team[];

  return (
    <AdminCrudTable<Team>
      title={`รายชื่อทีมทั้งหมด ${filteredData?.length ?? 0} ทีม`}
      subtitle="จัดการข้อมูลทีมและสมาชิก"
      actions={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          {!isStaff ? (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-700/20 transition-colors hover:bg-slate-800 hover:shadow-md"
              onClick={() =>
                navigate("/admin/adminform", { state: { currentTeam: null } })
              }
              aria-label="เพิ่มทีม"
              title="เพิ่มทีม"
            >
              เพิ่มทีม/โรงเรียน
            </button>
          ) : (
            <div />
          )}
          <div className="relative flex w-full items-center justify-end sm:w-80">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center justify-end">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 3.5a7.5 7.5 0 0013.15 13.15z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="ค้นหาชื่อทีม/โรงเรียน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-10 py-2.5 text-base text-slate-800 shadow-sm outline-none transition-all focus:border-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-200"
              aria-label="ค้นหาชื่อทีม"
            />
          </div>
        </div>
      }
      columns={[
        {
          key: "school",
          header: "ชื่อทีม/โรงเรียน",
          renderCell: (team) => (
            <>
              {team.school_name} {team.nameOrdinal !== 0 && team.nameOrdinal}
            </>
          ),
        },
        {
          key: "teachers",
          header: "ครูผู้ควบคุม",
          align: "center",
          renderCell: (team) => (
            <div className="flex flex-col items-center gap-0.5">
              {team.primaryFirstName ? (
                <span className="text-slate-900">
                  {
                    TitlePrefix.find((t) => t.value === team.primaryTitlePrefix)
                      ?.label
                  }{" "}
                  {team.primaryFirstName} {team.primaryLastName}
                </span>
              ) : (
                <span className="text-sm italic text-slate-500">
                  ไม่มีผู้ควบคุม
                </span>
              )}
              {team.secondaryFirstName ? (
                <span className="text-slate-900">
                  {
                    TitlePrefix.find(
                      (t) => t.value === team.secondaryTitlePrefix,
                    )?.label
                  }{" "}
                  {team.secondaryFirstName} {team.secondaryLastName}
                </span>
              ) : (
                <span className="text-sm italic text-slate-500">
                  ไม่มีผู้ควบคุมรอง
                </span>
              )}
            </div>
          ),
        },
        {
          key: "members",
          header: "สมาชิกในทีม",
          align: "center",
          renderCell: (team) => (
            <button
              className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-amber-400/30 transition-colors hover:bg-amber-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              onClick={() => navigate(`/admin/student/${team.teamID}`)}
              title="ผู้เล่นในทีม"
              aria-label="ผู้เล่นในทีม"
            >
              สมาชิก
            </button>
          ),
        },
        {
          key: "actions",
          header: "จัดการ",
          align: "center",
          renderCell: (team) => (
            isStaff ? (
              <span className="text-slate-400">-</span>
            ) : (
              <div className="flex justify-center items-center gap-2">
                <button
                  className={editButtonClass}
                  title="แก้ไข"
                  aria-label="แก้ไข"
                >
                  แก้ไข
                </button>
                <button
                  className={deleteButtonClass}
                  onClick={() => handleDelete(team.teamID ?? 0)}
                  title="ลบ"
                  aria-label="ลบ"
                >
                  ลบ
                </button>
              </div>
            )
          ),
        },
      ]}
      rows={rows}
      rowKey={(team) =>
        team.teamID ?? `${team.school_name}-${team.nameOrdinal}`
      }
      emptyMessage="ไม่พบข้อมูล"
      count={rows.length}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      labelRowsPerPage="จำนวนทีมต่อหน้า"
    />
  );
};

export default withAdminAuth(TeamList);
