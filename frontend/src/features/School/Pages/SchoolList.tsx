import { Loading } from "../../../components/Loading";
import { useDeleteSchoolMutation, useGetAllSchoolQuery } from "../SchoolApi";
import { useModal } from "../../../components/modals/ModalContext";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../utils/confirmDelete";
import { withAdminAuth } from "../../../HOC";
import { usePagination } from "../../../utils/usePagination";
import { SchoolForm } from "./SchoolForm";
import useFilteredData from "../../../components/useFilteredData";
import { useEffect } from "react";
import { AdminCrudTable } from "../../../components/admin/AdminCrudTable";
import type { School } from "../type";

const SchoolList = () => {
  const { data: schools = [], isLoading } = useGetAllSchoolQuery();
  const [deleteSchool] = useDeleteSchoolMutation();
  const { showModal } = useModal();

  const {
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    setPage,
  } = usePagination({ storageKey: `school-list` });

  const { searchTerm, setSearchTerm, filteredData } = useFilteredData(schools, [
    "school_name",
    "subdistrict",
    "district",
    "province",
  ]);

  useEffect(() => {
    const total = filteredData?.length ?? 0;
    const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [filteredData?.length, rowsPerPage, page, setPage]);

  if (isLoading) return <Loading />;

  const handleAdd = () => {
    showModal(<SchoolForm onClear={() => {}} />);
  };
  const handleEdit = (id: number) => {
    const school = schools?.find((t: any) => t.school_code === id);
    if (school) {
      showModal(<SchoolForm onClear={() => {}} currentSchool={school} />);
    }
  };
  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDelete(
      "คุณต้องการลบโรงเรียนนี้ใช่หรือไม่?",
    );
    if (!isConfirmed) return;
    try {
      await deleteSchool(id).unwrap();
      await showSuccessOk("ลบโรงเรียนสำเร็จ!");
    } catch {
      await showError("ไม่สามารถลบโรงเรียนนี้ได้");
    }
  };

  const total = filteredData.length; // จำนวนหลังกรอง ใช้กับ pagination

  const rows = (filteredData ?? []) as School[];

  const editButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 transition-colors hover:bg-amber-700 hover:shadow-md";

  const deleteButtonClass =
    "inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-rose-400/30 transition-colors hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500";

  return (
    <AdminCrudTable<School>
      title="จัดการโรงเรียน"
      actions={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-700/20 transition-colors hover:bg-slate-800 hover:shadow-md"
            onClick={handleAdd}
            aria-label="เพิ่มโรงเรียน"
            title="เพิ่มโรงเรียน"
          >
            เพิ่มโรงเรียน
          </button>
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
              placeholder="ค้นหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-10 py-2.5 text-base text-slate-800 shadow-sm outline-none transition-all focus:border-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-200"
              aria-label="ค้นหา"
            />
          </div>
        </div>
      }
      columns={[
        {
          key: "index",
          header: "ลำดับ",
          align: "center",
          renderCell: (school) => {
            const indexInFiltered = rows.findIndex(
              (r) => r.school_code === school.school_code,
            );
            return page * rowsPerPage + indexInFiltered + 1;
          },
        },
        {
          key: "school_name",
          header: "ชื่อโรงเรียน",
          align: "center",
          renderCell: (school) => school.school_name,
        },
        {
          key: "subdistrict",
          header: "ตำบล",
          align: "center",
          renderCell: (school) => school.subdistrict,
        },
        {
          key: "district",
          header: "อำเภอ",
          align: "center",
          renderCell: (school) => school.district,
        },
        {
          key: "province",
          header: "จังหวัด",
          align: "center",
          renderCell: (school) => school.province,
        },
        {
          key: "actions",
          header: "จัดการ",
          align: "center",
          renderCell: (school) => (
            <div className="flex justify-center items-center gap-2">
              <button
                className={editButtonClass}
                onClick={() => handleEdit(school.school_code || 0)}
                title="แก้ไข"
                aria-label="แก้ไข"
              >
                แก้ไข
              </button>
              <button
                className={deleteButtonClass}
                onClick={() => handleDelete(school.school_code || 0)}
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
      rowKey={(school) => school.school_code ?? school.school_name}
      emptyMessage="ไม่พบโรงเรียน"
      count={total}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      labelRowsPerPage="จำนวนโรงเรียนต่อหน้า"
    />
  );
};

export default withAdminAuth(SchoolList);
