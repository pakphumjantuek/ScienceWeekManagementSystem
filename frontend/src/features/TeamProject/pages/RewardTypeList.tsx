import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loading } from "../../../components/Loading";
import {
  useDeleteTeamProjectMutation,
  useGetTeamProjectByTeamIdQuery,
} from "../TeamProjectApi";
import { useModal } from "../../../components/modals/ModalContext";
import { TeamProjectForm } from "./RewardTypeForm";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../utils/confirmDelete";
import type { TeamProject } from "../type";
import withAuth from "../../../HOC/withAuth";
import {
  ArrowLeft,
  Download,
  Edit3,
  FilePlus2,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";

const TeamProjectList = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showModal } = useModal();
  const [deleteTeamProject] = useDeleteTeamProjectMutation();
  const baseUrl = import.meta.env.VITE_API_BASE_URLS;

  const {
    competitionLevelID,
    requiresProject,
    competitionName,
    levelName,
    yearId,
    yearName,
    competitionYearID,
    mainPlayersCount,
    reservePlayersCount,
  } = (location.state as any) || {};

  const parsedTeamId = Number(teamId);
  const { data: teamProjects, isLoading } = useGetTeamProjectByTeamIdQuery(
    parsedTeamId,
    { skip: !parsedTeamId },
  );

  if (isLoading) return <Loading />;

  const handleAdd = () => {
    showModal(<TeamProjectForm teamID={parsedTeamId} />);
  };

  const handleEdit = (teamProject: TeamProject) => {
    showModal(
      <TeamProjectForm
        teamID={parsedTeamId}
        currentTeamProject={teamProject}
      />,
    );
  };

  const handleDelete = async (teamProjectID: number) => {
    const isConfirmed = await confirmDelete("คุณต้องการลบโครงงานนี้ใช่หรือไม่?");
    if (!isConfirmed) return;

    try {
      await deleteTeamProject(teamProjectID).unwrap();
      await showSuccessOk("ลบโครงงานสำเร็จ!");
    } catch (error: any) {
      await showError(
        error?.data?.errorMessages?.[0] ?? "ไม่สามารถลบโครงงานได้",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-16">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                navigate(`/teamregister/${competitionLevelID}`, {
                  state: {
                    requiresProject,
                    competitionName,
                    levelName,
                    yearId,
                    yearName,
                    competitionYearID,
                    mainPlayersCount,
                    reservePlayersCount,
                  },
                })
              }
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </button>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              จัดการโครงงานของทีม
            </h1>
            <p className="mt-2 text-slate-600">
              เพิ่ม แก้ไข หรือลบรายการโครงงานและไฟล์แนบของทีมนี้
            </p>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            เพิ่มโครงงาน
          </button>
        </div>

        {!teamProjects?.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
              <FilePlus2 className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              ยังไม่มีรายการโครงงาน
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              สามารถเพิ่มโครงงานและอัปโหลดไฟล์ใหม่ให้ทีมนี้ได้จากปุ่มด้านบน
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {teamProjects.map((teamProject) => (
              <article
                key={teamProject.teamProjectID}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                      <FileText className="h-6 w-6 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        ชื่อโครงงาน
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {teamProject.projectName || "-"}
                      </h2>
                      <p className="mt-3 text-sm text-slate-600">
                        ไฟล์แนบ:
                        {" "}
                        {teamProject.projectPDFLink ? (
                          <a
                            href={`${baseUrl}${teamProject.projectPDFLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-700 hover:underline"
                          >
                            ดาวน์โหลดไฟล์โครงงาน
                          </a>
                        ) : (
                          <span className="text-rose-600">ไม่มีไฟล์แนบ</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:w-auto">
                    {teamProject.projectPDFLink && (
                      <a
                        href={`${baseUrl}${teamProject.projectPDFLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <Download className="h-4 w-4" />
                        ดาวน์โหลด
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(teamProject)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
                    >
                      <Edit3 className="h-4 w-4" />
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(teamProject.teamProjectID ?? 0)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      ลบ
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default withAuth(TeamProjectList);
