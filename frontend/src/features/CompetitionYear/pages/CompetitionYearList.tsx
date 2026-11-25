import {
  useDeleteCompetitionYearMutation,
  useGetAllCompetitionYearQuery,
} from "../CompetitionYearApi";
import { withAdminAuth } from "../../../HOC";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Loading } from "../../../components";
import { handleDownloadWordCompetitionYear } from "../../../Apis/Export";
import {
  confirmDelete,
  showError,
  showSuccessOk,
  usePagination,
} from "../../../utils";
import { AdminCrudTable } from "../../../components/admin/AdminCrudTable";
import type { CompetitionYear } from "../type";

import { useSelector } from "react-redux";
import type { RootState } from "../../../Redux/store";

const CompetitionYearsList = () => {
  const { yearId } = useParams<{ yearId: string }>();
  const location = useLocation();
  const yearName = location.state?.yearName;
  const navigate = useNavigate();

  const userData = useSelector((state: RootState) => state.userAuthStore);
  const roleLower = (userData.role || "").toLowerCase();
  const isStaff = roleLower === "staff" || roleLower === "เจ้าหน้าที่";

  const { data: CompetitionYears, isLoading } = useGetAllCompetitionYearQuery(
    Number(yearId),
  );
  const [deleteYears] = useDeleteCompetitionYearMutation();

  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  if (isLoading) return <Loading />;

  const handleAdd = () => {
    navigate(`/admin/competitionYearsList/${yearId}/new`, {
      state: { yearName },
    });
  };
  const handleEdit = (id: number) => {
    navigate(`/admin/competitionYearsList/${yearId}/edit/${id}`, {
      state: { yearName },
    });
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDelete(
      "คุณต้องการลบกิจกรรมในปีนี้ใช่หรือไม่?",
    );
    if (!isConfirmed) return;
    try {
      await deleteYears(id).unwrap();
      await showSuccessOk("ลบปีกิจกรรมในปีนี้สำเร็จ!");
    } catch {
      await showError("ไม่สามารถลบกิจกรรมในปีนี้ได้");
    }
  };

  const rows = (CompetitionYears ?? []) as CompetitionYear[];

  const editButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-yellow-400/30 transition-colors hover:bg-amber-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500";

  const deleteButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-rose-400/30 transition-colors hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500";

  const downloadButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-blue-500/30 transition-colors hover:bg-blue-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-6">
      <AdminCrudTable<CompetitionYear>
        title={`รายการจัดการเเข่งขัน ${yearName ?? ""}`}
        subtitle="จัดการกิจกรรมสำหรับปีที่เลือก"
        actions={
          <>
            {!isStaff && (
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-700/20 transition-colors hover:bg-green-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                onClick={handleAdd}
                aria-label="เพิ่มกิจกรรมในปีนี้"
                title="เพิ่มกิจกรรมในปีนี้"
              >
                เพิ่มกิจกรรมในปีนี้
              </button>
            )}
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-slate-500 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-slate-400/30 transition-colors hover:bg-slate-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              onClick={() => navigate(`/admin/year`)}
              aria-label="ย้อนกลับ"
              title="ย้อนกลับ"
            >
              ย้อนกลับ
            </button>
          </>
        }
        columns={[
          {
            key: "competitionName",
            header: "ประเภทการแข่งขัน",
            align: "left",
            renderCell: (cy) => cy.competitionName,
          },
          {
            key: "location",
            header: "สถานที่จัดกิจกรรม",
            align: "left",
            renderCell: (cy) => cy.registrationLocation,
          },
          {
            key: "levelRegistration",
            header: "ลงทะเบียนระดับชั้น",
            align: "center",
            renderCell: (cy) => (
              <button
                className="inline-flex items-center gap-2 rounded-md bg-purple-700 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-slate-500/30 transition-colors hover:bg-purple-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                onClick={() =>
                  navigate(
                    `/admin/competitionLevelList/${cy.competitionYearID}`,
                    {
                      state: {
                        yearId,
                        yearName,
                        competitionName: cy.competitionName,
                        requiresProject: cy.requiresProject,
                      },
                    },
                  )
                }
                title="จัดการระดับการแข่งขัน"
                aria-label="จัดการระดับการแข่งขัน"
              >
                ข้อมูล
              </button>
            ),
          },
          {
            key: "downloadTeams",
            header: "ดาวน์โหลดรายชื่อ",
            align: "center",
            renderCell: (cy) => (
              <button
                className={downloadButtonClass}
                onClick={() =>
                  handleDownloadWordCompetitionYear(cy.competitionYearID ?? 0)
                }
                title="ดาวน์โหลดรายชื่อทีม"
                aria-label="ดาวน์โหลดรายชื่อทีม"
              >
                ดาวน์โหลด
              </button>
            ),
          },
          {
            key: "actions",
            header: "จัดการ",
            align: "center",
            renderCell: (cy) =>
              isStaff ? (
                <span className="text-slate-400">-</span>
              ) : (
                <div className="flex justify-center items-center gap-2">
                  <button
                    className={editButtonClass}
                    onClick={() => handleEdit(cy.competitionYearID ?? 0)}
                    title="แก้ไข"
                    aria-label="แก้ไข"
                  >
                    แก้ไข
                  </button>
                  <button
                    className={deleteButtonClass}
                    onClick={() => handleDelete(cy.competitionYearID ?? 0)}
                    title="ลบ"
                    aria-label="ลบ"
                  >
                    ลบ
                  </button>
                </div>
              ),
          },
        ]}
        rows={rows}
        rowKey={(cy) =>
          cy.competitionYearID ?? `${cy.competitionID}-${cy.yearID}`
        }
        emptyMessage="ไม่มีรายการกิจกรรมในปีนี้"
        count={rows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="จำนวนรายการต่อหน้า"
      />
    </div>
  );
};

export default withAdminAuth(CompetitionYearsList);
