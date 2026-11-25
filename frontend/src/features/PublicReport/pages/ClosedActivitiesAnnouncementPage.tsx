import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetReportYearsQuery, useGetReportCompetitionYearsQuery, useGetReportCompetitionLevelsQuery } from "../PublicReportApi";
import { Loading } from "../../../components";
import { ArrowLeft, Trophy, ChevronRight, Megaphone, Calendar, Layers } from "lucide-react";

export default function ClosedActivitiesAnnouncementPage() {
  const navigate = useNavigate();
  const { data: years, isLoading: isLoadingYears } = useGetReportYearsQuery();

  const [selectedYearId, setSelectedYearId] = useState<number | "">("");

  // Default to active or latest year
  const activeYearId = selectedYearId || years?.[0]?.yearID || 0;

  const { data: competitionYears, isLoading: isLoadingCompYears } = useGetReportCompetitionYearsQuery(
    Number(activeYearId),
    { skip: !activeYearId }
  );

  const [selectedCompYearId, setSelectedCompYearId] = useState<number | null>(null);

  const currentCompYearId = selectedCompYearId || competitionYears?.[0]?.competitionYearID || 0;

  const { data: competitionLevels, isLoading: isLoadingLevels } = useGetReportCompetitionLevelsQuery(
    Number(currentCompYearId),
    { skip: !currentCompYearId }
  );

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  if (isLoadingYears) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 selection:bg-blue-100 selection:text-blue-900">
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-6xl space-y-8">
        {/* Header Hero Banner */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 px-6 py-8 text-white">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-200 hover:text-white transition mb-6 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </button>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
                <Megaphone className="h-4 w-4" />
                ศูนย์ประกาศรายชื่อผู้เข้าแข่งขัน
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
                ประกาศรายชื่อผู้เข้าแข่งขัน (ปิดรับสมัครแล้ว)
              </h1>
              <p className="text-emerald-100 text-sm md:text-base max-w-2xl">
                คลิกเลือกกิจกรรมและระดับชั้นการแข่งขันที่ปิดรับสมัครแล้ว เพื่อเข้าดูรายชื่อผู้ลงทะเบียนแข่งขันและครูผู้ควบคุม
              </p>
            </div>
          </div>
        </div>

        {/* Year Filter */}
        {years && years.length > 0 && (
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-bold text-slate-700">เลือกปีการแข่งขัน:</span>
            <select
              value={activeYearId}
              onChange={(e) => {
                setSelectedYearId(Number(e.target.value));
                setSelectedCompYearId(null);
              }}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {years.map((y) => (
                <option key={y.yearID} value={y.yearID}>
                  {y.yearName} (ปีการศึกษา {y.yearNumber})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Activities List Section */}
        {isLoadingCompYears ? (
          <Loading />
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-600" />
              กิจกรรมการแข่งขัน
            </h2>

            {competitionYears && competitionYears.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {competitionYears.map((comp) => (
                  <div
                    key={comp.competitionYearID}
                    onClick={() => setSelectedCompYearId(comp.competitionYearID)}
                    className={`cursor-pointer rounded-2xl border transition-all p-6 bg-white shadow-xs flex flex-col justify-between hover:-translate-y-1 hover:shadow-md ${
                      currentCompYearId === comp.competitionYearID
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20"
                        : "border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {comp.competitionName}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ปิดรับสมัครแล้ว
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {comp.competitionName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        คลิกเพื่อดูระดับชั้นย่อยและประกาศรายชื่อผู้สมัคร
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-emerald-700">
                      <span>ดูระดับชั้นย่อย</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                ไม่พบกิจกรรมแข่งขันในสนามนี้
              </div>
            )}

            {/* Levels List for Selected Activity */}
            {currentCompYearId > 0 && (
              <div className="mt-10 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    ระดับชั้นการแข่งขันที่มีการประกาศรายชื่อ
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    เลือกระดับชั้นเพื่อดูตารางรายชื่อ
                  </span>
                </div>

                {isLoadingLevels ? (
                  <div className="text-center py-8 text-sm text-slate-500">กำลังดึงข้อมูลระดับชั้น...</div>
                ) : competitionLevels && competitionLevels.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {competitionLevels.map((lvl) => (
                      <button
                        key={lvl.competitionLevelID}
                        onClick={() =>
                          navigate(`/announcements/level/${lvl.competitionLevelID}`, {
                            state: {
                              levelName: lvl.levelName,
                            },
                          })
                        }
                        className="group text-left p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-xs hover:shadow-md flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-100">
                            ระดับชั้น
                          </div>
                          <div className="font-bold text-slate-900 group-hover:text-white text-base">
                            {lvl.levelName}
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-white text-slate-700 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition shadow-2xs">
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-slate-500">
                    ยังไม่มีระดับชั้นเปิดประกาศสำหรับกิจกรรมนี้
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
