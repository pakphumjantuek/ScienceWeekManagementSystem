import { Loading } from "../../../components/Loading";
import {
  useDeleteEducationLevelMutation,
  useGetAllEducationLevelQuery,
} from "../EducationLevelApi";
import { EducationLevelForm } from "./EducationLevelForm";
import { useModal } from "../../../components/modals/ModalContext";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../utils/confirmDelete";
import { withAdminAuth } from "../../../HOC";
import { usePagination } from "../../../utils/usePagination";
import { AdminCrudTable } from "../../../components/admin/AdminCrudTable";
import type { EducationLevel } from "../type";

import { useSelector } from "react-redux";
import type { RootState } from "../../../Redux/store";

const EducationLevelList = () => {
  const { data: educationLevels, isLoading } = useGetAllEducationLevelQuery();
  const [deleteEducationLevel] = useDeleteEducationLevelMutation();
  const { showModal } = useModal();

  const userData = useSelector((state: RootState) => state.userAuthStore);
  const roleLower = (userData.role || "").toLowerCase();
  const isStaff = roleLower === "staff" || roleLower === "เจ้าหน้าที่";

  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  if (isLoading) return <Loading />;

  const handleAdd = () => {
    showModal(<EducationLevelForm onClear={() => {}} />);
  };

  const handleEdit = (id: number) => {
    const educationLevel = educationLevels?.find((t) => t.levelID === id);
    if (educationLevel) {
      showModal(
        <EducationLevelForm
          onClear={() => {}}
          currentEducationLevel={educationLevel}
        />,
      );
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDelete(
      "คุณต้องการลบระดับชั้นนี้ใช่หรือไม่?",
    );
    if (!isConfirmed) return;
    try {
      await deleteEducationLevel(id).unwrap();
      await showSuccessOk("ลบระดับชั้นสำเร็จ!");
    } catch (error) {
      await showError("ไม่สามารถลบระดับชั้นได้");
    }
  };

  const editButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 hover:shadow-md";

  const deleteButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-rose-400/30 transition-colors hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500";

  return (
    <AdminCrudTable<EducationLevel>
      title="ระดับชั้น"
      subtitle="จัดการรายการระดับชั้นการแข่งขัน"
      actions={
        !isStaff ? (
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-700/20 transition-colors hover:bg-slate-800 hover:shadow-md"
            onClick={handleAdd}
            aria-label="เพิ่มระดับชั้นการแข่งขัน"
            title="เพิ่มระดับชั้นการแข่งขัน"
          >
            เพิ่มระดับชั้นการแข่งขัน
          </button>
        ) : undefined
      }
      columns={[
        {
          key: "name",
          header: "ระดับชั้น",
          renderCell: (educationLevel) => educationLevel.levelName,
        },
        {
          key: "actions",
          header: "จัดการ",
          align: "center",
          renderCell: (educationLevel) => (
            isStaff ? (
              <span className="text-slate-400">-</span>
            ) : (
              <div className="flex justify-center items-center gap-2">
                <button
                  className={editButtonClass}
                  onClick={() => handleEdit(educationLevel.levelID ?? 0)}
                  title="แก้ไข"
                  aria-label="แก้ไข"
                >
                  แก้ไข
                </button>
                <button
                  className={deleteButtonClass}
                  onClick={() => handleDelete(educationLevel.levelID ?? 0)}
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
      rows={educationLevels ?? []}
      rowKey={(educationLevel) =>
        educationLevel.levelID ?? educationLevel.levelName
      }
      emptyMessage="ไม่มีรายการระดับชั้น"
      count={educationLevels?.length ?? 0}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      labelRowsPerPage="จำนวนรายการต่อหน้า"
    />
  );
};

export default withAdminAuth(EducationLevelList);
