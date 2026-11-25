import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Trophy,
  ChevronRight,
  MapPin,
  Search,
  X,
  Building2,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useGetReportCompetitionYearsQuery,
  useGetReportYearsQuery,
  useLazyGetReportCompetitionLevelsQuery,
} from "../../PublicReport/PublicReportApi";
import type { PublicReportCompetitionLevel } from "../../PublicReport/type";
import { useGetSystemSettingsQuery } from "../../setting/systemSettingsApi";
import { useGetAllYearQuery } from "../../Year/YearApi";
import { isRegistrationClosed } from "../../../utils";

interface LevelSlot {
  id: number;
  name: string;
  minutes: number;
  time: string;
}

// One card = one activity on one day; levels competing that day are merged in
interface ScheduleItem {
  id: number;
  minutes: number;
  time: string;
  activity: string;
  levels: LevelSlot[];
  location: string;
}

interface DaySchedule {
  key: string;
  dayNumber: number | null;
  dateText: string;
  weekday: string;
  // solid day color, used for the badge, timeline dot and location icon
  color: string;
  items: ScheduleItem[];
}

// Same base as other public pages (slate-50 background, white cards)
const C = {
  paper: "#F8FAFC",
  card: "#FFFFFF",
  ink: "#0F172A",
  muted: "#64748B",
  line: "#E2E8F0",
  mustard: "#E0A526",
};

// โทนเดียวกับหน้าอื่น (น้ำเงินเป็นหลัก) แต่ยังแยกสีแต่ละวันได้
const DAY_COLORS = ["#2563EB", "#059669", "#D97706", "#DB2777", "#7C3AED"];
const TBD_KEY = "tbd";

const pad = (n: number) => String(n).padStart(2, "0");

const buildSchedule = (
  competitions: { name: string; location: string; levels: PublicReportCompetitionLevel[] }[]
): DaySchedule[] => {
  const byDay = new Map<string, { date: Date | null; items: ScheduleItem[] }>();

  competitions.forEach(({ name, location, levels }) =>
    levels.forEach((lv) => {
      const date = lv.competitionDateTime ? new Date(lv.competitionDateTime) : null;
      const valid = date && !isNaN(date.getTime()) ? date : null;
      const key = valid
        ? `${valid.getFullYear()}-${pad(valid.getMonth() + 1)}-${pad(valid.getDate())}`
        : TBD_KEY;
      const entry = byDay.get(key) ?? { date: valid, items: [] };
      const slot: LevelSlot = {
        id: lv.competitionLevelID,
        name: lv.levelName,
        minutes: valid ? valid.getHours() * 60 + valid.getMinutes() : 0,
        time: valid ? `${pad(valid.getHours())}.${pad(valid.getMinutes())} น.` : "ยังไม่กำหนดเวลา",
      };
      const existing = entry.items.find((i) => i.activity === name);
      if (existing) {
        existing.levels.push(slot);
        existing.levels.sort((a, b) => a.minutes - b.minutes);
        existing.minutes = existing.levels[0].minutes;
        existing.time = existing.levels[0].time;
      } else {
        entry.items.push({
          id: slot.id,
          minutes: slot.minutes,
          time: slot.time,
          activity: name,
          levels: [slot],
          location: location || "ยังไม่ระบุสถานที่",
        });
      }
      byDay.set(key, entry);
    })
  );

  const dated = [...byDay.entries()]
    .filter(([key]) => key !== TBD_KEY)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { date, items }], idx) => ({
      key,
      dayNumber: idx + 1,
      dateText: date!.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }),
      weekday: date!.toLocaleDateString("th-TH", { weekday: "long" }),
      color: DAY_COLORS[idx % DAY_COLORS.length],
      items,
    }));

  const tbd = byDay.get(TBD_KEY);
  return tbd
    ? [
        ...dated,
        {
          key: TBD_KEY,
          dayNumber: null,
          dateText: "รอประกาศวันเวลา",
          weekday: "",
          color: C.muted,
          items: tbd.items,
        },
      ]
    : dated;
};

const groupByTime = (items: ScheduleItem[]) => {
  const groups = new Map<string, ScheduleItem[]>();
  [...items]
    .sort((a, b) => a.minutes - b.minutes || a.activity.localeCompare(b.activity, "th"))
    .forEach((item) => {
      groups.set(item.time, [...(groups.get(item.time) ?? []), item]);
    });
  return [...groups.entries()];
};

export const EventSchedulePage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: years, isLoading: yearsLoading } = useGetReportYearsQuery();
  const { data: settings, isLoading: settingsLoading } = useGetSystemSettingsQuery();
  const { data: fullYears } = useGetAllYearQuery();
  // ใช้ปีเดียวกับที่หน้าแรกแสดง (ตั้งค่าในหน้าผู้ดูแล) ถ้าไม่ได้ตั้ง → ปีที่เปิดใช้งานล่าสุด
  const displayYearId =
    settings?.homeDisplayYearId ?? (settings as any)?.HomeDisplayYearId;
  const activeYear =
    years?.find((y) => y.yearID === displayYearId) ??
    [...(years ?? [])]
      .sort((a, b) => Number(!!b.isActive) - Number(!!a.isActive) || b.yearNumber - a.yearNumber)[0];
  const registrationOpen = !isRegistrationClosed(
    fullYears?.find((y) => y.yearID === activeYear?.yearID)?.registrationCloseDate,
  );
  const { data: competitionYears, isLoading: cyLoading } = useGetReportCompetitionYearsQuery(
    activeYear?.yearID ?? 0,
    { skip: !activeYear || settingsLoading }
  );

  const [fetchLevels] = useLazyGetReportCompetitionLevelsQuery();
  const [scheduleData, setScheduleData] = useState<DaySchedule[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!competitionYears) return;
    let cancelled = false;
    setLevelsLoading(true);
    setError(false);
    Promise.all(
      competitionYears.map(async (cy) => ({
        name: cy.competitionName,
        location: cy.registrationLocation ?? "",
        levels: await fetchLevels(cy.competitionYearID, true).unwrap(),
      }))
    )
      .then((competitions) => {
        if (!cancelled) setScheduleData(buildSchedule(competitions));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLevelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [competitionYears, fetchLevels]);

  const isLoading = yearsLoading || settingsLoading || cyLoading || levelsLoading;

  // วันนี้ (ใช้ไฮไลต์วันแข่ง/รายการถัดไป)
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // ถ้าวันนี้เป็นวันแข่ง เลือกแท็บวันนี้ให้อัตโนมัติ (ครั้งแรกที่โหลดเสร็จ)
  const [autoSelected, setAutoSelected] = useState(false);
  useEffect(() => {
    if (autoSelected || scheduleData.length === 0) return;
    if (scheduleData.some((d) => d.key === todayKey)) setSelectedDay(todayKey);
    setAutoSelected(true);
  }, [scheduleData, todayKey, autoSelected]);
  const datedDays = scheduleData.filter((d) => d.dayNumber !== null);
  const totalActivities = scheduleData.reduce(
    (n, d) => n + d.items.reduce((m, i) => m + i.levels.length, 0),
    0
  );
  const totalVenues = new Set(scheduleData.flatMap((d) => d.items.map((i) => i.location))).size;
  const dateRange =
    datedDays.length > 1
      ? `${datedDays[0].dateText} – ${datedDays[datedDays.length - 1].dateText}`
      : datedDays[0]?.dateText;

  const filteredData = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scheduleData
      .filter((d) => selectedDay === "all" || d.key === selectedDay)
      .map((d) => ({
        ...d,
        items: q
          ? d.items.filter((i) =>
              `${i.activity} ${i.levels.map((l) => l.name).join(" ")} ${i.location}`.toLowerCase().includes(q)
            )
          : d.items,
      }))
      .filter((d) => d.items.length > 0);
  }, [scheduleData, selectedDay, query]);

  const tabs: { key: string; label: string; sub: string; color: string }[] = [
    { key: "all", label: "ทั้งหมด", sub: `${datedDays.length} วัน`, color: C.ink },
    ...scheduleData.map((d) => ({
      key: d.key,
      label:
        d.key === todayKey ? "วันนี้" : d.dayNumber !== null ? `วันที่ ${d.dayNumber}` : "รอประกาศ",
      sub: d.dayNumber !== null ? d.dateText.split(" ").slice(0, 2).join(" ") : "",
      color: d.color,
    })),
  ];

  return (
    <div className="min-h-screen pb-20 font-sans selection:bg-blue-100 selection:text-blue-900" style={{ background: C.paper, color: C.ink }}>
      {/* Hero */}
      <header className="border-b" style={{ borderColor: C.line }}>
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 py-5 md:py-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            กำหนดการกิจกรรมการแข่งขัน
            {activeYear && (
              <span className="ml-2 font-bold" style={{ color: C.muted }}>
                {activeYear.yearName}
              </span>
            )}
          </h1>
          {!isLoading && totalActivities > 0 && (
            <div
              className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-base"
              style={{ color: C.muted }}
            >
              {dateRange && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  {dateRange}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                {totalActivities} รายการ
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {totalVenues} สถานที่
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Sticky filters */}
      <div
        className="sticky top-16 lg:top-[72px] z-20 border-b backdrop-blur"
        style={{ background: "rgba(248,250,252,0.92)", borderColor: C.line }}
      >
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 py-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          {/* เงาจางที่ขอบขวา (มือถือ) บอกว่ายังเลื่อนดูแท็บต่อได้ */}
          <div className="relative min-w-0">
          <div className="flex gap-2 overflow-x-auto pr-8 md:pr-0 [scrollbar-width:none]">
            {tabs.map((t) => {
              const active = selectedDay === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setSelectedDay(t.key)}
                  className="whitespace-nowrap px-4 py-2 rounded-full text-base border transition-colors cursor-pointer"
                  style={
                    active
                      ? { background: t.color, borderColor: t.color, color: "#fff" }
                      : { background: C.card, borderColor: C.line, color: C.ink }
                  }
                >
                  <span className="font-semibold">{t.label}</span>
                  {t.sub && <span className="ml-1.5 text-sm opacity-75">{t.sub}</span>}
                </button>
              );
            })}
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-full w-10 md:hidden"
            style={{ background: `linear-gradient(to right, transparent, ${C.paper})` }}
          />
          </div>
          <div className="relative md:w-80 shrink-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: C.muted }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหากิจกรรม ระดับชั้น หรือ สถานที่"
              className="w-full pl-9 pr-9 py-2.5 rounded-full border text-base outline-none focus:border-slate-900 transition-colors"
              style={{ background: C.card, borderColor: C.line }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="ล้างคำค้นหา"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5 cursor-pointer"
                style={{ color: C.muted }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Days */}
      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 mt-6 sm:mt-8 space-y-8 sm:space-y-10">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-lg" style={{ color: C.muted }}>
            <Loader2 className="w-5 h-5 animate-spin" />
            กำลังโหลดกำหนดการ...
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-16 rounded-2xl border" style={{ background: C.card, borderColor: C.line }}>
            <p className="font-semibold">โหลดกำหนดการไม่สำเร็จ</p>
            <p className="text-base" style={{ color: C.muted }}>กรุณาลองรีเฟรชหน้าอีกครั้ง</p>
          </div>
        )}

        {!isLoading && !error && filteredData.length === 0 && (
          <div
            className="text-center py-16 rounded-2xl border"
            style={{ background: C.card, borderColor: C.line }}
          >
            <Search className="w-10 h-10 mx-auto" style={{ color: C.line }} />
            <p className="mt-3 font-semibold">
              {query ? "ไม่พบกิจกรรมที่ค้นหา" : "ยังไม่มีกำหนดการกิจกรรม"}
            </p>
            {query && (
              <p className="text-base" style={{ color: C.muted }}>
                ลองใช้คำค้นอื่น หรือเลือก "ทั้งหมด"
              </p>
            )}
          </div>
        )}

        {!isLoading && !error && filteredData.map((day) => {
          const isToday = day.key === todayKey;
          const isPast = day.key !== TBD_KEY && day.key < todayKey;
          const timeGroups = groupByTime(day.items);
          // วันนี้: ช่วงเวลาแรกที่ยังไม่ถึง = "ถัดไป"
          const nextTime = isToday
            ? timeGroups.find(([, items]) => items[0].minutes >= nowMinutes)?.[0]
            : undefined;
          return (
          <section key={day.key} className={isPast ? "opacity-60" : ""}>
            {/* Day header: แถบเดียว ไม่กินจอมือถือ */}
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 sm:mb-5 pb-3 border-b-2"
              style={{ borderColor: day.color }}
            >
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-sm sm:text-base font-bold"
                style={{ background: day.color }}
              >
                {day.dayNumber !== null ? `วันที่ ${day.dayNumber}` : <><Clock className="w-4 h-4" /> รอประกาศ</>}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {day.weekday && `${day.weekday} `}
                {day.dateText}
              </h2>
              {isToday && (
                <span className="px-2.5 py-0.5 rounded-full text-sm font-bold bg-rose-500 text-white">
                  วันนี้
                </span>
              )}
              {isPast && (
                <span className="text-sm font-semibold" style={{ color: C.muted }}>
                  ผ่านไปแล้ว
                </span>
              )}
              <span
                className="ml-auto inline-flex items-center gap-1.5 text-sm sm:text-base shrink-0"
                style={{ color: C.muted }}
              >
                <Trophy className="w-4 h-4" />
                {day.items.length} รายการ
              </span>
            </div>

            {/* Timeline */}
            <ol className="relative border-l-2 ml-2 sm:ml-4 space-y-6 sm:space-y-8" style={{ borderColor: C.line }}>
              {timeGroups.map(([time, items]) => {
                const passed = isToday && items[0].minutes < nowMinutes && time !== nextTime;
                const isNext = time === nextTime;
                return (
                <li key={time} className={`pl-5 sm:pl-8 relative ${passed ? "opacity-50" : ""}`}>
                  <span
                    className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4"
                    style={{ background: day.color, borderColor: C.paper }}
                  />
                  <div className="flex items-center gap-2 text-lg font-bold mb-3">
                    <Clock className="w-4 h-4" style={{ color: day.color }} />
                    {time}
                    {isNext && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                        ถัดไป
                      </span>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {items.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-xl border p-5 border-l-4 transition-shadow hover:shadow-md"
                        style={{ background: C.card, borderColor: C.line, borderLeftColor: day.color }}
                      >
                        <h3 className="text-lg sm:text-xl font-bold leading-snug">
                          {item.activity}
                        </h3>
                        <div className="mt-3">
                          <div className="text-sm font-semibold mb-1.5" style={{ color: C.muted }}>
                            {item.levels.length > 1
                              ? `แข่งขัน ${item.levels.length} ระดับชั้นในวันนี้`
                              : "ระดับชั้น"}
                          </div>
                          {item.levels.every((l) => l.time === item.time) ? (
                            // all levels start together -> chips only
                            <div className="flex flex-wrap gap-1.5">
                              {item.levels.map((l) => (
                                <span
                                  key={l.id}
                                  className="px-2.5 py-0.5 rounded-full text-sm font-semibold"
                                  style={{ background: `${day.color}14`, color: day.color }}
                                >
                                  {l.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <ul
                              className="rounded-lg border divide-y text-base"
                              style={{ borderColor: C.line }}
                            >
                              {item.levels.map((l) => (
                                <li
                                  key={l.id}
                                  className="flex items-center justify-between gap-3 px-3 py-2"
                                  style={{ borderColor: C.line }}
                                >
                                  <span className="font-semibold" style={{ color: day.color }}>
                                    {l.name}
                                  </span>
                                  <span className="inline-flex items-center gap-1 whitespace-nowrap" style={{ color: C.muted }}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {l.time}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="mt-3 flex items-start gap-2 text-base" style={{ color: C.muted }}>
                          <MapPin className="w-4 h-4 mt-1 shrink-0" style={{ color: day.color }} />
                          <span>{item.location}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </li>
                );
              })}
            </ol>
          </section>
          );
        })}

        {/* CTA: เปิดรับสมัคร → ชวนลงทะเบียน, ปิดแล้ว → ชวนดูผล */}
        <div className="rounded-2xl p-6 sm:p-8 md:p-10 text-white bg-blue-600 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold">
              {registrationOpen ? "พร้อมเข้าร่วมการแข่งขันหรือยัง?" : "ติดตามผลการแข่งขัน"}
            </h3>
            <p className="opacity-90">
              {registrationOpen
                ? "เลือกปีและกิจกรรมเพื่อเริ่มลงทะเบียนได้ทันที"
                : "ดูผลรางวัลและดาวน์โหลดเกียรติบัตรของแต่ละกิจกรรม"}
            </p>
          </div>
          <button
            onClick={() => navigate(registrationOpen ? "/yearuser" : "/yearresults")}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 font-bold px-6 py-3.5 rounded-xl bg-white text-slate-900 hover:bg-white/90 transition-colors cursor-pointer shrink-0"
          >
            {registrationOpen ? "ไปหน้าลงทะเบียนกิจกรรม" : "ดูผลการแข่งขัน"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default EventSchedulePage;
