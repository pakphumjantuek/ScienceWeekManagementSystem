import { useState, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loading } from "../../../components/Loading";
import { formatThaiDateTime } from "../../../utils";
import { useGetAllCompetitionLevelQuery } from "../CompetitionLevelApi";
import {
  ChevronRight,
  ArrowLeft,
  Trophy,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  X,
} from "lucide-react";

const STEPS = ["เลือกปี", "เลือกกิจกรรม", "เลือกระดับชั้น", "ดูผลการแข่งขัน"];

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

// แสดงช่องค้นหาเฉพาะเมื่อระดับชั้นเยอะ
const SEARCH_THRESHOLD = 6;

const canViewResults = (level: any) => Boolean(level.isCertificateNumberGenerated);

const CompetitionLevelResults = () => {
  const { competitionYearID } = useParams<{ competitionYearID: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");

  const { data: rawCompetitionLevels, isLoading } =
    useGetAllCompetitionLevelQuery(Number(competitionYearID));

  const competitionLevels = rawCompetitionLevels ?? [];

  const { requiresProject = false, competitionName = "" } = location.state || {};

  // ระดับชั้นที่ประกาศผลแล้วขึ้นก่อน
  const filteredLevels = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return competitionLevels
      .filter((level: any) => (level.levelName ?? "").toLowerCase().includes(term))
      .slice()
      .sort((a: any, b: any) => Number(canViewResults(b)) - Number(canViewResults(a)));
  }, [competitionLevels, searchTerm]);

  if (isLoading) return <Loading />;

  const readyCount = competitionLevels.filter(canViewResults).length;

  // เปิดลิงก์ตรง/รีเฟรช ไม่มีหน้าก่อนในเว็บ → กลับไปหน้าเลือกปี แทนการออกจากเว็บ
  const goBack = () =>
    location.key !== "default" ? navigate(-1) : navigate("/yearresults");

  const goDetail = (level: any) =>
    navigate(`/teamuserresult/${level.competitionLevelID}`, {
      state: { requiresProject, competitionName, levelName: level.levelName },
    });

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
            onClick={goBack}
            className="mb-4 md:mb-0 md:absolute md:left-10 md:top-8 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer"
            title="ย้อนกลับไปหน้าเลือกกิจกรรม"
          >
            <ArrowLeft className="h-4 w-4" />
            ย้อนกลับ
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-snug">
            เลือกระดับชั้นเพื่อดูผล
            {competitionName && (
              <span className="block sm:inline text-blue-700"> {competitionName}</span>
            )}
          </h1>
          <p className="mt-2 text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
            เลือกระดับชั้นหรือรุ่นการแข่งขันที่ต้องการดูผลรางวัล
          </p>
          <StepsBar current={3} />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 mt-5 sm:mt-6 space-y-5">
        {competitionLevels.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            {competitionLevels.length > SEARCH_THRESHOLD && (
              <label className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาระดับชั้น..."
                  aria-label="ค้นหาระดับชั้น"
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
            )}
            <span className="text-sm text-slate-500 shrink-0">
              ประกาศผลแล้ว <b className="text-emerald-700">{readyCount}</b> จาก{" "}
              {competitionLevels.length} ระดับชั้น
            </span>
          </div>
        )}

        {filteredLevels.length > 0 ? (
          <ul className="space-y-3">
            {filteredLevels.map((level: any, idx: number) => {
              const canView = canViewResults(level);
              const info = (
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`text-xl font-extrabold leading-snug ${canView ? "" : "text-slate-500"}`}>
                      ระดับชั้น {level.levelName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-sm font-semibold whitespace-nowrap ${
                        canView
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {canView ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      {canView ? "ประกาศผลแล้ว" : "รอประกาศผล"}
                    </span>
                  </span>
                  <span className="mt-1 flex items-start gap-1.5 text-sm sm:text-base text-slate-600">
                    <Calendar className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                    {level.competitionDateTime
                      ? `แข่งขัน ${formatThaiDateTime(level.competitionDateTime)}`
                      : "ยังไม่กำหนดวันแข่งขัน"}
                  </span>
                </span>
              );

              return (
                <li
                  key={level.competitionLevelID ?? idx}
                  className={`rounded-2xl border-2 border-slate-200 border-l-[6px] overflow-hidden transition-all ${
                    canView
                      ? "bg-white border-l-emerald-500 shadow-sm hover:shadow-md hover:border-emerald-300"
                      : "bg-slate-50 border-l-amber-400"
                  }`}
                >
                  {canView ? (
                    <button
                      onClick={() => goDetail(level)}
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
                      <span className="text-sm text-slate-500 shrink-0 sm:w-52 sm:text-center">
                        อยู่ระหว่างแข่งขัน / รอประกาศผล
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
              {searchTerm ? "ไม่พบระดับชั้นที่ค้นหา" : "ยังไม่มีข้อมูลระดับชั้น"}
            </h3>
            <p className="text-slate-500 text-base md:text-lg mb-6">
              {searchTerm
                ? `ไม่พบระดับชั้นที่ตรงกับคำว่า "${searchTerm}"`
                : "ยังไม่มีระดับชั้นที่เปิดในการแข่งขันนี้"}
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
                onClick={goBack}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                ย้อนกลับไปเลือกกิจกรรม
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CompetitionLevelResults;
