import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Award,
  ChevronDown,
  ChevronRight,
  Download,
  FileBadge,
  FolderCheck,
  Loader2,
  RefreshCw,
  School,
  Swords,
  UserCheck,
  Users,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { useGetAllYearQuery } from "../../Year/YearApi";
import { useGetDashboardReportQuery } from "../ReportApi";
import { handleDownloadCompetitionAttendanceReportPdf } from "../../../Apis/Export";
import type { DashboardReport } from "../type";

const fmt = new Intl.NumberFormat("th-TH");
const n = (v: number | undefined | null) => fmt.format(v ?? 0);
const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

// สถานะทีม: ใช้สีน้อย ๆ แต่แยกความหมายชัด
const STATUS = [
  { key: "verifiedTeams", label: "ลงทะเบียนสำเร็จ", color: "bg-emerald-500", dot: "bg-emerald-500", soft: "bg-emerald-50" },
  { key: "checkedInTeams", label: "เช็คอินแล้ว", color: "bg-blue-500", dot: "bg-blue-500", soft: "bg-blue-50" },
  { key: "projectRevisionTeams", label: "รอแก้ไขโครงงาน", color: "bg-amber-400", dot: "bg-amber-400", soft: "bg-amber-50" },
  { key: "disqualifiedTeams", label: "ถูกตัดสิทธิ์", color: "bg-rose-500", dot: "bg-rose-500", soft: "bg-rose-50" },
] as const;

const REWARD_COLORS = [
  { text: "text-amber-500", bar: "bg-amber-400" },
  { text: "text-slate-400", bar: "bg-slate-400" },
  { text: "text-orange-500", bar: "bg-orange-400" },
  { text: "text-sky-500", bar: "bg-sky-400" },
  { text: "text-violet-500", bar: "bg-violet-400" },
];

type TabKey = "activity" | "level" | "competition" | "school";
const TABS: { key: TabKey; label: string }[] = [
  { key: "activity", label: "รายกิจกรรม" },
  { key: "level", label: "รายระดับชั้น" },
  { key: "competition", label: "โรงเรียนต่อรายการ" },
  { key: "school", label: "โรงเรียน 10 อันดับ" },
];

// ===== Small building blocks =====
const Card = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>
);

const CardHeader = ({
  title,
  desc,
  right,
  icon: Icon,
  iconClass = "bg-blue-100 text-blue-600",
}: {
  title: string;
  desc?: string;
  right?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconClass?: string;
}) => (
  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
    <div className="flex items-start gap-3">
      {Icon && (
        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      </div>
    </div>
    {right}
  </div>
);

const KPI_TONES = {
  sky: { card: "bg-sky-50 border-sky-100", icon: "bg-sky-500", label: "text-sky-800" },
  indigo: { card: "bg-indigo-50 border-indigo-100", icon: "bg-indigo-500", label: "text-indigo-800" },
  emerald: { card: "bg-emerald-50 border-emerald-100", icon: "bg-emerald-500", label: "text-emerald-800" },
  orange: { card: "bg-orange-50 border-orange-100", icon: "bg-orange-500", label: "text-orange-800" },
} as const;

const Kpi = ({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  note?: React.ReactNode;
  tone: keyof typeof KPI_TONES;
}) => {
  const t = KPI_TONES[tone];
  return (
    <section className={`rounded-2xl border p-5 shadow-sm ${t.card}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-sm font-semibold ${t.label}`}>{label}</p>
        <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${t.icon}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{n(value)}</p>
      {note && <div className="mt-1 text-sm text-slate-600">{note}</div>}
    </section>
  );
};

// แถบเปอร์เซ็นต์เข้างาน ใช้ในตาราง
const RateBar = ({ part, total }: { part: number; total: number }) => {
  const p = pct(part, total);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${p >= 80 ? "bg-emerald-500" : p >= 50 ? "bg-blue-500" : "bg-amber-400"}`} style={{ width: `${p}%` }} />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-slate-500">{p}%</span>
    </div>
  );
};

const Th = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th className={`whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-600 ${right ? "text-right" : "text-left"}`}>
    {children}
  </th>
);
const Td = ({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) => (
  <td className={`px-4 py-3 ${right ? "text-right tabular-nums" : ""} ${className}`}>{children}</td>
);

const Empty = ({ text }: { text: string }) => <p className="px-5 py-12 text-center text-sm text-slate-500">{text}</p>;

// ===== Tables =====
const ActivityTable = ({ data }: { data: DashboardReport }) => {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const rows = data.competitionAttendanceSummary ?? [];
  if (rows.length === 0) return <Empty text="ยังไม่มีข้อมูลผู้สมัครในกิจกรรมการแข่งขัน" />;

  const toggle = (id: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allOpen = open.size === rows.length;

  return (
    <>
      <div className="flex justify-end px-5 pt-3">
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(rows.map((r) => r.competitionYearID)))}
          className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
        >
          {allOpen ? "ย่อทั้งหมด" : "แสดงระดับชั้นทั้งหมด"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-blue-100 bg-blue-50/50">
            <tr>
              <Th>กิจกรรม</Th>
              <Th right>ทีมสมัคร</Th>
              <Th right>ผู้สมัคร</Th>
              <Th right>ทีมเข้างาน</Th>
              <Th right>ผู้เข้างาน</Th>
              <Th>อัตราเข้างาน</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((c) => {
              const isOpen = open.has(c.competitionYearID);
              const hasLevels = c.levels.length > 0;
              return (
                <Fragment key={c.competitionYearID}>
                  <tr
                    className={`text-slate-800 ${hasLevels ? "cursor-pointer hover:bg-slate-50" : ""}`}
                    onClick={() => hasLevels && toggle(c.competitionYearID)}
                  >
                    <Td className="font-semibold text-slate-900">
                      <span className="flex items-center gap-2">
                        {hasLevels ? (
                          isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />
                        ) : (
                          <span className="w-4" />
                        )}
                        {c.competitionName}
                      </span>
                    </Td>
                    <Td right>{n(c.registeredTeamCount)}</Td>
                    <Td right>{n(c.registeredStudentCount)}</Td>
                    <Td right>{n(c.checkedInTeamCount)}</Td>
                    <Td right className="font-semibold">{n(c.checkedInStudentCount)}</Td>
                    <Td><RateBar part={c.checkedInStudentCount} total={c.registeredStudentCount} /></Td>
                  </tr>
                  {isOpen &&
                    c.levels.map((l) => (
                      <tr key={`${c.competitionYearID}-${l.levelID}`} className="bg-slate-50/60 text-slate-600">
                        <Td className="pl-12">{l.levelName}</Td>
                        <Td right>{n(l.registeredTeamCount)}</Td>
                        <Td right>{n(l.registeredStudentCount)}</Td>
                        <Td right>{n(l.checkedInTeamCount)}</Td>
                        <Td right>{n(l.checkedInStudentCount)}</Td>
                        <Td><RateBar part={l.checkedInStudentCount} total={l.registeredStudentCount} /></Td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

const LevelTable = ({ data }: { data: DashboardReport }) => {
  const rows = data.educationLevelAttendanceSummary ?? [];
  if (rows.length === 0) return <Empty text="ยังไม่มีข้อมูลระดับชั้น" />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b border-blue-100 bg-blue-50/50">
          <tr>
            <Th>ระดับชั้น</Th>
            <Th right>ทีมสมัคร</Th>
            <Th right>ผู้สมัคร</Th>
            <Th right>ทีมเข้างาน</Th>
            <Th right>ผู้เข้างาน</Th>
            <Th>อัตราเข้างาน</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-800">
          {rows.map((l) => (
            <tr key={l.levelID} className="hover:bg-slate-50">
              <Td className="font-medium text-slate-900">{l.levelName}</Td>
              <Td right>{n(l.registeredTeamCount)}</Td>
              <Td right>{n(l.registeredStudentCount)}</Td>
              <Td right>{n(l.checkedInTeamCount)}</Td>
              <Td right className="font-semibold">{n(l.checkedInStudentCount)}</Td>
              <Td><RateBar part={l.checkedInStudentCount} total={l.registeredStudentCount} /></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CompetitionTable = ({ data }: { data: DashboardReport }) => {
  const rows = useMemo(
    () =>
      [...data.competitionSummary].sort(
        (a, b) =>
          a.competitionName.localeCompare(b.competitionName, "th") ||
          (a.levelName || "").localeCompare(b.levelName || "", "th"),
      ),
    [data],
  );
  if (rows.length === 0) return <Empty text="ยังไม่มีรายการแข่งขันที่มีทีมสมัคร" />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b border-blue-100 bg-blue-50/50">
          <tr>
            <Th>รายการแข่งขัน</Th>
            <Th>ระดับชั้น</Th>
            <Th right>โรงเรียน</Th>
            <Th right>นักเรียน</Th>
          </tr>
        </thead>
        <tbody className="text-slate-800">
          {rows.map((item, i) => {
            const first = i === 0 || rows[i - 1].competitionName !== item.competitionName;
            return (
              <tr key={`${item.competitionName}-${item.levelName}-${i}`} className={`hover:bg-slate-50 ${first ? "border-t border-slate-200" : ""}`}>
                <Td className="font-semibold text-slate-900">{first ? item.competitionName : ""}</Td>
                <Td className="text-slate-600">{item.levelName || "-"}</Td>
                <Td right>{n(item.schoolCount)}</Td>
                <Td right>{n(item.studentCount)}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const SchoolTable = ({ data }: { data: DashboardReport }) => {
  if (data.schoolSummary.length === 0) return <Empty text="ยังไม่มีข้อมูลโรงเรียน" />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b border-blue-100 bg-blue-50/50">
          <tr>
            <Th>อันดับ</Th>
            <Th>โรงเรียน</Th>
            <Th>จังหวัด</Th>
            <Th right>ทีม</Th>
            <Th right>นักเรียน</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-800">
          {data.schoolSummary.map((s, i) => (
            <tr key={`${s.schoolName}-${i}`} className="hover:bg-slate-50">
              <Td className="w-16 tabular-nums text-slate-500">{i + 1}</Td>
              <Td className="font-medium text-slate-900">{s.schoolName}</Td>
              <Td className="text-slate-600">{s.province || "-"}</Td>
              <Td right className="font-semibold">{n(s.teamCount)}</Td>
              <Td right>{n(s.studentCount)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ===== Page =====
export default function ReportDashboard() {
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [tab, setTab] = useState<TabKey>("activity");
  const [exporting, setExporting] = useState(false);
  const { data: years = [] } = useGetAllYearQuery();
  const { data, isFetching, isLoading, error, refetch } = useGetDashboardReportQuery(selectedYearId ?? undefined);

  useEffect(() => {
    if (years.length === 0 || selectedYearId !== null) return;
    const latestYear = [...years].sort(
      (a, b) => (b.yearNumber ?? 0) - (a.yearNumber ?? 0) || (b.yearID ?? 0) - (a.yearID ?? 0),
    )[0];
    if (latestYear?.yearID) setSelectedYearId(latestYear.yearID);
  }, [years, selectedYearId]);

  const handleExport = async () => {
    if (!selectedYearId) return;
    setExporting(true);
    try {
      await handleDownloadCompetitionAttendanceReportPdf(selectedYearId);
    } finally {
      setExporting(false);
    }
  };

  const hasAnyData =
    !!data &&
    [data.totalSchools, data.totalTeams, data.totalStudents, data.totalCompetitions, data.totalProjects, data.totalCertificates].some(
      (v) => v > 0,
    );

  const statusTotal = data ? STATUS.reduce((sum, s) => sum + (data[s.key] ?? 0), 0) : 0;
  const rewardMax = data ? Math.max(1, ...data.rewardSummary.map((r) => r.teamCount)) : 1;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">รายงานภาพรวม</h1>
          <p className="mt-0.5 text-sm text-slate-500">งานสัปดาห์วิทยาศาสตร์ · ข้อมูลผู้สมัคร การเข้างาน และผลรางวัล</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isFetching && !isLoading && (
            <span className="flex items-center gap-1.5 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> กำลังอัปเดต
            </span>
          )}
          <label className="sr-only" htmlFor="report-year">ปีการแข่งขัน</label>
          <select
            id="report-year"
            value={selectedYearId ?? ""}
            onChange={(e) => setSelectedYearId(Number(e.target.value))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            {years.map((y) => (
              <option key={y.yearID} value={y.yearID}>
                ปี {y.yearNumber} {y.yearName ? `· ${y.yearName}` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleExport}
            disabled={!selectedYearId || isLoading || exporting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 cursor-pointer"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            ส่งออก PDF
          </button>
        </div>
      </div>

      {isLoading ? (
        <Card className="py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-slate-500">กำลังโหลดข้อมูลรายงาน...</p>
        </Card>
      ) : error ? (
        <Card className="py-16 text-center">
          <h2 className="text-lg font-semibold text-slate-800">โหลดข้อมูลรายงานไม่สำเร็จ</h2>
          <p className="mt-1 text-sm text-slate-500">ตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง</p>
          <button
            onClick={() => refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" /> โหลดใหม่
          </button>
        </Card>
      ) : !data || !hasAnyData ? (
        <Card className="py-16 text-center">
          <h2 className="text-lg font-semibold text-slate-800">ยังไม่มีข้อมูลสำหรับปีนี้</h2>
          <p className="mt-1 text-sm text-slate-500">ยังไม่มีทีม โรงเรียน หรือนักเรียนสมัครในปีการแข่งขันที่เลือก</p>
        </Card>
      ) : (
        <div className={`space-y-5 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          {/* KPI */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi tone="sky" icon={School} label="โรงเรียนที่สมัคร" value={data.totalSchools} />
            <Kpi tone="indigo" icon={Users} label="ทีมทั้งหมด" value={data.totalTeams} note={`นักเรียน ${n(data.totalStudents)} คน`} />
            <Kpi tone="emerald" icon={ShieldCheck} label="ผู้สมัครที่มีสิทธิ์" value={data.totalRegisteredStudents} note="ไม่นับทีมที่ถูกตัดสิทธิ์" />
            <Kpi
              tone="orange"
              icon={UserCheck}
              label="ผู้ลงทะเบียนเข้างาน"
              value={data.totalCheckedInStudents}
              note={
                <span>
                  <span className="font-semibold text-orange-600">{pct(data.totalCheckedInStudents, data.totalRegisteredStudents)}%</span> ของผู้สมัครที่มีสิทธิ์
                </span>
              }
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            {/* Team status */}
            <Card>
              <CardHeader icon={Users} iconClass="bg-emerald-100 text-emerald-600" title="สถานะทีม" desc={`ทีมลงทะเบียนทั้งหมด ${n(data.registeredTeams)} ทีม`} />
              <div className="px-5 py-5">
                {statusTotal > 0 && (
                  <div className="mb-5 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    {STATUS.map((s) =>
                      data[s.key] > 0 ? (
                        <div key={s.key} className={s.color} style={{ width: `${(data[s.key] / statusTotal) * 100}%` }} title={`${s.label} ${n(data[s.key])}`} />
                      ) : null,
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {STATUS.map((s) => (
                    <div key={s.key} className={`rounded-xl px-3 py-2.5 ${s.soft}`}>
                      <p className="flex items-center gap-2 text-sm text-slate-600">
                        <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{n(data[s.key])}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-sm">
                  {[
                    { icon: Swords, label: "รายการแข่งขัน", value: data.totalCompetitions, cls: "text-violet-500" },
                    { icon: FolderCheck, label: "โครงงานที่ส่ง", value: data.totalProjects, cls: "text-teal-500" },
                    { icon: FileBadge, label: "เกียรติบัตรที่ออก", value: data.totalCertificates, cls: "text-pink-500" },
                  ].map(({ icon: Icon, label, value, cls }) => (
                    <div key={label} className="flex items-center gap-2 text-slate-600">
                      <Icon className={`h-4 w-4 flex-shrink-0 ${cls}`} />
                      <span className="truncate">{label}</span>
                      <span className="ml-auto font-semibold tabular-nums text-slate-900">{n(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Rewards */}
            <Card>
              <CardHeader icon={Trophy} iconClass="bg-amber-100 text-amber-600" title="ผลรางวัล" desc="จำนวนทีมที่ได้รับแต่ละรางวัล" />
              {data.rewardSummary.length === 0 ? (
                <Empty text="ยังไม่มีการบันทึกผลรางวัล" />
              ) : (
                <ul className="space-y-3 px-5 py-5">
                  {data.rewardSummary.map((r, i) => (
                    <li key={r.rewardName}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 text-slate-700">
                          <Award className={`h-4 w-4 ${REWARD_COLORS[i % REWARD_COLORS.length].text}`} />
                          {r.rewardName}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900">{n(r.teamCount)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${REWARD_COLORS[i % REWARD_COLORS.length].bar}`} style={{ width: `${(r.teamCount / rewardMax) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Detail tables in tabs */}
          <Card>
            <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors cursor-pointer ${
                    tab === t.key ? "border-blue-600 bg-blue-50/60 text-blue-700" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tab === "activity" && <ActivityTable data={data} />}
            {tab === "level" && <LevelTable data={data} />}
            {tab === "competition" && <CompetitionTable data={data} />}
            {tab === "school" && <SchoolTable data={data} />}
          </Card>
        </div>
      )}
    </div>
  );
}
