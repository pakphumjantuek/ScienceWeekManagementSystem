// src/features/Team/pages/TeamRegister.tsx
import { Loading } from "../../../../components/Loading";
import {
  useDeleteTeamMutation,
  useGetAllTeamByCompetitionLevelQuery,
} from "../../TeamApi";
import { useGetCompetitionLevelByIdQuery } from "../../../CompetitionLevel/CompetitionLevelApi";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../../utils/confirmDelete";
import { withAuth } from "../../../../HOC";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../Redux/store";
import { jwtDecode } from "jwt-decode";
import {
  Users,
  UserCheck,
  Edit3,
  Trash2,
  Settings,
  Plus,
  Trophy,
  GraduationCap,
  Download,
  FileCheck,
  ChevronRight,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Info,
  Lock,
  Search,
} from "lucide-react";
import { statusOptions } from "../../type";
import { handleDownloadCertificate } from "../../../../Apis/Export";
import { TitlePrefix } from "../../../student/type";
import { useFilteredData } from "../../../../components";
import { useEffect } from "react";
import { STATUS_META, DEFAULT_STATUS_META } from "../../statusMeta";

const getControllerTitle = (titlePrefix?: number, otherTitle?: string) =>
  titlePrefix === 7
    ? otherTitle?.trim() || "อื่นๆ"
    : (TitlePrefix.find((title) => title.value === titlePrefix)?.label ?? "");

/** Step Indicator (Step 4) */
const STEPS = ["เลือกปี", "เลือกกิจกรรม", "เลือกระดับชั้น", "ลงทะเบียน"];

function StepsBar({ current = 4 }: { current?: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="mt-5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 sm:gap-x-2">
      {STEPS.map((label, idx) => {
        const active = idx + 1 === current;
        return (
          <li key={label} className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-sm sm:text-base font-medium whitespace-nowrap ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-500"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  active
                    ? "bg-white text-blue-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {idx + 1}
              </span>
              {label}
            </span>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-slate-300" />
            )}
          </li>
        );
      })}
    </ol>
  );
}


const getDeadlineEndOfDay = (deadline?: string | null) => {
  if (!deadline) return null;

  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return null;

  const hasTime = deadline.includes("T") || deadline.includes(":");
  if (!hasTime) {
    deadlineDate.setHours(23, 59, 59, 999);
  }
  return deadlineDate;
};

const formatDeadline = (deadline?: string | null) => {
  if (!deadline) return "";
  const deadlineDate = getDeadlineEndOfDay(deadline);
  if (!deadlineDate) return "";

  const dateFormatted = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(deadlineDate);

  const hasTime = deadline.includes("T") || deadline.includes(":");
  if (hasTime) {
    const hours = String(deadlineDate.getHours()).padStart(2, "0");
    const minutes = String(deadlineDate.getMinutes()).padStart(2, "0");
    return `${dateFormatted} (${hours}:${minutes} น.)`;
  }

  return `${dateFormatted} (23:59 น.)`;
};

const TeamRegister = () => {
  const { competitionLevelID } = useParams();
  const { data: teams, isLoading } = useGetAllTeamByCompetitionLevelQuery(
    Number(competitionLevelID),
  );
  const { data: compLevel } = useGetCompetitionLevelByIdQuery(
    Number(competitionLevelID),
    { skip: !competitionLevelID },
  );
  const [deleteteams] = useDeleteTeamMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as any) || {};
  const hasState = Boolean(state.competitionName);
  const {
    requiresProject,
    competitionName,
    registrationMode,
    yearId,
    yearName,
    competitionYearID,
    registrationCloseDate,
    isCertificateNumberGenerated,
  } = state;
  // ใช้ข้อมูลระดับชั้นจาก API ก่อน ถ้าไม่มีค่อยใช้ค่าจากหน้าก่อนหน้า
  const levelName = compLevel?.levelName ?? state.levelName;
  const mainPlayersCount = compLevel?.mainPlayersCount ?? state.mainPlayersCount;
  const reservePlayersCount =
    compLevel?.reservePlayersCount ?? state.reservePlayersCount;
  const advisorCount = compLevel?.advisorCount ?? state.advisorCount;

  const isCertGenerated =
    compLevel?.isCertificateNumberGenerated ?? isCertificateNumberGenerated;
  const baseUrl = import.meta.env.VITE_API_BASE_URLS;

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDelete("คุณต้องการลบทีมนี้ใช่หรือไม่?");
    if (!isConfirmed) return;
    try {
      await deleteteams(id).unwrap();
      await showSuccessOk("ลบทีมสำเร็จ!");
    } catch (error: any) {
      await showError(error?.data?.errorMessages?.[0] ?? "ไม่สามารถลบทีมได้");
    }
  };

  const sharedState = {
    requiresProject,
    mainPlayersCount,
    reservePlayersCount,
    advisorCount,
    registrationMode,
    competitionName,
    levelName,
    yearId,
    yearName,
    competitionYearID,
    registrationCloseDate,
    competitionLevelID: Number(competitionLevelID),
  };

  const handleEdit = (team: any) => {
    navigate(`/teamformnew/${competitionLevelID}`, {
      state: {
        ...sharedState,
        currentTeam: team,
        school_name: team.school_name,
        school_code: team.school_code,
        province: team.province?.trim() ?? "",
        district: team.district?.trim() ?? "",
      },
    });
  };

  const { searchTerm, setSearchTerm, filteredData } = useFilteredData(
    teams ?? [],
    ["school_name", "nameOrdinal"],
  );

  const userData = useSelector((state: RootState) => state.userAuthStore);
  const isStaffOrAdmin = (() => {
    let role = userData?.role || "";
    if (!role) {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          role =
            decoded?.role ||
            decoded?.[
              "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            ] ||
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
  })();

  // ยังไม่มีทีมเลย → พาไปหน้าสมัครทันที (เฉพาะผู้ใช้ทั่วไป และยังไม่หมดเวลา)
  const shouldAutoCreate = (() => {
    if (isLoading || !hasState || isStaffOrAdmin || !teams || teams.length > 0)
      return false;
    const deadline = getDeadlineEndOfDay(registrationCloseDate);
    return !deadline || new Date() <= deadline;
  })();
  useEffect(() => {
    if (!shouldAutoCreate) return;
    navigate(`/teamformnew/${competitionLevelID}`, {
      replace: true,
      state: { ...sharedState, backToLevelList: true },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoCreate]);

  if (isLoading || shouldAutoCreate) return <Loading />;

  const editDeadline = registrationCloseDate;
  const editDeadlineEndOfDay = getDeadlineEndOfDay(editDeadline);
  const isEditExpired =
    !!editDeadlineEndOfDay && new Date() > editDeadlineEndOfDay;
  const isEditBlocked = isEditExpired && !isStaffOrAdmin;
  const editDeadlineLabel = formatDeadline(editDeadline);

  const isIndividual = registrationMode === "individual";
  const unit = isIndividual ? "คน" : "ทีม";
  const totalTeams = teams?.length ?? 0;

  const goToNewTeam = () =>
    navigate(`/teamformnew/${competitionLevelID}`, { state: sharedState });

  const goBack = () =>
    competitionYearID
      ? navigate(`/competitionLevelUserList/${competitionYearID}`, {
          state: {
            requiresProject,
            competitionName,
            yearId,
            yearName,
            competitionYearID,
            registrationCloseDate,
          },
        })
      : navigate(`/yearuser`);

  const flowSteps = isIndividual
    ? ["ลงทะเบียนผู้สมัคร", "ตรวจสอบข้อมูล", "เข้าร่วมการแข่งขัน"]
    : ["สร้างทีม", "เพิ่มสมาชิกทีม", "เข้าร่วมการแข่งขัน"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      {/* ===== Header ===== */}
      <header className="border-b border-slate-200 bg-white">
        {/* colour strip */}
        <div className="flex h-1.5">
          <span className="flex-1 bg-blue-600" />
          <span className="flex-1 bg-emerald-500" />
          <span className="flex-1 bg-amber-500" />
          <span className="flex-1 bg-rose-500" />
        </div>
        <div className="relative max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 py-5 sm:py-7 md:py-10 text-center">
          <button
            onClick={goBack}
            className="mb-4 md:mb-0 md:absolute md:left-10 md:top-8 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer"
            title="ย้อนกลับไปเลือกระดับชั้น"
          >
            <ArrowLeft className="w-4 h-4" />
            ย้อนกลับ
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            {competitionName && (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-sm font-bold">
                <GraduationCap className="w-4 h-4" />
                {competitionName}
              </span>
            )}
            {levelName && (
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                ระดับ {levelName}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-snug">
            {isIndividual
              ? "ลงทะเบียนผู้สมัคร (ประเภทบุคคล)"
              : "ลงทะเบียนทีมแข่งขัน"}
          </h1>
          <p className="mt-2 text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
            {isIndividual
              ? "ตรวจสอบและจัดการรายชื่อผู้สมัครประเภทบุคคล"
              : "สร้างทีม ตรวจสอบสถานะ และจัดการสมาชิกในทีม"}
          </p>
          <StepsBar />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 mt-5 sm:mt-6 space-y-5">
        {!hasState ? (
          /* ===== เปิดหน้าตรง/รีเฟรช: ไม่มีข้อมูลกิจกรรม ===== */
          <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 text-center">
            <Trophy className="w-10 h-10 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              กรุณาเลือกกิจกรรมใหม่อีกครั้ง
            </h3>
            <p className="text-slate-500 text-base md:text-lg mb-6">
              ไม่พบข้อมูลกิจกรรมจากหน้าก่อนหน้า (อาจเกิดจากการรีเฟรชหน้า)
            </p>
            <button
              onClick={() => navigate(`/yearuser`)}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              ไปหน้าเลือกปี / กิจกรรม
            </button>
          </div>
        ) : (
          <>
            {isEditBlocked && (
              <section className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3">
                <Lock className="h-5 w-5 mt-0.5 text-amber-700 shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-amber-950">
                    หมดสิทธิ์แก้ไขข้อมูลทีมแล้ว
                  </h2>
                  <p className="text-sm sm:text-base text-amber-800">
                    ระบบปิดการสร้างทีม จัดการสมาชิก แก้ไข และลบทีม
                    {editDeadlineLabel
                      ? ` เนื่องจากเลยวันที่ ${editDeadlineLabel}`
                      : ""}
                  </p>
                </div>
              </section>
            )}

            {isStaffOrAdmin && isEditExpired && (
              <section className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 flex items-start gap-3">
                <Info className="h-5 w-5 mt-0.5 text-cyan-800 shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-cyan-950 flex flex-wrap items-center gap-2">
                    สิทธิ์เจ้าหน้าที่ (Staff / Admin)
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-cyan-700 text-white rounded-full">
                      โหมดเจ้าหน้าที่
                    </span>
                  </h2>
                  <p className="text-sm sm:text-base text-cyan-900">
                    การรับสมัครทั่วไปปิดแล้ว ({editDeadlineLabel})
                    แต่ท่านใช้สิทธิ์เจ้าหน้าที่ จึงเพิ่ม แก้ไข
                    และจัดการสมาชิกได้ตามปกติ
                  </p>
                </div>
              </section>
            )}

            {/* ===== Summary ===== */}
            <section className="rounded-2xl border border-slate-200 bg-white px-4 sm:px-5 py-3">
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm sm:text-base text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  {isIndividual ? (
                    "ประเภทบุคคล (1 คน)"
                  ) : (
                    <>
                      ตัวจริง <b>{mainPlayersCount ?? "-"}</b> คน · สำรอง{" "}
                      <b>{reservePlayersCount ?? "-"}</b> คน
                    </>
                  )}
                </span>
                {requiresProject ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800">
                    <FileText className="w-4 h-4" />
                    ต้องแนบไฟล์โครงงาน
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ไม่ต้องแนบไฟล์โครงงาน
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  ลงทะเบียนแล้ว <b>{totalTeams}</b> {unit}
                </span>
              </div>
            </section>

            {/* ===== Flow ===== */}
            {!isEditBlocked && (
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm sm:text-base text-slate-600">
                <span className="font-semibold text-slate-700">ขั้นตอน:</span>
                {flowSteps.map((s, i) => (
                  <li key={s} className="inline-flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {s}
                    {i < flowSteps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    )}
                  </li>
                ))}
              </ol>
            )}

            {/* ===== Team List ===== */}
            <section aria-labelledby="team-list-title" className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <h2
                  id="team-list-title"
                  className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 lg:mr-auto"
                >
                  {isIndividual ? "ผู้สมัครของฉัน" : "ทีมของฉัน"}
                  <span className="text-base font-semibold text-slate-500">
                    ({totalTeams})
                  </span>
                </h2>

                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="search"
                      placeholder="ค้นหาชื่อสถาบัน / ผู้สมัคร"
                      aria-label="ค้นหาทีม"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </label>
                  {!isEditBlocked && (
                    <button
                      onClick={goToNewTeam}
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-5 h-5" />
                      {isIndividual ? "ลงทะเบียนผู้สมัครใหม่" : "ลงทะเบียนทีมใหม่"}
                    </button>
                  )}
                </div>
              </div>

              <ul className="space-y-3">
                {filteredData?.map((team: any) => {
                  const meta = STATUS_META[team.status] ?? DEFAULT_STATUS_META;
                  const StatusIcon = meta.icon;
                  const statusLabel =
                    meta.label ??
                    (statusOptions.find((s) => s.value === team.status)?.label ||
                      "รอดำเนินการ");

                  return (
                    <li
                      key={team.teamID}
                      className={`rounded-2xl border-2 border-slate-200 border-l-[6px] bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden ${meta.border}`}
                    >
                      {/* Status bar */}
                      <div
                        className={`flex items-center gap-3 px-4 sm:px-6 py-2.5 border-b border-slate-100 ${meta.bar}`}
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.iconWrap}`}
                        >
                          <StatusIcon className="w-5 h-5" />
                        </span>
                        <p className="min-w-0 leading-snug">
                          <span className="block text-sm opacity-70">สถานะ</span>
                          <span className="font-bold text-base">{statusLabel}</span>
                          <span className="hidden sm:inline text-sm opacity-80">
                            {" "}— {meta.hint}
                          </span>
                          <span className="block sm:hidden text-sm opacity-80">
                            {meta.hint}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 px-4 sm:px-6 py-4">
                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <h3
                            className="text-lg sm:text-xl font-bold leading-snug"
                            title={team.school_name}
                          >
                            {team.school_name}
                            {team.nameOrdinal ? ` (${team.nameOrdinal})` : ""}
                          </h3>

                          <div className="flex flex-col md:flex-row md:flex-wrap gap-x-6 gap-y-1.5 text-sm sm:text-base text-slate-700">
                            <span className="inline-flex items-start gap-1.5">
                              <UserCheck className="w-4 h-4 mt-1 text-blue-600 shrink-0" />
                              <span>
                                <span className="text-slate-500">ผู้ควบคุม: </span>
                                {team.primaryFirstName && team.primaryLastName ? (
                                  <span className="font-semibold">
                                    {getControllerTitle(
                                      team.primaryTitlePrefix,
                                      team.primaryOtherTitlePrefix,
                                    )}{" "}
                                    {team.primaryFirstName} {team.primaryLastName}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">ไม่ได้ระบุ</span>
                                )}
                                {team.secondaryFirstName && team.secondaryLastName && (
                                  <span className="text-slate-500">
                                    {", "}
                                    {getControllerTitle(
                                      team.secondaryTitlePrefix,
                                      team.secondaryOtherTitlePrefix,
                                    )}{" "}
                                    {team.secondaryFirstName} {team.secondaryLastName}
                                  </span>
                                )}
                              </span>
                            </span>

                            {requiresProject && (
                              <span className="inline-flex items-start gap-1.5 min-w-0">
                                <FileCheck className="w-4 h-4 mt-1 text-rose-500 shrink-0" />
                                <span className="min-w-0">
                                  <span className="text-slate-500">โครงงาน: </span>
                                  {team.projectName ? (
                                    <span className="font-semibold">{team.projectName}</span>
                                  ) : (
                                    <span className="text-rose-600">ยังไม่ระบุชื่อโครงงาน</span>
                                  )}
                                  {team.projectPDFLink && (
                                    <a
                                      href={`${baseUrl}${team.projectPDFLink}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-sm hover:underline"
                                    >
                                      <Download className="w-4 h-4" />
                                      PDF
                                    </a>
                                  )}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                          {!isEditBlocked && (
                            <>
                              <button
                                onClick={() =>
                                  navigate(`/team/${team.teamID}/players`, {
                                    state: sharedState,
                                  })
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 text-base font-bold transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <Settings className="w-4 h-4" />
                                จัดการสมาชิกทีม
                              </button>

                              {team.status !== 3 && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEdit(team)}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-3 text-base font-semibold text-slate-700 transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    แก้ไข
                                  </button>
                                  <button
                                    onClick={() => handleDelete(team.teamID ?? 0)}
                                    className="inline-flex items-center justify-center gap-1 rounded-xl px-3 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer sm:ml-2"
                                    title="ลบทีม"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    ลบ
                                  </button>
                                </div>
                              )}
                            </>
                          )}

                          {team.status === 3 &&
                            (isCertGenerated === true &&
                            team.hasCertificate === true ? (
                              <button
                                onClick={() =>
                                  handleDownloadCertificate(team.teamID ?? 0)
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-base font-bold text-white transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <Download className="w-4 h-4" />
                                ดาวน์โหลดเกียรติบัตร
                              </button>
                            ) : (
                              <span className="text-center text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl py-2.5 px-3">
                                ดาวน์โหลดเกียรติบัตรได้เมื่อแข่งขันเสร็จ
                              </span>
                            ))}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Search not found */}
              {totalTeams > 0 && filteredData?.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                  ไม่พบ{unit}ที่ตรงกับ “{searchTerm}”
                </div>
              )}

              {/* Empty state */}
              {totalTeams === 0 && (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
                  <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                  <h3 className="text-xl font-bold mb-1">
                    ยังไม่มี{isIndividual ? "ผู้สมัคร" : "ทีม"}ในระบบ
                  </h3>
                  <p className="text-slate-500 text-base px-4 mb-5">
                    {isEditBlocked
                      ? "กิจกรรมนี้หมดสิทธิ์สร้างหรือแก้ไขทีมแล้ว"
                      : "เริ่มต้นลงทะเบียนได้เลย"}
                  </p>
                  {!isEditBlocked && (
                    <button
                      onClick={goToNewTeam}
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                      {isIndividual ? "ลงทะเบียนผู้สมัครใหม่" : "ลงทะเบียนทีมใหม่"}
                    </button>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default withAuth(TeamRegister);
