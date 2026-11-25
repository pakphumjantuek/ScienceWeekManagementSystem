import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  useGetReportCompetitionLevelSummaryQuery,
  useGetReportCompetitorsAnnouncementQuery,
} from "../PublicReportApi";
import { Loading } from "../../../components";
import {
  ArrowLeft,
  Megaphone,
  Search,
  Building2,
  Users,
  UserCheck,
  X,
  CalendarDays,
  MapPin,
  User,
} from "lucide-react";

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date} เวลา ${pad(d.getHours())}.${pad(d.getMinutes())} น.`;
};

export default function CompetitorAnnouncementPage() {
  const { competitionLevelId } = useParams<{ competitionLevelId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const levelId = Number(competitionLevelId);

  const [searchTerm, setSearchTerm] = useState("");

  const { data: announcementData, isLoading, error } = useGetReportCompetitorsAnnouncementQuery(
    levelId,
    { skip: !competitionLevelId }
  );
  const { data: summary } = useGetReportCompetitionLevelSummaryQuery(levelId, {
    skip: !competitionLevelId,
  });

  const activityName =
    location.state?.activityName || location.state?.competitionName || summary?.competitionName || "";
  const levelDisplayName =
    location.state?.levelName ||
    summary?.levelName ||
    announcementData?.[0]?.competitionLevelName ||
    `รหัสกิจกรรม #${competitionLevelId}`;
  const dateTimeText = formatDateTime(summary?.competitionDateTime);

  const filteredTeams = useMemo(() => {
    if (!announcementData) return [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return announcementData;
    return announcementData.filter(
      (item) =>
        item.schoolName.toLowerCase().includes(term) ||
        item.competitorNames.some((c) => c.toLowerCase().includes(term)) ||
        item.advisorNames.some((a) => a.toLowerCase().includes(term))
    );
  }, [announcementData, searchTerm]);

  const totalCompetitors = announcementData?.reduce((n, t) => n + t.competitorNames.length, 0) ?? 0;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/announcements");
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-5 md:py-7">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-base font-medium text-slate-500 hover:text-slate-900 transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            ย้อนกลับ
          </button>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-700">
            <Megaphone className="h-4 w-4" />
            ประกาศรายชื่อผู้เข้าแข่งขัน
          </div>

          <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            {activityName}
            {activityName && <span className="text-slate-400 font-bold"> · </span>}
            <span className="text-blue-700">{levelDisplayName}</span>
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-base text-slate-500">
            {dateTimeText && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 shrink-0" />
                {dateTimeText}
              </span>
            )}
            {summary?.registrationLocation && (
              <span className="inline-flex items-start gap-1.5">
                <MapPin className="w-4 h-4 shrink-0 mt-1" />
                {summary.registrationLocation}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="w-4 h-4 shrink-0" />
              {announcementData?.length || 0} ทีม
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-4 h-4 shrink-0" />
              {totalCompetitors} คน
            </span>
          </div>
        </div>
      </header>

      {/* Sticky search */}
      <div className="sticky top-16 lg:top-[72px] z-20 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาโรงเรียน ผู้เข้าแข่งขัน หรือครู"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-full text-base text-slate-800 placeholder-slate-400 outline-none focus:border-slate-900 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label="ล้างคำค้นหา"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-sm text-slate-500">
            แสดง <span className="font-bold text-slate-800">{filteredTeams.length}</span> จาก{" "}
            {announcementData?.length || 0} ทีม
          </div>
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-10 mt-6">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 text-base">
            เกิดข้อผิดพลาดในการโหลดประกาศรายชื่อผู้เข้าแข่งขัน
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-lg text-slate-700">ไม่พบรายชื่อผู้เข้าแข่งขัน</p>
            <p className="text-base text-slate-400 mt-1">
              {searchTerm ? "ลองใช้คำค้นอื่น" : "ยังไม่มีการประกาศรายชื่อในระดับชั้นนี้"}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden space-y-3">
              {filteredTeams.map((team, idx) => (
                <article
                  key={team.teamID || idx}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="text-lg font-bold leading-snug pt-0.5">{team.schoolName}</h3>
                  </div>

                  <div className="mt-3 space-y-3 text-base">
                    <div>
                      <div className="text-sm font-semibold text-slate-500 mb-1">ผู้เข้าแข่งขัน</div>
                      {team.competitorNames.length > 0 ? (
                        <ul className="space-y-1">
                          {team.competitorNames.map((name, cIdx) => (
                            <li key={cIdx} className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-600 shrink-0" />
                              {name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400">ไม่พบรายชื่อ</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-500 mb-1">ครูผู้ควบคุม</div>
                      {team.advisorNames.length > 0 ? (
                        <ul className="space-y-1">
                          {team.advisorNames.map((name, aIdx) => (
                            <li key={aIdx} className="flex items-center gap-2 text-slate-700">
                              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              {name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400">ไม่ระบุ</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-base">
                <thead className="bg-slate-100 text-slate-600 text-sm">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-center w-16">ลำดับ</th>
                    <th className="px-4 py-3 font-semibold w-[28%]">โรงเรียน</th>
                    <th className="px-4 py-3 font-semibold">ผู้เข้าแข่งขัน</th>
                    <th className="px-4 py-3 font-semibold">ครูผู้ควบคุม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeams.map((team, idx) => (
                    <tr key={team.teamID || idx} className="align-top hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{team.schoolName}</td>
                      <td className="px-4 py-4">
                        {team.competitorNames.length > 0 ? (
                          <ul className="space-y-1">
                            {team.competitorNames.map((name, cIdx) => (
                              <li key={cIdx} className="flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-600 shrink-0" />
                                {name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-400">ไม่พบรายชื่อ</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {team.advisorNames.length > 0 ? (
                          <ul className="space-y-1">
                            {team.advisorNames.map((name, aIdx) => (
                              <li key={aIdx} className="flex items-center gap-2 text-slate-700">
                                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                {name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-400">ไม่ระบุ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
