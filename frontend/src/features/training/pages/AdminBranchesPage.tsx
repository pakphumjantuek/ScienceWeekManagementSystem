import { useState } from "react";
import { 
  useGetBranchesQuery, 
  useCreateBranchMutation, 
  useUpdateBranchMutation, 
  useDeleteBranchMutation 
} from "../trainingApi";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  Save
} from "lucide-react";
import { showSuccessOk, showError } from "../../../utils/confirmDelete";
import Swal from "sweetalert2";
import type { Branch } from "../type";
import { AdminCrudTable } from "../../../components/admin/AdminCrudTable";
import { usePagination } from "../../../utils/usePagination";

const AdminBranchesPage = () => {
  const { data: branches = [], isLoading, refetch } = useGetBranchesQuery();
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [name, setName] = useState("");

  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setName("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setName(branch.name);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingBranch) {
        await updateBranch({ id: editingBranch.id, body: { name } }).unwrap();
        showSuccessOk("แก้ไขสาขาวิชาเรียบร้อยแล้ว");
      } else {
        await createBranch({ name }).unwrap();
        showSuccessOk("เพิ่มสาขาวิชาใหม่เรียบร้อยแล้ว");
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      showError(err?.data?.errorMessages?.[0] || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleDelete = async (branch: Branch) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: `คุณต้องการลบสาขาวิชา "${branch.name}" ใช่หรือไม่? (หลักสูตรที่เชื่อมโยงกับสาขานี้จะถูกเปลี่ยนเป็นไม่มีสาขา)`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ใช่, ลบเลย",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await deleteBranch(branch.id).unwrap();
        showSuccessOk("ลบสาขาวิชาสำเร็จ");
        refetch();
      } catch (err: any) {
        showError(err?.data?.errorMessages?.[0] || "ไม่สามารถลบข้อมูลได้ในขณะนี้");
      }
    }
  };

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const editButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm ring-1 transition-colors hover:bg-amber-700 hover:shadow-md";

  const deleteButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-rose-400/30 transition-colors hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-slate-500 text-sm">กำลังโหลดข้อมูลสาขาวิชา...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminCrudTable<Branch>
        title="จัดการสาขาวิชา"
        subtitle="บริหารจัดการสาขาวิชาการสำหรับการจัดกลุ่มโครงการอบรมและสัมมนา"
        actions={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-700/20 transition-colors hover:bg-slate-800 hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              เพิ่มสาขาวิชาใหม่
            </button>

            <div className="relative flex w-full items-center justify-end sm:w-80">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center justify-end">
                <Search className="h-5 w-5 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="ค้นหา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-10 py-2 text-sm text-slate-800 shadow-sm outline-none transition-all focus:border-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        }
        columns={[
          {
            key: "name",
            header: "ชื่อสาขาวิชา",
            renderCell: (branch) => (
              <span className="font-semibold text-slate-800">{branch.name}</span>
            ),
          },
          {
            key: "actions",
            header: "จัดการ",
            align: "center",
            cellClassName: "w-36",
            renderCell: (branch) => (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(branch)}
                  className={editButtonClass}
                  title="แก้ไข"
                >
                  <Edit2 className="h-4 w-4" />
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(branch)}
                  className={deleteButtonClass}
                  title="ลบ"
                >
                  <Trash2 className="h-4 w-4" />
                  ลบ
                </button>
              </div>
            ),
          },
        ]}
        rows={filteredBranches}
        rowKey={(branch) => branch.id}
        emptyMessage="ไม่พบสาขาวิชา"
        count={filteredBranches.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">
                {editingBranch ? "แก้ไขสาขาวิชา" : "เพิ่มสาขาวิชาใหม่"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">ชื่อสาขาวิชา *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none ring-1 ring-slate-100 transition focus:border-emerald-500"
                  placeholder="เช่น สาขาวิชาเคมี"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-500"
                >
                  <Save className="h-4 w-4" />
                  {isCreating || isUpdating ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBranchesPage;
