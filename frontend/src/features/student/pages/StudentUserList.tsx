import { Loading } from "../../../components/Loading";
import { useDeleteStudentMutation, useGetAllStudentQuery } from "../StudentApi";
import { useModal } from "../../../components/modals/ModalContext";
import {
  confirmDelete,
  showError,
  showSuccess,
} from "../../../utils/confirmDelete";
import { withAuth } from "../../../HOC";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  UserPlus,
  Edit3,
  Trash2,
  ArrowLeft,
  Users,
  Star,
  UserCheck,
  Download,
} from "lucide-react";
import { handleDownloadCertificateStudent } from "../../../Apis/Export";
import { StudentForm } from "./StudentForm";

import { useSelector } from "react-redux";
import type { RootState } from "../../../Redux/store";
import { jwtDecode } from "jwt-decode";
import { useMemo } from "react";

const StudentUserList = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const locationState = (useLocation().state ?? {}) as {
    status?: number;
    registrationCloseDate?: string;
  };
  const status = locationState.status;
  const registrationCloseDate = locationState.registrationCloseDate;

  const { data: students, isLoading } = useGetAllStudentQuery(Number(teamId));
  const [deleteStudent] = useDeleteStudentMutation();
  const { showModal } = useModal();
  const navigate = useNavigate();

  const userRole = useSelector((state: RootState) => state.userAuthStore.role);
  const isStaffOrAdmin = useMemo(() => {
    let role = userRole || "";
    if (!role) {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          role =
            decoded?.role ||
            decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
            decoded?.Role ||
            "";
        } catch (e) {
          console.error(e);
        }
      }
    }
    const r = String(role).toLowerCase();
    return (
      r === "admin" ||
      r === "staff" ||
      r === "เจ้าหน้าที่" ||
      r === "ผู้ดูแลระบบ" ||
      r.includes("admin") ||
      r.includes("staff")
    );
  }, [userRole]);

  const deadlineEndOfDay = useMemo(() => {
    if (!registrationCloseDate) return null;
    const deadlineDate = new Date(registrationCloseDate);
    if (Number.isNaN(deadlineDate.getTime())) return null;
    const hasTime =
      registrationCloseDate.includes("T") || registrationCloseDate.includes(":");
    if (!hasTime) {
      deadlineDate.setHours(23, 59, 59, 999);
    }
    return deadlineDate;
  }, [registrationCloseDate]);

  const isEditBlocked =
    !!deadlineEndOfDay && new Date() > deadlineEndOfDay && !isStaffOrAdmin;

  if (isLoading) return <Loading />;

  const handleAdd = () => {
    showModal(<StudentForm onClear={() => {}} teamId={teamId ?? 0} />);
  };

  const handleEdit = (id: number) => {
    const student = students?.find((s) => s.studentID === id);
    if (student) {
      showModal(
        <StudentForm
          currentStudent={student}
          teamId={teamId}
          onClear={() => {}}
        />
      );
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = await confirmDelete("คุณต้องการลบผู้เล่นนี้ใช่หรือไม่?");
    if (!confirm) return;
    try {
      await deleteStudent(id).unwrap();
      await showSuccess("ลบผู้เล่นสำเร็จ!");
    } catch {
      await showError("ไม่สามารถลบผู้เล่นนี้ได้");
    }
  };

  const mainMembers = students?.filter((s) => s.isMainMember) || [];
  const reserveMembers = students?.filter((s) => !s.isMainMember) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-md flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                จัดการผู้เล่น
              </h1>
              <p className="text-slate-600 text-sm">สมาชิกในทีมแข่งขัน</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="inline w-4 h-4 mr-1" />
              ย้อนกลับ
            </button>
            {!isEditBlocked && (
              <button
                onClick={handleAdd}
                className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium"
              >
                <UserPlus className="inline w-4 h-4 mr-2" />
                เพิ่มผู้เล่น
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: <Users className="w-6 h-6 text-indigo-600" />,
              label: "ผู้เล่นทั้งหมด",
              value: students?.length || 0,
            },
            {
              icon: <Star className="w-6 h-6 text-green-600" />,
              label: "ตัวจริง",
              value: mainMembers.length,
            },
            {
              icon: <UserCheck className="w-6 h-6 text-amber-600" />,
              label: "ตัวสำรอง",
              value: reserveMembers.length,
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-md p-5 flex items-center gap-4 shadow-sm"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-xl font-semibold text-slate-800">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Main Members */}
        {mainMembers.length > 0 && (
          <section>
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                ผู้เล่นตัวจริง
              </h2>
              <span className="ml-3 px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                {mainMembers.length} คน
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {mainMembers.map((student) => (
                <div
                  key={student.studentID}
                  className="bg-white border border-slate-200 rounded-md p-5 shadow-sm hover:shadow-md transition"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {student.firstName} {student.lastName}
                  </h3>
                  <span className="inline-block text-xs px-3 py-1 rounded-full bg-green-100 text-green-800 mb-4">
                    ตัวจริง
                  </span>
                  {!isEditBlocked && status !== 3 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(student.studentID ?? 0)}
                        className="flex-1 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                      >
                        <Edit3 className="inline w-4 h-4 mr-1" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(student.studentID ?? 0)}
                        className="flex-1 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        <Trash2 className="inline w-4 h-4 mr-1" />
                        ลบ
                      </button>
                    </div>
                  )}
                  {status === 3 && (
                    <div className="flex space-x-2 mt-1">
                      <button
                        onClick={() =>
                          handleDownloadCertificateStudent(
                            Number(teamId),
                            student.studentID ?? 0
                          )
                        }
                        className="flex-1 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        <Download className="inline w-4 h-4 mr-1" />
                        ดาวน์โหลดใบเกียรติบัตร
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reserve Members */}
        {reserveMembers.length > 0 && (
          <section>
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                ผู้เล่นตัวสำรอง
              </h2>
              <span className="ml-3 px-3 py-1 text-sm font-medium rounded-full bg-amber-100 text-amber-800">
                {reserveMembers.length} คน
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {reserveMembers.map((student) => (
                <div
                  key={student.studentID}
                  className="bg-white border border-slate-200 rounded-md p-5 shadow-sm hover:shadow-md transition"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {student.firstName} {student.lastName}
                  </h3>
                  <span className="inline-block text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 mb-4">
                    ตัวสำรอง
                  </span>
                  {!isEditBlocked && status !== 3 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(student.studentID ?? 0)}
                        className="flex-1 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                      >
                        <Edit3 className="inline w-4 h-4 mr-1" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(student.studentID ?? 0)}
                        className="flex-1 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        <Trash2 className="inline w-4 h-4 mr-1" />
                        ลบ
                      </button>
                    </div>
                  )}

                  <button
                    hidden={status === 1}
                    onClick={() =>
                      handleDownloadCertificateStudent(
                        Number(teamId),
                        student.studentID ?? 0
                      )
                    }
                    className="flex-1 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    <Download className="inline w-4 h-4 mr-1" />
                    ดาวน์โหลดใบเกียรติบัตร
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {(!students || students.length === 0) && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              ยังไม่มีผู้เล่น
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              เพิ่มผู้เล่นแรกเพื่อเริ่มต้น
            </p>
            <button
              onClick={handleAdd}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md"
            >
              <UserPlus className="inline w-4 h-4 mr-2" />
              เพิ่มผู้เล่น
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default withAuth(StudentUserList);
