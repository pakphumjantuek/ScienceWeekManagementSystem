import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Download,
  GraduationCap,
  MapPin,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import { Loading } from "../../../../components/Loading";
import { withAuth } from "../../../../HOC";
import { handleDownloadCertificate } from "../../../../Apis/Export";
import { formatThaiDate, formatThaiDateTime } from "../../../../utils";
import { useGetMyRegistrationsQuery } from "../../TeamApi";
import { statusOptions, type MyRegistration } from "../../type";
import { DEFAULT_STATUS_META, STATUS_META } from "../../statusMeta";

const isClosed = (closeDate?: string | null) => {
  if (!closeDate) return false;
  const d = new Date(closeDate);
  if (isNaN(d.getTime())) return false;
  if (!closeDate.includes("T") && !closeDate.includes(":")) d.setHours(23, 59, 59, 999);
  return new Date() > d;
};

// state ที่หน้าลงทะเบียนทีม / เพิ่มนักเรียนต้องใช้ — สร้างจากข้อมูล API จึงไม่หายตอนรีเฟรช
const buildState = (r: MyRegistration) => ({
  requiresProject: r.requiresProject,
  competitionName: r.competitionName,
  levelName: r.levelName,
  mainPlayersCount: r.mainPlayersCount,
  reservePlayersCount: r.reservePlayersCount,
  advisorCount: r.advisorCount,
  registrationMode: r.registrationMode,
  maxStudentsPerSchool: r.maxStudentsPerSchool,
  yearId: String(r.yearID),
  yearName: r.yearName,
  competitionYearID: r.competitionYearID,
  registrationCloseDate: r.registrationCloseDate,
  competitionLevelID: r.competitionLevelID,
  isCertificateNumberGenerated: r.isCertificateNumberGenerated,
});

const MyRegistrationsPage = () => {
  const navigate = useNavigate();
  // รายชื่อนักเรียนแก้จากอีก API → โหลดใหม่ทุกครั้งที่เปิดหน้า ให้จำนวนสมาชิกตรงเสมอ
  const { data = [], isLoading, isError } = useGetMyRegistrationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const years = useMemo(() => {
    const map = new Map<number, string>();
    data.forEach((r) => map.set(r.yearID, r.yearName || `ปี ${r.yearNumber}`));
    return [...map.entries()];
  }, [data]);

  const groups = useMemo(() => {
    const filtered = data.filter(
      (r) =>
        (yearFilter === "all" || String(r.yearID) === yearFilter) &&
        (statusFilter === "all" || String(r.status) === statusFilter),
    );
    const map = new Map<number, MyRegistration[]>();
    filtered.forEach((r) => map.set(r.yearID, [...(map.get(r.yearID) ?? []), r]));
    return [...map.values()];
  }, [data, yearFilter, statusFilter]);

  if (isLoading) return <Loading />;

  const selectClass =
    "w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-1.5">
          <span className="flex-1 bg-blue-600" />
          <span className="flex-1 bg-emerald-500" />
          <span className="flex-1 bg-amber-500" />
          <span className="flex-1 bg-rose-500" />
        </div>
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 py-6 md:py-9 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            ประวัติการลงทะเบียนกิจกรรม
          </h1>
          <p className="mt-2 text-base md:text-lg text-slate-500">
            ทีมทั้งหมดที่คุณลงทะเบียนไว้ทุกปี ตรวจสถานะ เพิ่มสมาชิก และดาวน์โหลดเกียรติบัตรได้ที่นี่
          </p>
          <Link
            to="/training/my"
            className="mt-3 inline-flex items-center gap-1.5 text-sm sm:text-base font-medium text-blue-700 hover:underline"
          >
            <GraduationCap className="w-4 h-4" />
            ดูประวัติการลงทะเบียนอบรม
          </Link>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 mt-5 sm:mt-6 space-y-6">
        {isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
            ไม่สามารถโหลดข้อมูลได้ กรุณาเข้าสู่ระบบใหม่หรือลองอีกครั้ง
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl md:text-2xl font-bold mb-2">ยังไม่มีประวัติการลงทะเบียน</h2>
            <p className="text-slate-500 text-base md:text-lg mb-6">
              เริ่มลงทะเบียนกิจกรรมแรกของคุณได้เลย
            </p>
            <button
              onClick={() => navigate("/yearuser")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Trophy className="w-5 h-5" />
              ลงทะเบียนกิจกรรม
            </button>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <select
                aria-label="กรองตามปี"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">ทุกปี</option>
                {years.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                aria-label="กรองตามสถานะ"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">ทุกสถานะ</option>
                {statusOptions
                  .filter((s) => s.value !== 0)
                  .map((s) => (
                    <option key={s.value} value={s.value}>
                      {STATUS_META[s.value]?.label ?? s.label}
                    </option>
                  ))}
              </select>
              <span className="sm:ml-auto text-sm text-slate-500">ทั้งหมด {data.length} ทีม</span>
            </div>

            {groups.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                ไม่พบรายการตามตัวกรองที่เลือก
              </div>
            )}

            {groups.map((rows) => {
              const head = rows[0];
              const closed = isClosed(head.registrationCloseDate);
              return (
                <section key={head.yearID} className="space-y-3">
                  <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-xl sm:text-2xl font-extrabold">
                      {head.yearName || `ปี ${head.yearNumber}`}
                    </span>
                    <span className={`text-sm font-semibold ${closed ? "text-slate-500" : "text-emerald-700"}`}>
                      {closed
                        ? "ปิดรับสมัครแล้ว"
                        : head.registrationCloseDate
                          ? `แก้ไขได้ถึง ${formatThaiDate(head.registrationCloseDate)}`
                          : "เปิดรับสมัคร"}
                    </span>
                  </h2>

                  <ul className="space-y-3">
                    {rows.map((r) => {
                      const meta = STATUS_META[r.status] ?? DEFAULT_STATUS_META;
                      const StatusIcon = meta.icon;
                      const statusLabel =
                        meta.label ??
                        (statusOptions.find((s) => s.value === r.status)?.label || "รอดำเนินการ");
                      const isIndividual = r.registrationMode === "individual";
                      const mainNeed = r.mainPlayersCount ?? 0;
                      const missing = !isIndividual && mainNeed > 0 && r.mainFilledCount < mainNeed;
                      const canEdit = !closed;
                      const canDownload =
                        r.status === 3 && r.isCertificateNumberGenerated && r.hasCertificate;

                      return (
                        <li
                          key={r.teamID}
                          className={`rounded-2xl border-2 border-slate-200 border-l-[6px] bg-white shadow-sm overflow-hidden ${meta.border}`}
                        >
                          <div className={`flex items-center gap-3 px-4 sm:px-6 py-2.5 border-b border-slate-100 ${meta.bar}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.iconWrap}`}>
                              <StatusIcon className="w-5 h-5" />
                            </span>
                            <p className="min-w-0 leading-snug">
                              <span className="font-bold text-base">{statusLabel}</span>
                              <span className="block sm:inline text-sm opacity-80">
                                <span className="hidden sm:inline"> — </span>
                                {meta.hint}
                              </span>
                            </p>
                          </div>

                          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 px-4 sm:px-6 py-4">
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <p className="text-sm font-semibold text-blue-700">
                                {r.competitionName} · ระดับ {r.levelName}
                              </p>
                              <h3 className="text-lg sm:text-xl font-bold leading-snug">
                                {r.school_name}
                                {r.nameOrdinal ? ` (${r.nameOrdinal})` : ""}
                              </h3>
                              <div className="flex flex-col md:flex-row md:flex-wrap gap-x-6 gap-y-1 text-sm sm:text-base text-slate-700">
                                {!isIndividual && (
                                  <span className={`inline-flex items-center gap-1.5 ${missing ? "text-amber-800 font-semibold" : ""}`}>
                                    {missing ? (
                                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                    ) : (
                                      <Users className="w-4 h-4 text-blue-600 shrink-0" />
                                    )}
                                    ตัวจริง {r.mainFilledCount}/{mainNeed} คน
                                    {(r.reservePlayersCount ?? 0) > 0 &&
                                      ` · สำรอง ${r.reserveFilledCount}/${r.reservePlayersCount}`}
                                    {missing && " — ยังไม่ครบ"}
                                  </span>
                                )}
                                {r.competitionDateTime && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
                                    แข่งขัน {formatThaiDateTime(r.competitionDateTime)}
                                  </span>
                                )}
                                {r.registrationLocation && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                                    {r.registrationLocation}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                              {canEdit && (
                                <button
                                  onClick={() =>
                                    navigate(`/team/${r.teamID}/players`, { state: buildState(r) })
                                  }
                                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                    missing
                                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                                      : "bg-blue-600 hover:bg-blue-700 text-white"
                                  }`}
                                >
                                  <Settings className="w-4 h-4" />
                                  {missing ? "เพิ่มสมาชิกให้ครบ" : "จัดการสมาชิก"}
                                </button>
                              )}
                              {canDownload && (
                                <button
                                  onClick={() => handleDownloadCertificate(r.teamID)}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-base font-bold text-white transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <Download className="w-4 h-4" />
                                  ดาวน์โหลดเกียรติบัตร
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  navigate(`/teamregister/${r.competitionLevelID}`, { state: buildState(r) })
                                }
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-3 text-base font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                ดูรายละเอียด
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
};

export default withAuth(MyRegistrationsPage);
