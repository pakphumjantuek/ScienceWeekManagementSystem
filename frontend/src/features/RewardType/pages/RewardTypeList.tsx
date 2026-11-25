import { Loading } from "../../../components/Loading";
import {
  useDeleteRewardTypeMutation,
  useGetAllRewardTypeQuery,
} from "../RewardTypeApi";
import { RewardTypeForm } from "./RewardTypeForm";
import { useModal } from "../../../components/modals/ModalContext";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../utils/confirmDelete";
import { withAdminAuth } from "../../../HOC";
import { usePagination } from "../../../utils/usePagination";
import { AdminCrudTable } from "../../../components/admin/AdminCrudTable";
import type { RewardType } from "../type";

const RewardTypeList = () => {
  const { data: rewardTypes, isLoading } = useGetAllRewardTypeQuery();
  const [deleteRewardType] = useDeleteRewardTypeMutation();
  const { showModal } = useModal();

  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  if (isLoading) return <Loading />;

  const handleAdd = () => {
    showModal(<RewardTypeForm onClear={() => {}} />);
  };

  const handleEdit = (id: number) => {
    const rewardType = rewardTypes?.find((t) => t.rewardTypeID === id);
    if (rewardType) {
      showModal(
        <RewardTypeForm onClear={() => {}} currentRewardType={rewardType} />,
      );
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDelete(
      "คุณต้องการลบประเภทรางวัลใช่หรือไม่?",
    );
    if (!isConfirmed) return;
    try {
      await deleteRewardType(id).unwrap();
      await showSuccessOk("ลบประเภทรางวัลสำเร็จ!");
    } catch (error) {
      await showError("ไม่สามารถลบประเภทรางวัลได้");
    }
  };

  const editButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 transition-colors hover:bg-amber-700 hover:shadow-md";

  const deleteButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-rose-400/30 transition-colors hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500";

  return (
    <AdminCrudTable<RewardType>
      title="ประเภทรางวัล"
      subtitle="จัดการรายการประเภทรางวัล"
      actions={
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-700/20 transition-colors hover:bg-slate-800 hover:shadow-md"
          onClick={handleAdd}
          aria-label="เพิ่มประเภทรางวัล"
          title="เพิ่มประเภทรางวัล"
        >
          เพิ่มประเภทรางวัล
        </button>
      }
      columns={[
        {
          key: "name",
          header: "ชื่อรางวัล",
          renderCell: (rewardType) => rewardType.rewardTypeName,
        },
        {
          key: "actions",
          header: "จัดการ",
          align: "center",
          renderCell: (rewardType) => (
            <div className="flex justify-center items-center gap-2">
              <button
                className={editButtonClass}
                onClick={() => handleEdit(rewardType.rewardTypeID ?? 0)}
                title="แก้ไข"
                aria-label="แก้ไข"
              >
                แก้ไข
              </button>
              <button
                className={deleteButtonClass}
                onClick={() => handleDelete(rewardType.rewardTypeID ?? 0)}
                title="ลบ"
                aria-label="ลบ"
              >
                ลบ
              </button>
            </div>
          ),
        },
      ]}
      rows={rewardTypes ?? []}
      rowKey={(rewardType) =>
        rewardType.rewardTypeID ?? rewardType.rewardTypeName
      }
      emptyMessage="ไม่มีรายการประเภทรางวัล"
      count={rewardTypes?.length ?? 0}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      labelRowsPerPage="จำนวนรายการต่อหน้า"
    />
  );
};

export default withAdminAuth(RewardTypeList);
