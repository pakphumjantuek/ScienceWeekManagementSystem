import { Loading } from "../../../components/Loading";
import { useGetAllCompetitionLevelQuery } from "../CompetitionLevelApi";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { formatThaiDate, formatThaiDateTime, isRegistrationClosed } from "../../../utils";
import {
  ChevronRight,
  ArrowLeft,
  Users,
  Clock,
  FileText,
  CheckCircle2,
  Award,
  CalendarDays,
  MapPin,
  Megaphone,
} from "lucide-react";

const STEPS = ["เลือกปี", "เลือกกิจกรรม", "เลือกระดับชั้น", "ลงทะเบียน"];

/** Step Indicator (Step 3) */
function StepsBar({ current = 3 }: { current?: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="mt-5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 sm:gap-x-2">
      {STEPS.map((label, idx) => {
        const active = idx + 1 === current;
        return (
          <li key={label} className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-sm sm:text-base font-medium whitespace-nowrap ${
                active ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-500"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  active ? "bg-white text-blue-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {idx + 1}
              </span>
              {label}
            </span>
            {idx < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" />}
          </li>
        );
      })}
    </ol>
  );
}

const formatCloseDate = (value: string) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "ไม่ระบุ";
  const hasTime = value.includes("T") || value.includes(":");
  const time = hasTime
    ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    : "23:59";
  return `${formatThaiDate(value)} (${time} น.)`;
};

const daysUntil = (value: string) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
};

const CompetitionLevelUserList = () => {
  const { competitionYearID } = useParams<{ competitionYearID: string }>();
  const navigate = useNavigate();
  const { data: competitionLevels, isLoading } = useGetAllCompetitionLevelQuery(
    Number(competitionYearID),
  );

  const location = useLocation();
  const hasState = Boolean(location.state?.competitionName);
  const {
    requiresProject = false,
    competitionName = "",
    yearId = "",
    yearName = "",
    registrationCloseDate = "",
    registrationLocation = "",
    registrationMode = "team",
    maxStudentsPerSchool,
    competitionYearID: competitionYearIdFromState,
  } = location.state || {};
  const competitionYearIdForBack =
    competitionYearIdFromState ?? competitionYearID;

  if (isLoading) return <Loading />;

  const registrationClosed = isRegistrationClosed(registrationCloseDate);
  const left = registrationCloseDate ? daysUntil(registrationCloseDate) : null;

  const goBack = () =>
    yearId
      ? navigate(`/competitionYearsList/${yearId}`, {
          state: { yearName, registrationCloseDate },
        })
      : navigate(`/yearuser`);

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
            className="mb-4 md:mb-0 md:absolute md:left-10 md:top-8 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer"
            onClick={goBack}
            title="ย้อนกลับไปหน้าเลือกกิจกรรม"
          >
            <ArrowLeft className="w-4 h-4" />
            ย้อนกลับ
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-snug">
            เลือกระดับชั้น
            {competitionName && (
              <span className="block sm:inline text-blue-700"> {competitionName}</span>
            )}
          </h1>
          <p className="mt-2 text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
            {registrationClosed
              ? "กิจกรรมนี้ปิดรับสมัครแล้ว เข้าดูวัน เวลา และรายชื่อผู้เข้าแข่งขันได้"
              : "เลือกระดับชั้นหรือช่วงอายุที่ตรงกับทีมของคุณเพื่อลงทะเบียน"}
          </p>
          <StepsBar current={3} />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 mt-5 sm:mt-6 space-y-5">
        {!hasState ? (
          /* ===== เปิดหน้าตรง/รีเฟรช: ไม่มีข้อมูลกิจกรรม ===== */
          <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 text-center">
            <Award className="w-10 h-10 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl md:text-2xl font-bold mb-2">กรุณาเลือกกิจกรรมใหม่อีกครั้ง</h3>
            <p className="text-slate-500 text-base md:text-lg mb-6">
              ไม่พบข้อมูลกิจกรรมจากหน้าก่อนหน้า (อาจเกิดจากการรีเฟรชหน้า)
            </p>
            <button
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              ไปหน้าเลือกปี / กิจกรรม
            </button>
          </div>
        ) : (
          <>
            {/* ===== Summary ===== */}
            <div
              className={`rounded-2xl border-2 px-4 sm:px-5 py-3.5 space-y-2 ${
                registrationClosed ? "border-slate-200 bg-white" : "border-emerald-300 bg-emerald-50"
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <span
                  className={`inline-flex items-center gap-2 font-bold text-base sm:text-lg ${
                    registrationClosed ? "text-slate-700" : "text-emerald-800"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${registrationClosed ? "bg-slate-400" : "bg-emerald-500"}`}
                  />
                  {registrationClosed ? "ปิดรับสมัครแล้ว" : "กำลังเปิดรับสมัคร"}
                </span>
                {registrationCloseDate && (
                  <span className="text-base text-slate-700">
                    {registrationClosed ? "ปิดรับเมื่อ" : "ปิดรับ"}{" "}
                    <span className="font-semibold">{formatCloseDate(registrationCloseDate)}</span>
                  </span>
                )}
                {!registrationClosed && left !== null && left >= 0 && (
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-semibold ${
                      left <= 3 ? "text-rose-600" : "text-amber-700"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {left === 0 ? "ปิดรับวันนี้" : `เหลืออีก ${left} วัน`}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm sm:text-base text-slate-700">
                <span className="inline-flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
                  {registrationLocation || "ยังไม่ระบุสถานที่"}
                </span>
                {requiresProject ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800">
                    <FileText className="w-4 h-4" />
                    ต้องแนบไฟล์โครงงานตอนลงทะเบียน
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ไม่ต้องแนบไฟล์โครงงาน
                  </span>
                )}
              </div>
            </div>

            {/* ===== Levels ===== */}
            {(competitionLevels?.length ?? 0) > 0 && (
              <ul className="space-y-3">
                {competitionLevels?.map((level: any) => {
                  const goToRegister = () =>
                    navigate(`/teamregister/${level.competitionLevelID}`, {
                      state: {
                        requiresProject,
                        competitionName,
                        levelName: level.levelName,
                        mainPlayersCount: level.mainPlayersCount,
                        reservePlayersCount: level.reservePlayersCount,
                        advisorCount: level.advisorCount,
                        registrationMode,
                        maxStudentsPerSchool,
                        yearId,
                        yearName,
                        registrationCloseDate,
                        competitionYearID: competitionYearIdForBack,
                        isCertificateNumberGenerated: level.isCertificateNumberGenerated,
                      },
                    });
                  const goToAnnouncement = () =>
                    navigate(`/announcements/level/${level.competitionLevelID}`, {
                      state: {
                        activityName: competitionName,
                        levelName: level.levelName,
                      },
                    });

                  return (
                    <li
                      key={level.competitionLevelID}
                      aria-label={`ระดับชั้น ${level.levelName}`}
                      className={`rounded-2xl border-2 border-slate-200 border-l-[6px] bg-white shadow-sm transition-all hover:shadow-md flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 px-4 sm:px-6 py-4 ${
                        registrationClosed
                          ? "border-l-emerald-500 hover:border-emerald-300"
                          : "border-l-blue-500 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-extrabold leading-snug">
                          ระดับชั้น {level.levelName}
                        </h2>
                        <div className="mt-1.5 flex flex-col md:flex-row md:flex-wrap gap-x-6 gap-y-1 text-sm sm:text-base text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
                            แข่งขัน{" "}
                            <span className="font-semibold">
                              {level.competitionDateTime
                                ? formatThaiDateTime(level.competitionDateTime)
                                : "ยังไม่กำหนด"}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-blue-600 shrink-0" />
                            สมาชิกหลัก{" "}
                            <span className="font-semibold">{level.mainPlayersCount ?? "-"}</span> คน
                            · สำรอง{" "}
                            <span className="font-semibold">{level.reservePlayersCount ?? "-"}</span> คน
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 sm:w-60 shrink-0">
                        {registrationClosed ? (
                          <>
                            <button
                              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                              onClick={goToAnnouncement}
                              title="ดูประกาศรายชื่อผู้เข้าแข่งขัน"
                            >
                              <Megaphone className="w-5 h-5" />
                              ประกาศรายชื่อ
                              <ChevronRight className="w-5 h-5" />
                            </button>
                            <button
                              className="text-sm font-medium text-slate-600 underline underline-offset-2 hover:text-blue-700 cursor-pointer py-1"
                              onClick={goToRegister}
                              title="เข้าดูรายละเอียดและรายชื่อทีม"
                            >
                              ดูรายชื่อทีมที่ลงทะเบียน
                            </button>
                          </>
                        ) : (
                          <button
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                            onClick={goToRegister}
                            title="ลงทะเบียนกิจกรรม"
                          >
                            ลงทะเบียน
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* ===== Empty State ===== */}
            {competitionLevels && competitionLevels.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 md:p-12 text-center">
                <Award className="w-10 h-10 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl md:text-2xl font-bold mb-2">ไม่พบข้อมูลระดับชั้น</h3>
                <p className="text-slate-500 text-base md:text-lg mb-6">
                  ยังไม่มีระดับชั้นที่ถูกเพิ่มเข้ามาในการแข่งขันนี้ โปรดตรวจสอบอีกครั้งภายหลัง
                </p>
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-300 px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ย้อนกลับไปหน้าเลือกกิจกรรม
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CompetitionLevelUserList;
