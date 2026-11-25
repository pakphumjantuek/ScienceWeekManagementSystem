import { Loading } from "../../../components/Loading";
import {
  useDeleteCompetitionMutation,
  useGetAllCompetitionQuery,
} from "../CompetitionApi";
import { CompetitionForm } from "./CompetitionForm";
import { useModal } from "../../../components/modals/ModalContext";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../utils/confirmDelete";
import { withAdminAuth } from "../../../HOC";
import { usePagination } from "../../../utils/usePagination";
import { AdminCrudTable } from "../../../components/admin/AdminCrudTable";
import type { Competition } from "../type";

import { useSelector } from "react-redux";
import type { RootState } from "../../../Redux/store";

const YearList = () => {
  const { data: competitions, isLoading } = useGetAllCompetitionQuery();
  const [deletecompetitions] = useDeleteCompetitionMutation();
  const { showModal } = useModal();

  const userData = useSelector((state: RootState) => state.userAuthStore);
  const roleLower = (userData.role || "").toLowerCase();
  const isStaff = roleLower === "staff" || roleLower === "เจ้าหน้าที่";

  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  if (isLoading) return <Loading />;

  const handleAdd = () => {
    showModal(<CompetitionForm onClear={() => {}} />);
  };

  const handleEdit = (id: number) => {
    const competition = competitions?.find((t) => t.competitionID === id);
    if (competition) {
      showModal(
        <CompetitionForm onClear={() => {}} currentCompetition={competition} />,
      );
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDelete(
      "คุณต้องการลบกิจกรรมการแข่งขันนี้ใช่หรือไม่?",
    );
    if (!isConfirmed) return;
    try {
      await deletecompetitions(id).unwrap();
      await showSuccessOk("ลบกิจกรรมการแข่งขันสำเร็จ!");
    } catch (error) {
      await showError("ไม่สามารถลบกิจกรรมการแข่งขันได้");
    }
  };

  const rows = (competitions ?? []) as Competition[];

  const editButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 transition-colors hover:bg-amber-700 hover:shadow-md";

  const deleteButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-rose-400/30 transition-colors hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500";

  return (
    <AdminCrudTable<Competition>
      title="กิจกรรมการแข่งขัน"
      subtitle="จัดการรายการกิจกรรมการแข่งขันทั้งหมด"
      actions={
        !isStaff ? (
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-700/20 transition-colors hover:bg-slate-800 hover:shadow-md"
            onClick={handleAdd}
            aria-label="เพิ่มกิจกรรมการแข่งขัน"
            title="เพิ่มกิจกรรมการแข่งขัน"
          >
            เพิ่มกิจกรรมการแข่งขัน
          </button>
        ) : undefined
      }
      columns={[
        {
          key: "competitionName",
          header: "ชื่อการแข่งขัน",
          renderCell: (competition) => competition.competitionName,
        },
        {
          key: "competitionTypeName",
          header: "ประเภทการแข่งขัน",
          renderCell: (competition) => competition.competitionTypeName,
        },
        {
          key: "requiresProject",
          header: "ส่งโครงงานหรือไม่",
          align: "center",
          renderCell: (competition) => (
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${
                competition.requiresProject
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-slate-100 text-slate-700 ring-slate-300"
              }`}
            >
              {competition.requiresProject ? "ต้องส่งโครงงาน" : "ไม่ต้องส่ง"}
            </span>
          ),
        },
        {
          key: "actions",
          header: "จัดการ",
          align: "center",
          renderCell: (competition) => (
            isStaff ? (
              <span className="text-slate-400">-</span>
            ) : (
              <div className="flex justify-center items-center gap-2">
                <button
                  className={editButtonClass}
                  onClick={() => handleEdit(competition.competitionID ?? 0)}
                  title="แก้ไข"
                  aria-label="แก้ไข"
                >
                  แก้ไข
                </button>
                <button
                  className={deleteButtonClass}
                  onClick={() => handleDelete(competition.competitionID ?? 0)}
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
      rowKey={(competition) =>
        competition.competitionID ?? competition.competitionName
      }
      emptyMessage="ไม่มีรายการกิจกรรมการแข่งขัน"
      count={rows.length}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      labelRowsPerPage="จำนวนรายการต่อหน้า"
    />
  );
};

export default withAdminAuth(YearList);
