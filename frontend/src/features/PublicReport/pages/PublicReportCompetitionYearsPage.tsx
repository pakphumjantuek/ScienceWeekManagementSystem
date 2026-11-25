import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ChevronRight, Download, Eye, Trophy } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  handleDownloadPdfCompetitionYearsSummary,
  handleDownloadWordCompetitionYearsSummary,
} from "../../../Apis/Export";
import { Loading } from "../../../components";
import {
  useGetReportCompetitionYearsQuery,
  useGetReportYearsQuery,
  useGetReportCompetitionLevelsQuery,
  useLazyGetReportCompetitionLevelsQuery,
  useLazyGetReportCompetitionLevelSummaryQuery,
} from "../PublicReportApi";

const thaiNumber = new Intl.NumberFormat("th-TH");

export default function PublicReportCompetitionYearsPage() {
  const { yearId } = useParams<{ yearId: string }>();
  const parsedYearId = Number(yearId);
  const navigate = useNavigate();
  const { data: years = [] } = useGetReportYearsQuery();
  const {
    data: competitionYears,
    isLoading,
    error,
  } = useGetReportCompetitionYearsQuery(parsedYearId, { skip: !parsedYearId });

  const [previewCompId, setPreviewCompId] = useState<number | null>(null);
  const [previewCompName, setPreviewCompName] = useState<string>("");
  const [previewYearSummaryOpen, setPreviewYearSummaryOpen] = useState(false);

  const year = years.find((item) => item.yearID === parsedYearId);
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/reports/applicants");
  };

  const handleExportCompetitionSummary = async () => {
    if (!parsedYearId) {
      return;
    }

    await handleDownloadWordCompetitionYearsSummary(parsedYearId);
  };

  const handleExportCompetitionSummaryPdf = async () => {
    if (!parsedYearId) {
      return;
    }

    await handleDownloadPdfCompetitionYearsSummary(parsedYearId);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[30px] border border-slate-200 bg-white px-4 py-6 shadow-sm sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-sky-700"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับไปเลือกปี
              </button>
              <h1 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">
                เลือกกิจกรรม
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {year
                  ? `${year.yearName} (${year.yearNumber})`
                  : "กำลังแสดงกิจกรรมตามปีที่เลือก"}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => setPreviewYearSummaryOpen(true)}
                disabled={!parsedYearId}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                <Eye className="h-4 w-4" />
                ดูตัวอย่างรายงานรวม
              </button>
              <button
                type="button"
                onClick={handleExportCompetitionSummaryPdf}
                disabled={!parsedYearId}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>
              <button
                type="button"
                onClick={handleExportCompetitionSummary}
                disabled={!parsedYearId}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Export Word
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-14 text-center text-rose-800">
            ไม่สามารถโหลดรายการกิจกรรมได้
          </section>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:hidden">
            เลื่อนตารางซ้ายขวาเพื่อดูข้อมูลเพิ่มเติม
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-900 text-slate-100">
                <tr>
                  <th className="px-4 py-4 font-semibold sm:px-6">
                    ชื่อกิจกรรม
                  </th>
                  <th className="px-4 py-4 text-center font-semibold sm:px-6">
                    โรงเรียน
                  </th>
                  <th className="px-4 py-4 text-center font-semibold sm:px-6">
                    จำนวนนักเรียน
                  </th>
                  <th className="px-4 py-4 text-right font-semibold sm:px-6">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(competitionYears ?? []).map((item) => (
                  <tr
                    key={item.competitionYearID}
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-4 sm:px-6 sm:py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                          <Trophy className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-slate-900 text-base">
                          {item.competitionName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center sm:px-6 sm:py-5">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/10">
                        {item.schoolCount ?? 0} โรงเรียน
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center sm:px-6 sm:py-5">
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-600/10">
                        {item.studentCount ?? 0} คน
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right sm:px-6 sm:py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewCompId(item.competitionYearID);
                            setPreviewCompName(item.competitionName);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-355 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                        >
                          <Eye className="h-4 w-4" />
                          ดูตัวอย่าง
                        </button>
                        <Link
                          to={`/reports/applicants/competition-years/${item.competitionYearID}/levels`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                        >
                          ดูระดับชั้น
                          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {previewCompId !== null && (
        <CompetitionPreviewModal
          competitionYearID={previewCompId}
          competitionName={previewCompName}
          onClose={() => setPreviewCompId(null)}
        />
      )}

      {previewYearSummaryOpen && (
        <YearSummaryPreviewModal
          yearId={parsedYearId}
          yearName={year?.yearName}
          onClose={() => setPreviewYearSummaryOpen(false)}
        />
      )}
    </div>
  );
}

interface CompetitionPreviewModalProps {
  competitionYearID: number;
  competitionName: string;
  onClose: () => void;
}

function CompetitionPreviewModal({
  competitionYearID,
  competitionName,
  onClose,
}: CompetitionPreviewModalProps) {
  const { data: levels = [], isLoading } = useGetReportCompetitionLevelsQuery(competitionYearID);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">ตัวอย่างข้อมูล: {competitionName}</h3>
            <p className="text-sm text-slate-500 mt-0.5">สรุปจำนวนโรงเรียนและผู้สมัครจำแนกตามระดับชั้น</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <span className="sr-only">ปิด</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-slate-50">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 font-medium">กำลังดึงข้อมูลระดับชั้น...</div>
          ) : levels.length === 0 ? (
            <div className="py-12 text-center text-slate-400">ไม่พบระดับชั้นในการแข่งขันนี้</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="px-4 py-3">ระดับชั้น</th>
                    <th className="px-4 py-3 text-center">โรงเรียนที่สมัคร</th>
                    <th className="px-4 py-3 text-center">จำนวนคนสมัคร</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {levels.map((level) => (
                    <tr key={level.competitionLevelID} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{level.levelName}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{level.schoolCount ?? 0} โรงเรียน</td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-900">{level.studentCount ?? 0} คน</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition shadow-sm"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

interface YearSummaryPreviewModalProps {
  yearId: number;
  yearName?: string;
  onClose: () => void;
}

function YearSummaryPreviewModal({
  yearId,
  yearName,
  onClose,
}: YearSummaryPreviewModalProps) {
  const { data: competitionYears = [], isLoading: isCompLoading } =
    useGetReportCompetitionYearsQuery(yearId);

  const [fetchCompetitionLevels] = useLazyGetReportCompetitionLevelsQuery();
  const [fetchCompetitionLevelSummary] = useLazyGetReportCompetitionLevelSummaryQuery();

  const [levelRows, setLevelRows] = useState<any[]>([]);
  const [isLevelsLoading, setIsLevelsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadLevels = async () => {
      if (competitionYears.length === 0) {
        setLevelRows([]);
        return;
      }

      setIsLevelsLoading(true);

      try {
        const levelsByCompetition = await Promise.all(
          competitionYears.map(async (item) => {
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
  }, [competitionYears, fetchCompetitionLevels, fetchCompetitionLevelSummary]);

  const totals = useMemo(
    () => ({
      schoolCount: competitionYears.reduce(
        (sum, item) => sum + (item.schoolCount ?? 0),
        0,
      ),
      teamCount: levelRows.reduce(
        (sum, level) => sum + (level.teamCount ?? 0),
        0,
      ),
      studentCount: competitionYears.reduce(
        (sum, item) => sum + (item.studentCount ?? 0),
        0,
      ),
    }),
    [competitionYears, levelRows],
  );

  const levelsByCompetitionYearId = useMemo(
    () =>
      levelRows.reduce<Record<number, any[]>>((result, level) => {
        const rows = result[level.competitionYearID] ?? [];
        result[level.competitionYearID] = [...rows, level];
        return result;
      }, {}),
    [levelRows],
  );

  const isLoadingTotal = isCompLoading || isLevelsLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              ตัวอย่างรายงานสรุปรวมทั้งหมด: {yearName || ""}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              แสดงผลจำลองตารางที่จะปรากฏในรายงานสรุปการแข่งขันประจำปี
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <span className="sr-only">ปิด</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-4xl mx-auto">
            <h4 className="text-center text-lg font-bold text-slate-900">
              รายงานสรุปผู้สมัครรายกิจกรรม {yearName || ""}
            </h4>

            {isLoadingTotal ? (
              <div className="py-12 text-center text-slate-500 font-medium">
                กำลังรวบรวมข้อมูลรายงานสรุป...
              </div>
            ) : competitionYears.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                ไม่พบข้อมูลสถิติกิจกรรมการแข่งขันในปีการศึกษานี้
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-center w-16">ลำดับ</th>
                      <th className="px-4 py-3 border-l border-slate-200">กิจกรรม</th>
                      <th className="px-4 py-3 border-l border-slate-200">รายการ</th>
                      <th className="px-3 py-3 border-l border-slate-200 text-right">โรงเรียน</th>
                      <th className="px-3 py-3 border-l border-slate-200 text-right">ทีม</th>
                      <th className="px-4 py-3 border-l border-slate-200 text-right">นักเรียน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {competitionYears.map((item, index) => {
                      const levels = levelsByCompetitionYearId[item.competitionYearID] ?? [];
                      const teamCount = levels.reduce(
                        (sum, level) => sum + (level.teamCount ?? 0),
                        0,
                      );

                      return (
                        <React.Fragment key={item.competitionYearID}>
                          <tr className="bg-slate-50/80 font-bold border-t border-slate-200 text-slate-900">
                            <td className="px-4 py-3 text-center">{index + 1}</td>
                            <td className="px-4 py-3 border-l border-slate-200">{item.competitionName}</td>
                            <td className="px-4 py-3 border-l border-slate-200 text-indigo-700">สรุปยอดรวมทั้งหมด</td>
                            <td className="px-3 py-3 text-right border-l border-slate-200 tabular-nums">{thaiNumber.format(item.schoolCount ?? 0)}</td>
                            <td className="px-3 py-3 text-right border-l border-slate-200 tabular-nums">{thaiNumber.format(teamCount)}</td>
                            <td className="px-4 py-3 text-right border-l border-slate-200 tabular-nums">{thaiNumber.format(item.studentCount ?? 0)}</td>
                          </tr>

                          {levels.map((level) => (
                            <tr key={level.competitionLevelID} className="text-slate-700 hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-center"></td>
                              <td className="px-4 py-3 border-l border-slate-200"></td>
                              <td className="px-4 py-3 border-l border-slate-200 pl-6 text-slate-800">{level.levelName}</td>
                              <td className="px-3 py-3 text-right border-l border-slate-200 tabular-nums">{thaiNumber.format(level.schoolCount ?? 0)}</td>
                              <td className="px-3 py-3 text-right border-l border-slate-200 tabular-nums">{thaiNumber.format(level.teamCount ?? 0)}</td>
                              <td className="px-4 py-3 text-right border-l border-slate-200 tabular-nums">{thaiNumber.format(level.studentCount ?? 0)}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}

                    {/* Grand Total Row */}
                    <tr className="bg-indigo-50 font-black border-t-2 border-slate-700 text-slate-900">
                      <td className="px-4 py-3.5 text-center"></td>
                      <td className="px-4 py-3.5 border-l border-slate-200 text-center uppercase tracking-wider" colSpan={2}>
                        ผลรวมทั้งหมด
                      </td>
                      <td className="px-3 py-3.5 text-right border-l border-slate-200 tabular-nums">{thaiNumber.format(totals.schoolCount)}</td>
                      <td className="px-3 py-3.5 text-right border-l border-slate-200 tabular-nums">{thaiNumber.format(totals.teamCount)}</td>
                      <td className="px-4 py-3.5 text-right border-l border-slate-200 tabular-nums">{thaiNumber.format(totals.studentCount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition shadow-sm"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
