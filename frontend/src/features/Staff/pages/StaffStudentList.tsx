import { Loading } from "../../../components/Loading";
import {
  useGetAllStudentQuery,
  useDeleteStudentMutation,
} from "../../student/StudentApi";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../utils/confirmDelete";
import { withStaffAuth } from "../../../HOC";
import { usePagination } from "../../../utils/usePagination";
import TablePagination from "@mui/material/TablePagination";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { TitlePrefix } from "../../student/type";
import { useUpdateTeamStatusMutation } from "../../Team/TeamApi";
import { useModal } from "../../../components/modals/ModalContext";
import { StudentForm } from "../../student/pages/StudentForm";
import { Plus, Edit3, Trash2 } from "lucide-react";

const StaffStudentList = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { data: students, isLoading } = useGetAllStudentQuery(Number(teamId));
  const [updateTeamStatus] = useUpdateTeamStatusMutation();
  const [deleteStudent] = useDeleteStudentMutation();
  const { showModal } = useModal();
  const navigate = useNavigate();
  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage } =
    usePagination();

  const {
    currentTeam,
    competitionLevelID,
    requiresProject,
    competitionName,
    yearId,
    yearName,
    competitionYearID,
  } = (useLocation().state ?? {}) as {
    currentTeam?: any;
    competitionLevelID?: number;
    requiresProject?: boolean;
    competitionName?: string;
    yearId?: string;
    yearName?: string;
    competitionYearID?: string | number;
  };

  const handleAdd = () => {
    showModal(<StudentForm onClear={() => {}} teamId={Number(teamId) || 0} />);
  };

  const handleEdit = (id: number) => {
    const student = students?.find((t) => t.studentID === id);
    if (student) {
      showModal(
        <StudentForm
          onClear={() => {}}
          teamId={Number(teamId) || 0}
          currentStudent={student}
        />
      );
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDelete(
      "คุณต้องการลบผู้เล่นนี้ใช่หรือไม่?"
    );
    if (!isConfirmed) return;
    try {
      await deleteStudent(id).unwrap();
      await showSuccessOk("ลบผู้เล่นสำเร็จ!");
    } catch {
      await showError("ไม่สามารถลบผู้เล่นได้");
    }
  };

  const handleUpdateTeamStatus = async (teamID: number, status: number) => {
    const isConfirmed = await confirmDelete(
      "คุณต้องการลงทะเบียนเข้างานหรือไม่?"
    );
    if (!isConfirmed) return;
    await updateTeamStatus({ teamID, status });
    const isROV = competitionName?.toLowerCase().includes("rov");
    navigate(
      `/staff/competitionLevel/${competitionLevelID}/${
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
      }
    );

    showSuccessOk("ลงทะเบียนเข้างานสำเร็จ");
  };

  const pagedStudents =
    students?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) ?? [];

  if (isLoading) return <Loading />;
  return (
    <div className="min-h-screen w-full bg-white">
      {/* Header */}
      <div className="mx-auto max-w-8xl px-4 pt-8 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          จัดการผู้เล่น (สิทธิ์เจ้าหน้าที่)
        </h1>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {/* Left buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-slate-500 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 hover:bg-slate-600 hover:shadow-md focus:outline-none focus:ring-2"
              onClick={() =>
                navigate(`/staff/competitionLevel/${competitionLevelID}/match`, {
                  state: {
                    requiresProject,
                    competitionName,
                    competitionLevelID,
                    yearId,
                    yearName,
                    competitionYearID,
                  },
                })
              }
            >
              ย้อนกลับ
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2"
              onClick={handleAdd}
            >
              <Plus className="w-4 h-4" />
              เพิ่มผู้เล่น
            </button>
            {currentTeam && (
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 hover:bg-amber-600 hover:shadow-md focus:outline-none focus:ring-2"
                onClick={() =>
                  navigate(`/staff/adminform`, {
                    state: {
                      returnUrl: `/staff/student/${teamId}`,
                      currentTeam,
                      requiresProject,
                      competitionName,
                      yearId,
                      yearName,
                      competitionYearID,
                      school_name: currentTeam.school_name,
                      school_Code: currentTeam.school_code,
                      competitionLevelID: Number(competitionLevelID),
                    },
                  })
                }
              >
                <Edit3 className="w-4 h-4" />
                แก้ไขข้อมูลทีม / อาจารย์ที่ปรึกษา
              </button>
            )}
          </div>

          {/* Right button */}
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2"
            onClick={() => handleUpdateTeamStatus(Number(teamId), 3)}
          >
            ลงทะเบียนเข้างาน
          </button>
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
                    การจัดการ
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
                    <td className="px-6 py-3.5 border-t border-l border-slate-300 first:border-l-0 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(student.studentID ?? 0)}
                          className="inline-flex items-center gap-1 rounded bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(student.studentID ?? 0)}
                          className="inline-flex items-center gap-1 rounded bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {students && students.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
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
              count={students?.length ?? 0}
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

export default withStaffAuth(StaffStudentList);
