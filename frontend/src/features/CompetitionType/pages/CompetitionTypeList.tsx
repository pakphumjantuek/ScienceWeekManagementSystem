import { Loading } from "../../../components/Loading";
import {
  useDeleteCompetitionTypeMutation,
  useGetAllCompetitionTypeQuery,
} from "../CompetitionTypeApi";
import { useModal } from "../../../components/modals/ModalContext";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../utils/confirmDelete";
import { withAdminAuth } from "../../../HOC";
import { CompetitionTypeForm } from "./CompetitionTypeForm";
import { usePagination } from "../../../utils/usePagination";
import { AdminCrudTable } from "../../../components/admin/AdminCrudTable";
import type { CompetitionType } from "../type";

const YearList = () => {
  const { data: CompetitionType, isLoading } = useGetAllCompetitionTypeQuery();
  const [deleteCompetitionType] = useDeleteCompetitionTypeMutation();
  const { showModal } = useModal();
  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  if (isLoading) return <Loading />;

  const handleAdd = () => {
    showModal(<CompetitionTypeForm onClear={() => {}} />);
  };
  const handleEdit = (id: number) => {
    const competitionType = CompetitionType?.find(
      (t) => t.competitionTypeID === id,
    );
    if (competitionType) {
      showModal(
        <CompetitionTypeForm
          onClear={() => {}}
          currentCompetitionType={competitionType}
        />,
      );
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDelete(
      "คุณต้องการลบประเภทการเเข่งขันนี้ใช่หรือไม่?",
    );
    if (!isConfirmed) return;
    try {
      await deleteCompetitionType(id).unwrap();
      await showSuccessOk("ลบประเภทการเเข่งขันสำเร็จ!");
    } catch (error) {
      await showError("ไม่สามารถลบประเภทการเเข่งขันได้");
    }
  };

  const editButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 transition-colors hover:bg-amber-700 hover:shadow-md";

  const deleteButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 transition-colors hover:bg-rose-700 hover:shadow-md";

  return (
    <AdminCrudTable<CompetitionType>
      title="ประเภทการแข่งขัน"
      subtitle="จัดการรายการประเภทการแข่งขัน"
      actions={
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-700/20 transition-colors hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-2"
          onClick={handleAdd}
          aria-label="เพิ่มประเภทการแข่งขัน"
          title="เพิ่มประเภทการแข่งขัน"
        >
          เพิ่มประเภทการแข่งขัน
        </button>
      }
      columns={[
        {
          key: "name",
          header: "ชื่อประเภทการแข่งขัน",
          renderCell: (competitionType) => competitionType.competitionTypeName,
        },
        {
          key: "actions",
          header: "จัดการ",
          align: "center",
          renderCell: (competitionType) => (
            <div className="flex justify-center items-center gap-2">
              <button
                className={editButtonClass}
                onClick={() =>
                  handleEdit(competitionType.competitionTypeID ?? 0)
                }
                title="แก้ไข"
                aria-label="แก้ไข"
              >
                แก้ไข
              </button>
              <button
                className={deleteButtonClass}
                onClick={() =>
                  handleDelete(competitionType.competitionTypeID ?? 0)
                }
                title="ลบ"
                aria-label="ลบ"
              >
                ลบ
              </button>
            </div>
          ),
        },
      ]}
      rows={CompetitionType ?? []}
      rowKey={(competitionType) =>
        competitionType.competitionTypeID ?? competitionType.competitionTypeName
      }
      emptyMessage="ไม่มีรายการประเภทการแข่งขัน"
      count={CompetitionType?.length ?? 0}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      labelRowsPerPage="จำนวนรายการต่อหน้า"
    />
  );
};

export default withAdminAuth(YearList);
