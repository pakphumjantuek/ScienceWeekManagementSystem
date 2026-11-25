import { useState } from "react";
import { useGetAllCompetitionYearQuery } from "../CompetitionYearApi";
import { useGetAllYearQuery } from "../../Year/YearApi";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Loading } from "../../../components";
import { formatThaiDate, isRegistrationClosed } from "../../../utils";
import {
  ChevronRight,
  ArrowLeft,
  Trophy,
  Clock,
  FileText,
  MapPin,
  Megaphone,
  Search,
  Info,
} from "lucide-react";
import type { Year } from "../../Year/type";

const STEPS = ["เลือกปี", "เลือกกิจกรรม", "เลือกระดับชั้น", "ลงทะเบียน"];

/** Step Indicator (inline) */
function StepsBar({ current = 2 }: { current?: 1 | 2 | 3 | 4 }) {
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

const CompetitionYearsUserList = () => {
  const { yearId } = useParams<{ yearId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: CompetitionYears, isLoading } = useGetAllCompetitionYearQuery(
    Number(yearId),
  );
  // ดึงข้อมูลปีจาก API เพื่อให้รีเฟรช/เปิดลิงก์ตรงแล้วยังแสดงถูกต้อง
  const { data: years, isLoading: isYearLoading } = useGetAllYearQuery();

  if (isLoading || isYearLoading) return <Loading />;

  const year = years?.find((y: Year) => String(y.yearID) === yearId);
  const yearName: string | undefined = year?.yearName ?? location.state?.yearName;
  const registrationCloseDate: string | undefined =
    year?.registrationCloseDate ?? location.state?.registrationCloseDate;

  const isOpen = !isRegistrationClosed(registrationCloseDate);
  const left = registrationCloseDate ? daysUntil(registrationCloseDate) : null;

  const keyword = search.trim().toLowerCase();
  const competitions = (CompetitionYears ?? []).filter(
    (c: any) => !keyword || c.competitionName?.toLowerCase().includes(keyword),
  );

  const goToLevels = (comp: any) =>
    navigate(`/competitionLevelUserList/${comp.competitionYearID}`, {
      state: {
        requiresProject: comp.requiresProject,
        competitionName: comp.competitionName,
        yearId: yearId,
        yearName,
        competitionYearID: comp.competitionYearID,
        registrationCloseDate,
        registrationMode: comp.registrationMode,
        maxStudentsPerSchool: comp.maxStudentsPerSchool,
        advisorCount: comp.advisorCount,
        registrationLocation: comp.registrationLocation,
      },
    });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      {/* Header */}
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
            onClick={() => navigate(`/yearuser`)}
            title="ย้อนกลับไปหน้าเลือกปี"
          >
            <ArrowLeft className="w-4 h-4" />
            ย้อนกลับ
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-snug">
            เลือกกิจกรรมการแข่งขัน
            {yearName && <span className="block sm:inline text-blue-700"> {yearName}</span>}
          </h1>
          <p className="mt-2 text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
            เลือกกิจกรรมการแข่งขันที่ต้องการลงทะเบียนเข้าร่วม
          </p>
          <StepsBar current={2} />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 mt-5 sm:mt-6 space-y-5">
        {/* Registration status */}
        <div
          className={`rounded-2xl border-2 px-4 sm:px-5 py-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 ${
            isOpen ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
          }`}
        >
          <span
            className={`inline-flex items-center gap-2 font-bold text-base sm:text-lg ${
              isOpen ? "text-emerald-800" : "text-slate-700"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? "bg-emerald-500" : "bg-slate-400"}`} />
            {isOpen ? "กำลังเปิดรับสมัคร" : "ปิดรับสมัครแล้ว"}
          </span>
          {registrationCloseDate && (
            <span className="text-base text-slate-700">
              {isOpen ? "ปิดรับ" : "ปิดรับเมื่อ"}{" "}
              <span className="font-semibold">{formatCloseDate(registrationCloseDate)}</span>
            </span>
          )}
          {isOpen && left !== null && left >= 0 && (
            <span
              className={`inline-flex items-center gap-1 text-sm font-semibold ${
                left <= 3 ? "text-rose-600" : "text-amber-700"
              }`}
            >
              <Clock className="w-4 h-4" />
              {left === 0 ? "ปิดรับวันนี้" : `เหลืออีก ${left} วัน`}
            </span>
          )}
          {!isOpen && (
            <span className="text-sm text-slate-500 basis-full">
              กดที่กิจกรรมเพื่อดูสถานที่ วัน/เวลาแข่งขัน และรายชื่อผู้เข้าแข่งขัน
            </span>
          )}
        </div>

        {(CompetitionYears?.length ?? 0) > 0 && (
          <>
            {/* Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหากิจกรรม..."
                  aria-label="ค้นหากิจกรรม"
                  className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </label>
              <span className="text-sm text-slate-500 shrink-0">
                {keyword
                  ? `พบ ${competitions.length} จาก ${CompetitionYears?.length} กิจกรรม`
                  : `ทั้งหมด ${CompetitionYears?.length} กิจกรรม`}
              </span>
            </div>

            {/* List */}
            {competitions.length > 0 ? (
              <ul className="space-y-3">
                {competitions.map((comp: any) => (
                  <li
                    key={comp.competitionYearID}
                    className={`rounded-2xl border-2 bg-white overflow-hidden shadow-sm transition-all hover:shadow-md border-l-[6px] ${
                      isOpen ? "border-slate-200 border-l-blue-500 hover:border-blue-300 hover:border-l-blue-600" : "border-slate-200 border-l-emerald-500 hover:border-emerald-300"
                    }`}
                  >
                    <button
                      onClick={() => goToLevels(comp)}
                      className="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 px-3.5 sm:px-6 py-4 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold leading-snug">
                            {comp.competitionName}
                          </span>
                          {comp.requiresProject && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <FileText className="w-3.5 h-3.5" />
                              ส่งไฟล์โครงงาน
                            </span>
                          )}
                        </span>
                        <span className="mt-1 flex items-start gap-1.5 text-sm sm:text-base text-slate-600">
                          <MapPin className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
                          {comp.registrationLocation?.trim() || "ยังไม่ระบุสถานที่"}
                        </span>
                      </span>
                      <span
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-base font-semibold shrink-0 sm:w-56 ${
                          isOpen ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                        }`}
                      >
                        {isOpen ? (
                          "เลือกระดับชั้น"
                        ) : (
                          <>
                            <Megaphone className="w-4 h-4" />
                            ดูรายชื่อผู้เข้าแข่งขัน
                          </>
                        )}
                        <ChevronRight className="w-5 h-5" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                ไม่พบกิจกรรมที่ตรงกับ “{search}”
              </div>
            )}

            {/* Tip */}
            <p className="flex items-start gap-2 text-sm text-slate-500">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              กิจกรรมที่มีป้าย “ส่งไฟล์โครงงาน” ต้องเตรียมไฟล์โครงงานหรือเอกสารประกอบก่อนลงทะเบียน
            </p>
          </>
        )}

        {/* Empty State */}
        {CompetitionYears && CompetitionYears.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 md:p-12 text-center">
            <Trophy className="w-10 h-10 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              ไม่มีข้อมูลกิจกรรมใน{yearName ? `ปี ${yearName}` : "ปีนี้"}
            </h3>
            <p className="text-slate-500 text-base md:text-lg mb-6">
              ขณะนี้ยังไม่มีการเปิดรับสมัครกิจกรรมใดๆ ในปีนี้
              กรุณาติดตามการอัปเดตหรือตรวจสอบปีการศึกษาอื่น
            </p>
            <button
              onClick={() => navigate(`/yearuser`)}
              className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-300 px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              ย้อนกลับไปเลือกปี
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CompetitionYearsUserList;
