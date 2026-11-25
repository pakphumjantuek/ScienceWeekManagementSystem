import { Loading } from "../../../components/Loading";
import { useGetAllYearQuery } from "../YearApi";
import { useNavigate } from "react-router-dom";
import { formatThaiDate } from "../../../utils";
import { ChevronRight, Trophy, CalendarDays, ArrowRight, Info } from "lucide-react";
import type { Year } from "../type";

const STEPS = ["เลือกปี", "เลือกกิจกรรม", "เลือกระดับชั้น", "ดูผลการแข่งขัน"];

function StepsBar({ current = 1 }: { current?: 1 | 2 | 3 | 4 }) {
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

// ยังไม่มีข้อมูล "ประกาศผลแล้ว" ในระบบ → ถือว่าปีที่ปิดรับสมัครแล้วมีผลให้ดู
const hasResults = (year: Year) => {
  if (!year.registrationCloseDate) return true;
  const d = new Date(year.registrationCloseDate);
  if (isNaN(d.getTime())) return true;
  const value = year.registrationCloseDate;
  if (!value.includes("T") && !value.includes(":")) d.setHours(23, 59, 59, 999);
  return new Date() > d;
};

const YearResults = () => {
  const { data: years, isLoading } = useGetAllYearQuery();
  const navigate = useNavigate();

  if (isLoading) return <Loading />;

  const activeYears = (years ?? [])
    .filter((year: Year) => year.isActive)
    .slice()
    .sort((a: Year, b: Year) => (b.yearNumber ?? 0) - (a.yearNumber ?? 0));

  const latest = activeYears.find(hasResults);
  const others = activeYears.filter((y) => y !== latest);

  const goToYear = (year: Year) =>
    navigate(`/competitionyearresults/${year.yearID}`, {
      state: { yearName: year.yearName, yearNumber: year.yearNumber },
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
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 md:py-10 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-snug">
            ผลการแข่งขัน
            <span className="block sm:inline text-blue-700"> สัปดาห์วิทยาศาสตร์</span>
          </h1>
          <p className="mt-2 text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
            เลือกปีเพื่อดูผลการแข่งขันและผลรางวัลของกิจกรรมในปีนั้น
          </p>
          <StepsBar current={1} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 mt-5 sm:mt-6 space-y-6 sm:space-y-8">
        {/* Latest year with results */}
        {latest && (
          <article className="rounded-2xl border-2 border-amber-300 bg-white p-4 sm:p-6 md:p-7 shadow-sm md:flex md:items-center md:gap-8">
            <div className="flex-1 min-w-0 flex items-start gap-4">
              <span className="hidden sm:flex w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 items-center justify-center shrink-0">
                <Trophy className="w-7 h-7" />
              </span>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-sm font-semibold bg-amber-50 text-amber-800 border-amber-200">
                  ปีล่าสุด
                </span>
                <h2 className="mt-2 text-2xl md:text-3xl font-extrabold leading-tight">
                  ประจำปี {latest.yearNumber}
                </h2>
                {latest.yearName && <p className="mt-1 text-base text-slate-600">{latest.yearName}</p>}
              </div>
            </div>
            <button
              onClick={() => goToYear(latest)}
              className="mt-5 md:mt-0 w-full md:w-72 shrink-0 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              ดูผลการแข่งขัน
              <ArrowRight className="h-5 w-5" />
            </button>
          </article>
        )}

        {/* Other years */}
        {others.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3">{latest ? "ปีอื่น ๆ" : "ปีการแข่งขัน"}</h2>
            <ul className="space-y-3">
              {others.map((year) => {
                const ready = hasResults(year);
                return (
                  <li key={year.yearID}>
                    <button
                      onClick={() => goToYear(year)}
                      className={`w-full flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-1.5 rounded-2xl border-2 border-slate-200 border-l-[6px] bg-white px-4 sm:px-6 py-4 text-left shadow-sm hover:shadow-md active:bg-slate-50 transition-all cursor-pointer ${
                        ready ? "border-l-blue-500 hover:border-blue-300" : "border-l-slate-300"
                      }`}
                    >
                      <span className="text-xl font-extrabold sm:w-16 shrink-0">{year.yearNumber}</span>
                      <span className="order-last sm:order-none basis-full sm:basis-auto min-w-0 sm:flex-1 text-sm sm:text-base text-slate-500 truncate">
                        {year.yearName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-sm font-semibold whitespace-nowrap ${
                          ready
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${ready ? "bg-blue-500" : "bg-slate-400"}`} />
                        {ready
                          ? "ดูผลได้"
                          : `ยังไม่มีผล · รับสมัครถึง ${formatThaiDate(year.registrationCloseDate!)}`}
                      </span>
                      <ChevronRight className="hidden sm:block h-5 w-5 text-slate-400 shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {activeYears.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 md:p-12 text-center">
            <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl md:text-2xl font-bold mb-2">ยังไม่มีข้อมูลปีการแข่งขัน</h3>
            <p className="text-slate-500 text-base md:text-lg">
              โปรดตรวจสอบอีกครั้งภายหลัง หรือสอบถามผู้ดูแลระบบ
            </p>
          </div>
        )}

        {activeYears.length > 0 && (
          <p className="flex items-start gap-2 text-sm text-slate-500">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            เลือกปี → กิจกรรม → ระดับชั้น เพื่อดูผลรางวัลอย่างเป็นทางการ
          </p>
        )}
      </main>
    </div>
  );
};

export default YearResults;
