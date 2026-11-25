import { useState, useMemo } from "react";
import { Loading } from "../../../components/Loading";
import { Search } from "lucide-react";
import {
  useDeleteStudentMutation,
  useGetAllStudentQuery,
} from "../StudentApi";
import { useModal } from "../../../components/modals/ModalContext";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../utils/confirmDelete";
import { withAdminAuth } from "../../../HOC";
import { usePagination } from "../../../utils/usePagination";
import TablePagination from "@mui/material/TablePagination";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { TitlePrefix } from "../type";
import { StudentForm } from "./StudentForm";
import { useUpdateTeamStatusMutation } from "../../Team/TeamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../Redux/store";

const StudentList = () => {
  const userData = useSelector((state: RootState) => state.userAuthStore);
  const roleLower = (userData.role || "").toLowerCase();
  const isStaff = roleLower === "staff" || roleLower === "เจ้าหน้าที่";

  const { teamId } = useParams<{ teamId: string }>();
  const { data: students, isLoading } = useGetAllStudentQuery(Number(teamId));
  const [updateTeamStatus] = useUpdateTeamStatusMutation();
  const [deleteStudent] = useDeleteStudentMutation();
  const { showModal } = useModal();
  const navigate = useNavigate();
  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  const {
    competitionLevelID,
    requiresProject,
    competitionName,
    yearId,
    yearName,
    competitionYearID,
  } = (useLocation().state ?? {}) as {
    competitionLevelID?: number;
    requiresProject?: boolean;
    competitionName?: string;
    yearId?: string;
    yearName?: string;
    competitionYearID?: string | number;
  };

  const handleAdd = () => {
    showModal(<StudentForm onClear={() => {}} teamId={teamId ?? 0} />);
  };

  const handleEdit = (id: number) => {
    const student = students?.find((t) => t.studentID === id);
    if (student) {
      showModal(
        <StudentForm
          onClear={() => {}}
          teamId={teamId ?? 0}
          currentStudent={student}
        />,
      );
    }
  };

  const handleUpdateTeamStatus = async (teamID: number, status: number) => {
    const isConfirmed = await confirmDelete(
      "คุณต้องการลงทะเบียนเข้างานหรือไม่?",
    );
    if (!isConfirmed) return;
    await updateTeamStatus({ teamID, status });
    const isROV = competitionName?.toLowerCase().includes("rov");
    navigate(
      `/admin/competitionLevel/${competitionLevelID}/${
        isROV ? "matchrov" : "match"
      }`,
      {
        state: {
          requiresProject,
          competitionLevelID: Number(competitionLevelID),
          competitionName,
          yearId,
          yearName,
          competitionYearID,
        },
      },
    );

    showSuccessOk("ลงทะเบียนเข้างานสำเร็จ");
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDelete(
      "คุณต้องการลบผู้เล่นนี้ใช่หรือไม่?",
    );
    if (!isConfirmed) return;
    try {
      await deleteStudent(id).unwrap();
      await showSuccessOk("ลบผู้เล่นสำเร็จ!");
    } catch (error) {
      await showError("ไม่สามารถลบผู้เล่นนี้ได้");
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!searchTerm.trim()) return students;
    const query = searchTerm.toLowerCase().trim();
    return students.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      return fullName.includes(query);
    });
  }, [students, searchTerm]);

  const pagedStudents =
    filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (isLoading) return <Loading />;
  return (
    <div className="min-h-screen w-full bg-white">
      {/* Header */}
      <div className="mx-auto max-w-8xl px-4 pt-8 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          จัดการผู้เล่น
        </h1>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          {/* Left buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!isStaff && (
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 hover:bg-green-700 hover:shadow-md focus:outline-none focus:ring-2"
                onClick={handleAdd}
              >
                เพิ่มผู้เล่น
              </button>
            )}
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-slate-500 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 hover:bg-slate-600 hover:shadow-md focus:outline-none focus:ring-2"
              onClick={() => {
                const isROV = competitionName?.toLowerCase().includes("rov");
                navigate(
                  `/admin/competitionLevel/${competitionLevelID}/${
                    isROV ? "matchrov" : "match"
                  }`,
                  {
                    state: {
                      requiresProject,
                      competitionName,
                      competitionLevelID: Number(competitionLevelID),
                      yearId,
                      yearName,
                      competitionYearID,
                    },
                  },
                );
              }}
            >
              ย้อนกลับ
            </button>
          </div>

          {/* Right button & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้เล่น..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2"
              onClick={() => handleUpdateTeamStatus(Number(teamId), 3)}
            >
              ลงทะเบียนเข้างาน
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto max-w-8xl px-4 pb-10">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm text-slate-900 border border-slate-300 border-collapse">
              <thead className="bg-blue-600/95 text-white">
                <tr>
                  <th className="px-6 py-3.5 text-center text-[13px] font-semibold uppercase border-l border-slate-300 first:border-l-0">
                    คำนำหน้า
                  </th>
                  <th className="px-6 py-3.5 text-center text-[13px] font-semibold uppercase border-l border-slate-300 first:border-l-0">
                    ชื่อ-นามสกุล
                  </th>
                  <th className="px-6 py-3.5 text-center text-[13px] font-semibold uppercase border-l border-slate-300 first:border-l-0">
                    บทบาท
                  </th>
                  <th className="px-6 py-3.5 text-center text-[13px] font-semibold uppercase border-l border-slate-300 first:border-l-0">
                    จัดการ
                  </th>
                </tr>
              </thead>

              <tbody className="[&>tr:nth-child(odd)]:bg-white [&>tr:nth-child(even)]:bg-slate-100 [&>tr:hover]:bg-slate-100">
                {pagedStudents.map((student) => (
                  <tr
                    key={student.studentID}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3.5 border-t border-l border-slate-300 first:border-l-0">
                      {
                        TitlePrefix.find((t) => t.value === student.titlePrefix)
                          ?.label
                      }
                    </td>
                    <td className="px-6 py-3.5 border-t border-l border-slate-300 first:border-l-0">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-6 py-3.5 border-t border-l border-slate-300 first:border-l-0 text-center">
                      {student.isMainMember ? "ตัวจริง" : "ตัวสำรอง"}
                    </td>

                    <td className="px-6 py-3.5 text-center border-t border-l border-slate-300 first:border-l-0">
                      <div className="flex justify-center items-center gap-2">
                        {isStaff ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <>
                            <button
                              className="inline-flex items-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-xs font-medium text-white shadow-sm ring-1 hover:bg-yellow-700 hover:shadow-md"
                              onClick={() => handleEdit(student.studentID ?? 0)}
                              title="แก้ไข"
                              aria-label="แก้ไข"
                            >
                              แก้ไข
                            </button>
                            <button
                              className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white shadow-sm ring-1 ring-rose-400/30 hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                              onClick={() =>
                                handleDelete(student.studentID ?? 0)
                              }
                              title="ลบ"
                              aria-label="ลบ"
                            >
                              ลบ
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {students && students.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-600 border-t border-slate-300"
                    >
                      ไม่มีรายการผู้เล่น
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2">
            <TablePagination
              component="div"
              count={filteredStudents.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="จำนวนผู้เล่นต่อหน้า"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAdminAuth(StudentList);
