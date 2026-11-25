import { Loading } from "../../../components/Loading";
import { useGetAllYearQuery } from "../YearApi";
import { useNavigate } from "react-router-dom";
import { formatThaiDate } from "../../../utils";
import {
  ChevronRight,
  FileText,
  CalendarDays,
  ExternalLink,
  ArrowRight,
  Clock,
  Info,
} from "lucide-react";
import type { Year } from "../type";
import { useGetSystemSettingsQuery } from "../../setting/systemSettingsApi";
import { adminManualUrl } from "../../../components/AdminManualButton";
import { BookOpen } from "lucide-react";

const STEPS = ["เลือกปี", "เลือกกิจกรรม", "เลือกระดับชั้น", "ลงทะเบียน"];

/** Step Indicator (inline) */
function StepsBar() {
  return (
    <ol className="mt-5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 sm:gap-x-2">
      {STEPS.map((label, idx) => (
        <li key={label} className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-sm sm:text-base font-medium whitespace-nowrap ${
              idx === 0
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-500"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                idx === 0
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
      ))}
    </ol>
  );
}

type Status = "open" | "upcoming" | "closed";

const STATUS_STYLE: Record<
  Status,
  { text: string; badge: string; dot: string; order: number }
> = {
  open: {
    text: "กำลังเปิดรับสมัคร",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    order: 0,
  },
  upcoming: {
    text: "ยังไม่เปิดรับสมัคร",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
    order: 1,
  },
  closed: {
    text: "ปิดรับสมัครแล้ว",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
    order: 2,
  },
};

const toDate = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const getStatus = (year: Year): Status => {
  const now = new Date();
  const open = toDate(year.registrationOpenDate);
  const close = toDate(year.registrationCloseDate);
  if (open && now < open) return "upcoming";
  if (close && now > close) return "closed";
  return "open";
};

const formatCloseDate = (value?: string) => {
  const d = toDate(value);
  if (!d || !value) return "ไม่ระบุ";
  const hasTime = value.includes("T") || value.includes(":");
  const time = hasTime
    ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    : "23:59";
  return `${formatThaiDate(value)} (${time} น.)`;
};

const formatRange = (year: Year) =>
  `${year.registrationOpenDate ? formatThaiDate(year.registrationOpenDate) : "ไม่ระบุ"} – ${formatCloseDate(year.registrationCloseDate)}`;

const daysUntil = (value?: string) => {
  const d = toDate(value);
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
};

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-sm font-semibold whitespace-nowrap ${s.badge}`}
    >
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {s.text}
    </span>
  );
}

const YearUserList = () => {
  const { data: years, isLoading } = useGetAllYearQuery();
  const { data: settings } = useGetSystemSettingsQuery();
  const userManualPath = settings?.userManualPath ?? (settings as any)?.UserManualPath;
  const navigate = useNavigate();

  if (isLoading) return <Loading />;

  const goToYear = (year: Year) =>
    navigate(`/competitionYearsList/${year.yearID}`, {
      state: {
        yearName: year.yearName,
        registrationCloseDate: year.registrationCloseDate,
      },
    });

  const sortedYears = (years ?? [])
    .filter((year: Year) => year.isActive)
    .map((year: Year) => ({ year, status: getStatus(year) }))
    .sort(
      (a, b) =>
        STATUS_STYLE[a.status].order - STATUS_STYLE[b.status].order ||
        (b.year.yearNumber ?? 0) - (a.year.yearNumber ?? 0),
    );

  const openYears = sortedYears.filter((y) => y.status === "open");
  const otherYears = sortedYears.filter((y) => y.status !== "open");
  const nextUpcoming = otherYears.find((y) => y.status === "upcoming");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-1.5">
          <span className="flex-1 bg-blue-600" />
          <span className="flex-1 bg-emerald-500" />
          <span className="flex-1 bg-amber-500" />
          <span className="flex-1 bg-rose-500" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 md:py-10 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-snug">
            เลือกปีการจัดงาน
            <span className="block sm:inline"> สัปดาห์วิทยาศาสตร์</span>
          </h1>
          <p className="mt-2 text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
            เลือกปีเพื่อดูรายการกิจกรรมและการแข่งขันที่เปิดรับสมัคร
          </p>
          <StepsBar />
          {userManualPath && (
            <a
              href={adminManualUrl(userManualPath)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-base font-semibold text-blue-700 hover:underline"
            >
              <BookOpen className="h-4 w-4" />
              อ่านคู่มือการลงทะเบียน (PDF)
            </a>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 sm:mt-6 space-y-6 sm:space-y-8">
        {/* Open now */}
        {openYears.length > 0 ? (
          <section className="space-y-4">
            {openYears.map(({ year }) => {
              const left = daysUntil(year.registrationCloseDate);
              return (
                <article
                  key={year.yearID ?? ""}
                  className="rounded-2xl border-2 border-emerald-300 bg-white p-4 sm:p-6 md:p-7 shadow-sm md:flex md:items-center md:gap-8"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status="open" />
                      {left !== null && left >= 0 && (
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

                    <h2 className="mt-3 text-2xl md:text-3xl font-extrabold leading-tight">
                      ประจำปี {year.yearNumber}
                    </h2>
                    {year.yearName && (
                      <p className="mt-1 text-base text-slate-600">
                        {year.yearName}
                      </p>
                    )}

                    <p className="mt-3 flex items-start gap-2 text-base text-slate-700">
                      <CalendarDays className="w-5 h-5 mt-0.5 text-slate-400 shrink-0" />
                      <span>
                        รับสมัคร{" "}
                        <span className="font-semibold">
                          {formatRange(year)}
                        </span>
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 md:mt-0 flex flex-col sm:flex-row md:flex-col gap-2 md:w-72 shrink-0">
                    <button
                      className="sm:flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                      onClick={() => goToYear(year)}
                    >
                      เลือกกิจกรรมที่ต้องการสมัคร
                      <ArrowRight className="h-5 w-5" />
                    </button>
                    {year.competitionRegulationsUrl && (
                      <a
                        href={year.competitionRegulationsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        อ่านกฎระเบียบ
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          sortedYears.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <CalendarDays className="w-9 h-9 mx-auto text-slate-300 mb-3" />
              <h2 className="text-xl font-bold">ขณะนี้ยังไม่เปิดรับสมัคร</h2>
              <p className="mt-1 text-slate-500">
                {nextUpcoming?.year.registrationOpenDate
                  ? `ปี ${nextUpcoming.year.yearNumber} จะเปิดรับสมัคร ${formatThaiDate(nextUpcoming.year.registrationOpenDate)}`
                  : "โปรดติดตามประกาศการเปิดรับสมัครครั้งถัดไป"}
              </p>
            </section>
          )
        )}

        {/* Other years */}
        {otherYears.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3">
              {openYears.length > 0 ? "ปีอื่น ๆ" : "ปีการจัดงานทั้งหมด"}
            </h2>
            <ul className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
              {otherYears.map(({ year, status }) => (
                <li key={year.yearID ?? ""} className="flex items-stretch">
                  <button
                    onClick={() => goToYear(year)}
                    className="flex-1 min-w-0 flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-1.5 px-4 sm:px-5 py-4 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span className="text-xl font-extrabold sm:w-16 shrink-0">
                      {year.yearNumber}
                    </span>
                    <span className="order-last sm:order-none basis-full sm:basis-auto min-w-0 sm:flex-1">
                      {year.yearName && (
                        <span className="block font-medium truncate">
                          {year.yearName}
                        </span>
                      )}
                      <span className="block text-sm text-slate-500">
                        {formatRange(year)}
                      </span>
                    </span>
                    <StatusBadge status={status} />
                    <ChevronRight className="hidden sm:block h-5 w-5 text-slate-400 shrink-0" />
                  </button>
                  {year.competitionRegulationsUrl && (
                    <a
                      href={year.competitionRegulationsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="กฎระเบียบ"
                      aria-label={`กฎระเบียบปี ${year.yearNumber}`}
                      className="flex items-center px-4 border-l border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    >
                      <FileText className="h-5 w-5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Empty State */}
        {sortedYears.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 md:p-12 text-center">
            <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              ยังไม่มีข้อมูลปีการแข่งขัน
            </h3>
            <p className="text-slate-500 text-base md:text-lg">
              โปรดตรวจสอบอีกครั้งภายหลัง หรือสอบถามผู้ดูแลระบบ
            </p>
          </div>
        )}

        {/* Tip */}
        {sortedYears.length > 0 && (
          <p className="flex items-start gap-2 text-sm text-slate-500">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            ควรอ่านกฎระเบียบและเตรียมเอกสารให้พร้อมก่อนลงทะเบียน
            ปีที่ปิดรับสมัครแล้วยังกดเข้าไปดูรายละเอียดกิจกรรมได้
          </p>
        )}
      </main>
    </div>
  );
};

export default YearUserList;
