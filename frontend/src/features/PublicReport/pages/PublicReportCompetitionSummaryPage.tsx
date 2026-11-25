import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, Download, Trophy, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { handleDownloadWordCompetitionYearsSummary } from "../../../Apis/Export";
import { Loading } from "../../../components";
import {
  useGetReportCompetitionYearsQuery,
  useGetReportYearsQuery,
  useLazyGetReportCompetitionLevelSummaryQuery,
  useLazyGetReportCompetitionLevelsQuery,
} from "../PublicReportApi";
import type { PublicReportCompetitionLevel } from "../type";

type LevelSummaryRow = PublicReportCompetitionLevel & {
  competitionName: string;
};

const thaiNumber = new Intl.NumberFormat("th-TH");

export default function PublicReportCompetitionSummaryPage() {
  const { yearId } = useParams<{ yearId: string }>();
  const parsedYearId = Number(yearId);
  const navigate = useNavigate();
  const [levelRows, setLevelRows] = useState<LevelSummaryRow[]>([]);
  const [isLevelsLoading, setIsLevelsLoading] = useState(false);
  const { data: years = [] } = useGetReportYearsQuery();
  const [fetchCompetitionLevels] = useLazyGetReportCompetitionLevelsQuery();
  const [fetchCompetitionLevelSummary] =
    useLazyGetReportCompetitionLevelSummaryQuery();
  const {
    data: competitionYears,
    isLoading,
    error,
  } = useGetReportCompetitionYearsQuery(parsedYearId, { skip: !parsedYearId });

  const year = years.find((item) => item.yearID === parsedYearId);
  const items = useMemo(() => competitionYears ?? [], [competitionYears]);
  const totals = useMemo(
    () => ({
      competitionCount: items.length,
      schoolCount: items.reduce(
        (sum, item) => sum + (item.schoolCount ?? 0),
        0,
      ),
      teamCount: levelRows.reduce(
        (sum, level) => sum + (level.teamCount ?? 0),
        0,
      ),
      studentCount: items.reduce(
        (sum, item) => sum + (item.studentCount ?? 0),
        0,
      ),
    }),
    [items, levelRows],
  );

  const levelsByCompetitionYearId = useMemo(
    () =>
      levelRows.reduce<Record<number, LevelSummaryRow[]>>((result, level) => {
        const rows = result[level.competitionYearID] ?? [];
        result[level.competitionYearID] = [...rows, level];
        return result;
      }, {}),
    [levelRows],
  );

  useEffect(() => {
    let isActive = true;

    const loadLevels = async () => {
      if (items.length === 0) {
        setLevelRows([]);
        return;
      }

      setIsLevelsLoading(true);

      try {
        const levelsByCompetition = await Promise.all(
          items.map(async (item) => {
            const levels = await fetchCompetitionLevels(
              item.competitionYearID,
              true,
            ).unwrap();

            return Promise.all(
              levels.map(async (level) => {
                try {
                  const summary = await fetchCompetitionLevelSummary(
                    level.competitionLevelID,
                    true,
                  ).unwrap();

                  return {
                    ...level,
                    schoolCount: summary.schoolCount,
                    teamCount: summary.teamCount,
                    studentCount: summary.studentCount,
                    competitionName: item.competitionName,
                  };
                } catch {
                  return {
                    ...level,
                    competitionName: item.competitionName,
                  };
                }
              }),
            );
          }),
        );

        if (isActive) {
          setLevelRows(levelsByCompetition.flat());
        }
      } catch {
        if (isActive) {
          setLevelRows([]);
        }
      } finally {
        if (isActive) {
          setIsLevelsLoading(false);
        }
      }
    };

    loadLevels();

    return () => {
      isActive = false;
    };
  }, [fetchCompetitionLevelSummary, fetchCompetitionLevels, items]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  const handleExportWordSummary = async () => {
    if (!parsedYearId || isLevelsLoading) {
      return;
    }

    await handleDownloadWordCompetitionYearsSummary(parsedYearId);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-base font-bold text-slate-600 transition-colors hover:text-indigo-600"
          >
            <ArrowLeft className="h-5 w-5" />
            ย้อนกลับหน้าก่อนหน้า
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-block rounded bg-indigo-100 px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-indigo-800 border border-indigo-300">
                รายงานข้อมูลสรุปผู้สมัครเข้าร่วมกิจกรรมการแข่งขัน
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                สรุปสถิติจำนวนผู้สมัครจำแนกตามประเภทกิจกรรม
              </h1>
              <p className="mt-2 text-base font-semibold text-slate-600">
                {year
                  ? `ปีการศึกษา ${year.yearName}`
                  : "รายงานสถิติจำนวนสถานศึกษาและนักเรียนที่สมัครเข้าร่วมในแต่ละประเภทกิจกรรม"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportWordSummary}
              disabled={!items.length || isLevelsLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-5 py-3 text-base font-bold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:border-slate-200 sm:w-auto"
            >
              <Download className="h-5 w-5" />
              {isLevelsLoading
                ? "กำลังจัดเตรียมข้อมูล..."
                : "ส่งออกข้อมูล Word"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-300 bg-rose-50 px-6 py-4 text-base font-bold text-rose-700">
            ระบบไม่สามารถดึงข้อมูลสรุปกิจกรรมได้ กรุณาทำรายการใหม่อีกครั้ง
          </div>
        ) : null}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="จำนวนกิจกรรมการแข่งขันทั้งหมด"
            value={totals.competitionCount}
            icon={<Trophy className="h-6 w-6" />}
            accent="indigo"
          />
          <SummaryCard
            label="จำนวนสถานศึกษาที่สมัครเข้าร่วม"
            value={totals.schoolCount}
            icon={<Building2 className="h-6 w-6" />}
            accent="emerald"
          />
          <SummaryCard
            label="จำนวนทีมที่สมัครเข้าร่วมทั้งหมด"
            value={totals.teamCount}
            icon={<Users className="h-6 w-6" />}
            accent="amber"
          />
          <SummaryCard
            label="จำนวนผู้สมัครเข้าร่วมทั้งหมด"
            value={totals.studentCount}
            icon={<Users className="h-6 w-6" />}
            accent="cyan"
          />
        </div>

        {/* Competition list */}
        <div className="space-y-6">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-350 bg-white px-6 py-16 text-center text-base font-bold text-slate-500">
              ไม่พบข้อมูลสถิติกิจกรรมการแข่งขันในระบบ
            </div>
          ) : (
            <>
              {/* Desktop view: Table (shown on sm and up) */}
              <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-700 bg-white shadow-md">
                <div className="overflow-x-auto">
                  <table className="min-w-[800px] w-full text-base border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-700 text-sm font-bold text-slate-700 uppercase tracking-wider">
                        <th className="px-4 py-3 text-center w-16">ลำดับ</th>
                        <th className="px-4 py-3 text-left border-l border-slate-300">
                          กิจกรรม
                        </th>
                        <th className="px-4 py-3 text-left border-l border-slate-300">
                          รายการ
                        </th>
                        <th className="px-3 py-3 text-right border-l border-slate-300">
                          โรงเรียน
                        </th>
                        <th className="px-3 py-3 text-right border-l border-slate-300">
                          ทีม
                        </th>
                        <th className="px-4 py-3 text-right border-l border-slate-300">
                          นักเรียน
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((item, index) => {
                        const levels =
                          levelsByCompetitionYearId[item.competitionYearID] ??
                          [];
                        const teamCount = levels.reduce(
                          (sum, level) => sum + (level.teamCount ?? 0),
                          0,
                        );

                        return (
                          <React.Fragment key={item.competitionYearID}>
                            {/* Competition Summary Row */}
                            <tr className="bg-slate-50/80 font-bold border-t border-slate-300">
                              <td className="px-4 py-3 text-center text-slate-900">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 border-l border-slate-200 text-slate-900">
                                {item.competitionName}
                              </td>
                              <td className="px-4 py-3 border-l border-slate-200 text-indigo-700">
                                สรุปยอดรวมทั้งหมด
                              </td>
                              <td className="px-3 py-3 text-right border-l border-slate-200 tabular-nums">
                                {thaiNumber.format(item.schoolCount ?? 0)}
                              </td>
                              <td className="px-3 py-3 text-right border-l border-slate-200 tabular-nums">
                                {thaiNumber.format(teamCount)}
                              </td>
                              <td className="px-4 py-3 text-right border-l border-slate-200 tabular-nums">
                                {thaiNumber.format(item.studentCount ?? 0)}
                              </td>
                            </tr>

                            {/* Levels breakdown rows */}
                            {levels.map((level) => (
                              <tr
                                key={level.competitionLevelID}
                                className="text-slate-700 hover:bg-slate-50/50 transition-colors"
                              >
                                <td className="px-4 py-3 text-center"></td>
                                <td className="px-4 py-3 border-l border-slate-200"></td>
                                <td className="px-4 py-3 border-l border-slate-200 pl-6 text-slate-800">
                                  {level.levelName}
                                </td>
                                <td className="px-3 py-3 text-right border-l border-slate-200 tabular-nums">
                                  {thaiNumber.format(level.schoolCount ?? 0)}
                                </td>
                                <td className="px-3 py-3 text-right border-l border-slate-200 tabular-nums">
                                  {thaiNumber.format(level.teamCount ?? 0)}
                                </td>
                                <td className="px-4 py-3 text-right border-l border-slate-200 tabular-nums">
                                  {thaiNumber.format(level.studentCount ?? 0)}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}

                      {/* Grand Total Row */}
                      <tr className="bg-indigo-50 font-black border-t-2 border-slate-700 text-slate-900">
                        <td className="px-4 py-3.5 text-center"></td>
                        <td
                          className="px-4 py-3.5 border-l border-slate-200 text-center uppercase tracking-wider"
                          colSpan={2}
                        >
                          สรุปยอดรวมทั้งหมด
                        </td>
                        <td className="px-3 py-3.5 text-right border-l border-slate-200 tabular-nums">
                          {thaiNumber.format(totals.schoolCount)}
                        </td>
                        <td className="px-3 py-3.5 text-right border-l border-slate-200 tabular-nums">
                          {thaiNumber.format(totals.teamCount)}
                        </td>
                        <td className="px-4 py-3.5 text-right border-l border-slate-200 tabular-nums">
                          {thaiNumber.format(totals.studentCount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile view: Cards (shown on mobile block, hidden on sm) */}
              <div className="block sm:hidden space-y-4">
                {items.map((item, index) => {
                  const levels =
                    levelsByCompetitionYearId[item.competitionYearID] ?? [];
                  const teamCount = levels.reduce(
                    (sum, level) => sum + (level.teamCount ?? 0),
                    0,
                  );

                  return (
                    <div
                      key={item.competitionYearID}
                      className="bg-white rounded-xl border border-slate-700 overflow-hidden shadow-sm"
                    >
                      {/* Header */}
                      <div className="bg-indigo-50 border-b border-slate-700 px-4 py-3 flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white border border-indigo-500">
                          {index + 1}
                        </span>
                        <h3 className="font-bold text-indigo-950 text-base">
                          {item.competitionName}
                        </h3>
                      </div>

                      {/* Totals */}
                      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <p className="text-slate-500 font-semibold">
                            โรงเรียน
                          </p>
                          <p className="text-emerald-700 font-extrabold text-sm mt-0.5">
                            {thaiNumber.format(item.schoolCount ?? 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-semibold">ทีม</p>
                          <p className="text-amber-700 font-extrabold text-sm mt-0.5">
                            {thaiNumber.format(teamCount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-semibold">
                            นักเรียน
                          </p>
                          <p className="text-indigo-700 font-extrabold text-sm mt-0.5">
                            {thaiNumber.format(item.studentCount ?? 0)}
                          </p>
                        </div>
                      </div>

                      {/* Levels list */}
                      <div className="divide-y divide-slate-200 bg-white">
                        {levels.map((level) => (
                          <div
                            key={level.competitionLevelID}
                            className="px-4 py-3 flex flex-col gap-2"
                          >
                            <span className="font-bold text-slate-800 text-xs">
                              {level.levelName}
                            </span>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="bg-emerald-50 text-emerald-800 rounded-lg py-1 px-1 border border-emerald-200">
                                <span className="block text-3xs font-semibold text-emerald-600 uppercase">
                                  โรงเรียน
                                </span>
                                <span className="text-xs font-bold tabular-nums">
                                  {thaiNumber.format(level.schoolCount ?? 0)}
                                </span>
                              </div>
                              <div className="bg-amber-50 text-amber-800 rounded-lg py-1 px-1 border border-amber-250">
                                <span className="block text-3xs font-semibold text-amber-600 uppercase">
                                  ทีม
                                </span>
                                <span className="text-xs font-bold tabular-nums">
                                  {thaiNumber.format(level.teamCount ?? 0)}
                                </span>
                              </div>
                              <div className="bg-indigo-50 text-indigo-800 rounded-lg py-1 px-1 border border-indigo-250">
                                <span className="block text-3xs font-semibold text-indigo-600 uppercase">
                                  นักเรียน
                                </span>
                                <span className="text-xs font-bold tabular-nums">
                                  {thaiNumber.format(level.studentCount ?? 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Grand Total Card for Mobile */}
                <div className="bg-indigo-50 rounded-xl border border-slate-700 p-4 space-y-3 font-bold shadow-sm">
                  <h3 className="text-center text-slate-900 border-b border-indigo-200 pb-2 text-sm">
                    สรุปยอดรวมทั้งหมด
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-slate-500 font-semibold">
                        โรงเรียนรวม
                      </p>
                      <p className="text-emerald-700 text-sm font-extrabold mt-0.5">
                        {thaiNumber.format(totals.schoolCount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-semibold">ทีมรวม</p>
                      <p className="text-amber-700 text-sm font-extrabold mt-0.5">
                        {thaiNumber.format(totals.teamCount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-semibold">
                        นักเรียนรวม
                      </p>
                      <p className="text-indigo-700 text-sm font-extrabold mt-0.5">
                        {thaiNumber.format(totals.studentCount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: "indigo" | "emerald" | "amber" | "cyan";
}) {
  const accentBorders = {
    indigo: "border-t-indigo-600",
    emerald: "border-t-emerald-600",
    amber: "border-t-amber-500",
    cyan: "border-t-cyan-500",
  };

  const iconColors = {
    indigo: "text-indigo-600 bg-indigo-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    cyan: "text-cyan-600 bg-cyan-50",
  };

  return (
    <div
      className={`rounded-xl border border-slate-700 border-t-4 ${accentBorders[accent]} bg-white p-4 sm:p-5 shadow transition-all hover:shadow-md hover:border-slate-800`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm font-bold text-slate-700 sm:text-base uppercase tracking-wider">
          {label}
        </p>
        <span className={`rounded-lg p-2 ${iconColors[accent]}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tabular-nums sm:text-4xl">
        {thaiNumber.format(value)}
      </p>
    </div>
  );
}
