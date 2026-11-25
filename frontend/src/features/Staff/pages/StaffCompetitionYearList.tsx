import { useGetAllCompetitionYearQuery } from "../../CompetitionYear/CompetitionYearApi";
import { withStaffAuth } from "../../../HOC";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Loading } from "../../../components";
import { handleDownloadWordCompetitionYear } from "../../../Apis/Export";
import { usePagination } from "../../../utils";
import { AdminCrudTable } from "../../../components/admin/AdminCrudTable";
import type { CompetitionYear } from "../../CompetitionYear/type";

const StaffCompetitionYearsList = () => {
  const { yearId } = useParams<{ yearId: string }>();
  const location = useLocation();
  const yearName = location.state?.yearName;
  const navigate = useNavigate();

  const { data: CompetitionYears, isLoading } = useGetAllCompetitionYearQuery(
    Number(yearId),
  );

  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  if (isLoading) return <Loading />;

  const rows = (CompetitionYears ?? []) as CompetitionYear[];

  const downloadButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-indigo-500/30 transition-colors hover:bg-indigo-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="space-y-6">
      <AdminCrudTable<CompetitionYear>
        title={`รายการจัดการเเข่งขัน ${yearName ?? ""}`}
        subtitle="จัดการกิจกรรมสำหรับปีที่เลือก (สิทธิ์เจ้าหน้าที่)"
        actions={
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-slate-500 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-slate-400/30 transition-colors hover:bg-slate-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            onClick={() => navigate(`/staff/year`)}
            aria-label="ย้อนกลับ"
            title="ย้อนกลับ"
          >
            ย้อนกลับ
          </button>
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
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-green-400/30 transition-colors hover:bg-green-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                onClick={() =>
                  navigate(
                    `/staff/competitionLevelList/${cy.competitionYearID}`,
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
                คลิกดูข้อมูล
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

export default withStaffAuth(StaffCompetitionYearsList);
