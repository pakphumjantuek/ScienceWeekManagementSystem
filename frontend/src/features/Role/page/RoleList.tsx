import { Loading } from "../../../components/Loading";
import { useDeleteRoleMutation, useGetAllRoleQuery } from "../roleApi";
import { RoleForm } from "./RoleForm";
import { useModal } from "../../../components/modals/ModalContext";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../utils/confirmDelete";
import { withAdminAuth } from "../../../HOC";
import { usePagination } from "../../../utils/usePagination";
import { AdminCrudTable } from "../../../components/admin/AdminCrudTable";
import type { Role } from "../type";

const RoleList = () => {
  const { data: roles, isLoading } = useGetAllRoleQuery();
  const [deleteRole] = useDeleteRoleMutation();
  const { showModal } = useModal();

  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  if (isLoading) return <Loading />;

  const handleAdd = () => {
    showModal(<RoleForm onClear={() => {}} />);
  };

  const handleEdit = (id: string) => {
    const role = roles?.find((t) => t.id === id);
    if (role) {
      showModal(<RoleForm onClear={() => {}} currentRole={role} />);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirmDelete("คุณต้องการลบสำเร็จ!");
    if (!isConfirmed) return;
    try {
      await deleteRole(id).unwrap();
      await showSuccessOk("ลบสำเร็จ!");
    } catch (error) {
      await showError("ไม่สามารถลบสำเร็จ!");
    }
  };

  const actionButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-amber-500/30 transition-colors hover:bg-amber-700 hover:shadow-md";

  const deleteButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-rose-400/30 transition-colors hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500";

  return (
    <AdminCrudTable<Role>
      title="สิทธิ์การใช้งาน"
      subtitle="จัดการรายการสิทธิ์"
      actions={
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-700/20 transition-colors hover:bg-slate-800 hover:shadow-md"
          onClick={() => handleAdd()}
          aria-label="เพิ่มสิทธิ์"
          title="เพิ่มสิทธิ์"
        >
          เพิ่มสิทธิ์
        </button>
      }
      columns={[
        {
          key: "name",
          header: "ชื่อสิทธิ์",
          renderCell: (role) => role.name,
        },
        {
          key: "actions",
          header: "จัดการ",
          align: "center",
          renderCell: (role) => (
            <div className="flex items-center justify-center gap-2">
              <button
                className={actionButtonClass}
                onClick={() => handleEdit(role.id ?? "")}
                title="แก้ไข"
                aria-label="แก้ไข"
              >
                แก้ไข
              </button>
              <button
                className={deleteButtonClass}
                onClick={() => handleDelete(role.id ?? "")}
                title="ลบ"
                aria-label="ลบ"
              >
                ลบ
              </button>
            </div>
          ),
        },
      ]}
      rows={roles ?? []}
      rowKey={(role) => role.id ?? role.name}
      emptyMessage="ไม่มีรายการสิทธิ์"
      count={roles?.length ?? 0}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      labelRowsPerPage="จำนวนรายการต่อหน้า"
    />
  );
};

export default withAdminAuth(RoleList);
