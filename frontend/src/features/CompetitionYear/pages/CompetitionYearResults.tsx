import { useState, useMemo } from "react";
import { useGetAllCompetitionYearQuery } from "../CompetitionYearApi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loading } from "../../../components";
import { useGetAllYearQuery } from "../../Year/YearApi";
import {
  ChevronRight,
  ArrowLeft,
  Trophy,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  X,
} from "lucide-react";
import type { CompetitionYear } from "../type";

const STEPS = ["เลือกปี", "เลือกกิจกรรม", "เลือกระดับชั้น", "ดูผลการแข่งขัน"];

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

const CompetitionYearsResults = () => {
  const { yearId } = useParams<{ yearId: string }>();
  const location = useLocation();
  const yearName: string | undefined = location.state?.yearName;
  const yearNumber: number | undefined = location.state?.yearNumber;
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");

  const { data: rawCompetitionYears, isLoading } =
    useGetAllCompetitionYearQuery(Number(yearId));
  // ชื่อปีจาก API ด้วย เผื่อรีเฟรช/เปิดลิงก์ตรง
  const { data: years } = useGetAllYearQuery();
  const year = years?.find((y) => String(y.yearID) === yearId);

  const competitionYears = rawCompetitionYears ?? [];

  // isRegistrationOpen ของกิจกรรม = ผู้ดูแลเปิดให้ดูผลแล้ว → กิจกรรมที่พร้อมขึ้นก่อน
  const filteredCompetitions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return competitionYears
      .filter((comp) => (comp.competitionName ?? "").toLowerCase().includes(term))
      .slice()
      .sort((a, b) => Number(!!b.isRegistrationOpen) - Number(!!a.isRegistrationOpen));
  }, [competitionYears, searchTerm]);

  if (isLoading) return <Loading />;

  const number = year?.yearNumber ?? yearNumber;
  const name = year?.yearName ?? yearName;
  const displayYear = number ? `ประจำปี ${number}` : name ? `ปี ${name}` : "";

  const readyCount = competitionYears.filter((c) => c.isRegistrationOpen).length;

  const handleGo = (comp: CompetitionYear) => {
    if (!comp.isRegistrationOpen) return;
    navigate(`/competitionlevelresults/${comp.competitionYearID}`, {
      state: {
        requiresProject: comp.requiresProject,
        competitionName: comp.competitionName,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-1.5">
          <span className="flex-1 bg-blue-600" />
          <span className="flex-1 bg-emerald-500" />
          <span className="flex-1 bg-amber-500" />
          <span className="flex-1 bg-rose-500" />
        </div>
        <div className="relative max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 py-5 sm:py-7 md:py-10 text-center">
          <button
            onClick={() => navigate(`/yearresults`)}
            className="mb-4 md:mb-0 md:absolute md:left-10 md:top-8 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            ย้อนกลับ
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-snug">
            เลือกกิจกรรมเพื่อดูผล
            {displayYear && <span className="block sm:inline text-blue-700"> {displayYear}</span>}
          </h1>
          <p className="mt-2 text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
            เลือกกิจกรรมที่ต้องการดูผลการแข่งขันและผลรางวัล
          </p>
          <StepsBar current={2} />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 mt-5 sm:mt-6 space-y-5">
        {competitionYears.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหากิจกรรม..."
                aria-label="ค้นหากิจกรรม"
                className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-10 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <span className="text-sm text-slate-500 shrink-0">
              ประกาศผลแล้ว <b className="text-emerald-700">{readyCount}</b> จาก{" "}
              {competitionYears.length} กิจกรรม
            </span>
          </div>
        )}

        {filteredCompetitions.length > 0 ? (
          <ul className="space-y-3">
            {filteredCompetitions.map((comp: CompetitionYear) => {
              const isReady = Boolean(comp.isRegistrationOpen);
              const info = (
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`text-lg font-bold leading-snug ${isReady ? "" : "text-slate-500"}`}>
                      {comp.competitionName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-sm font-semibold whitespace-nowrap ${
                        isReady
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {isReady ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      {isReady ? "ประกาศผลแล้ว" : "รอประกาศผล"}
                    </span>
                  </span>
                  <span className="mt-1 flex flex-wrap gap-x-5 gap-y-0.5 text-sm sm:text-base text-slate-600">
                    {comp.registrationLocation && (
                      <span className="inline-flex items-start gap-1.5">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                        {comp.registrationLocation}
                      </span>
                    )}
                    {comp.registrationMode && (
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4 shrink-0 text-blue-600" />
                        {comp.registrationMode === "team" ? "ประเภททีม" : "ประเภทบุคคล"}
                      </span>
                    )}
                  </span>
                </span>
              );

              return (
                <li
                  key={comp.competitionYearID ?? comp.competitionID}
                  className={`rounded-2xl border-2 border-slate-200 border-l-[6px] overflow-hidden transition-all ${
                    isReady
                      ? "bg-white border-l-emerald-500 shadow-sm hover:shadow-md hover:border-emerald-300"
                      : "bg-slate-50 border-l-slate-300"
                  }`}
                >
                  {isReady ? (
                    <button
                      onClick={() => handleGo(comp)}
                      className="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 px-4 sm:px-6 py-4 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {info}
                      <span className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-base font-semibold bg-blue-600 text-white shrink-0 sm:w-52">
                        <Trophy className="w-4 h-4" />
                        ดูผลการแข่งขัน
                        <ChevronRight className="w-5 h-5" />
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 px-4 sm:px-6 py-4">
                      {info}
                      <span className="text-sm text-slate-400 shrink-0 sm:w-52 sm:text-center">
                        ยังไม่เปิดให้ดูผล
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 md:p-12 text-center">
            <Trophy className="w-10 h-10 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              {searchTerm ? "ไม่พบกิจกรรมที่ค้นหา" : "ยังไม่มีข้อมูลกิจกรรมในปีนี้"}
            </h3>
            <p className="text-slate-500 text-base md:text-lg mb-6">
              {searchTerm
                ? `ไม่พบกิจกรรมที่ตรงกับคำว่า "${searchTerm}"`
                : `ขณะนี้ยังไม่มีรายการกิจกรรมการแข่งขัน${displayYear}`}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm("")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                ล้างคำค้นหา
              </button>
            ) : (
              <button
                onClick={() => navigate("/yearresults")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                ย้อนกลับไปเลือกปีอื่น
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CompetitionYearsResults;
