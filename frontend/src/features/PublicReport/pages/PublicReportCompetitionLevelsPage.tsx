import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Download, Eye, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { handleDownloadWordCompetitionLevels } from "../../../Apis/Export";
import { Loading } from "../../../components";
import {
  useGetReportCompetitionLevelsQuery,
  useGetReportTeamsQuery,
  useGetReportStudentsByTeamQuery,
} from "../PublicReportApi";

export default function PublicReportCompetitionLevelsPage() {
  const { competitionYearID } = useParams<{ competitionYearID: string }>();
  const parsedCompetitionYearID = Number(competitionYearID);
  const navigate = useNavigate();
  const [selectedLevelIds, setSelectedLevelIds] = useState<number[]>([]);
  const [previewLevelId, setPreviewLevelId] = useState<number | null>(null);
  const [previewLevelName, setPreviewLevelName] = useState<string>("");

  const {
    data: levels,
    isLoading,
    error,
  } = useGetReportCompetitionLevelsQuery(parsedCompetitionYearID, {
    skip: !parsedCompetitionYearID,
  });

  const levelIds = useMemo(
    () =>
      (levels ?? [])
        .map((level) => level.competitionLevelID)
        .filter((id): id is number => typeof id === "number"),
    [levels],
  );

  const isAllSelected =
    levelIds.length > 0 &&
    levelIds.every((id) => selectedLevelIds.includes(id));

  const toggleLevelSelection = (competitionLevelId: number) => {
    setSelectedLevelIds((current) =>
      current.includes(competitionLevelId)
        ? current.filter((id) => id !== competitionLevelId)
        : [...current, competitionLevelId],
    );
  };

  const toggleSelectAll = () => {
    setSelectedLevelIds(isAllSelected ? [] : levelIds);
  };

  const handleExportSelected = async () => {
    if (selectedLevelIds.length === 0) {
      return;
    }

    await handleDownloadWordCompetitionLevels(selectedLevelIds);
  };

  const handleExportAll = async () => {
    if (levelIds.length === 0) {
      return;
    }

    setSelectedLevelIds(levelIds);
    await handleDownloadWordCompetitionLevels(levelIds);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/reports/applicants");
  };

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[30px] border border-slate-200 bg-white px-4 py-6 shadow-sm sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-teal-700"
              >
                <ArrowLeft className="h-4 w-4" />
                ย้อนกลับ
              </button>
              <h1 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">
                เลือกระดับชั้น
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                เลือกระดับชั้นเพื่อดูยอดโรงเรียน ทีม และนักเรียน
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handleExportSelected}
                disabled={selectedLevelIds.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                ดาวน์โหลดที่เลือก ({selectedLevelIds.length})
              </button>
              <button
                type="button"
                onClick={handleExportAll}
                disabled={levelIds.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                ดาวน์โหลดทั้งหมด
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-14 text-center text-rose-800">
            ไม่สามารถโหลดระดับชั้นได้
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
                  <th className="px-4 py-4 text-center font-semibold">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300"
                      title="เลือกทั้งหมด"
                    />
                  </th>
                  <th className="px-4 py-4 font-semibold sm:px-6">ระดับชั้น</th>
                  <th className="px-4 py-4 text-center font-semibold sm:px-6">
                    โรงเรียนที่สมัคร
                  </th>
                  <th className="px-4 py-4 text-center font-semibold sm:px-6">
                    จำนวนคนสมัคร
                  </th>

                  <th className="px-4 py-4 text-right font-semibold sm:px-6">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(levels ?? []).map((level) => (
                  <tr
                    key={level.competitionLevelID}
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-4 text-center sm:py-5">
                      <input
                        type="checkbox"
                        checked={selectedLevelIds.includes(
                          level.competitionLevelID,
                        )}
                        onChange={() =>
                          toggleLevelSelection(level.competitionLevelID)
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                          <Users className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-slate-900 text-base">
                          {level.levelName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center sm:px-6 sm:py-5">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/10">
                        {level.schoolCount ?? 0} โรงเรียน
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center sm:px-6 sm:py-5">
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-600/10">
                        {level.studentCount ?? 0} คน
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right sm:px-6 sm:py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewLevelId(level.competitionLevelID);
                            setPreviewLevelName(level.levelName);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                        >
                          <Eye className="h-4 w-4" />
                          ดูตัวอย่าง
                        </button>
                        <Link
                          to={`/reports/applicants/competition-level/${level.competitionLevelID}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                        >
                          ดูยอดผู้สมัคร
                          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {(levels?.length ?? 0) === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      ไม่พบข้อมูลระดับชั้น
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {previewLevelId !== null && (
        <LevelPreviewModal
          levelId={previewLevelId}
          levelName={previewLevelName}
          onClose={() => setPreviewLevelId(null)}
        />
      )}
    </div>
  );
}

interface LevelPreviewModalProps {
  levelId: number;
  levelName: string;
  onClose: () => void;
}

function LevelPreviewModal({
  levelId,
  levelName,
  onClose,
}: LevelPreviewModalProps) {
  const { data: teamsResponse, isLoading } = useGetReportTeamsQuery({
    competitionLevelID: levelId,
    page: 1,
    pageSize: 100,
  });

  const teams = teamsResponse?.items ?? [];
  const includeProjectColumn = useMemo(() => teams.some((t) => !!t.projectName), [teams]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              ตัวอย่างรายงาน Word: {levelName}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              แสดงผลจำลองตารางผู้สมัครที่จะปรากฏในไฟล์รายงาน Word (.docx)
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-50">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-4">
            <h4 className="text-center text-lg font-bold text-slate-900">
              รายชื่อผู้สมัครการแข่งขัน ระดับ{levelName}
            </h4>

            {isLoading ? (
              <div className="py-12 text-center text-slate-500 font-medium">
                กำลังจำลองโครงสร้างตารางข้อมูล...
              </div>
            ) : teams.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                ไม่พบข้อมูลสถิติผู้สมัครสำหรับระดับการศึกษานี้
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                      <th className="px-3 py-3 text-center w-14">ลำดับ</th>
                      <th className="px-4 py-3 border-l border-slate-200">โรงเรียน</th>
                      {includeProjectColumn && (
                        <th className="px-4 py-3 border-l border-slate-200">ชื่อโครงงาน</th>
                      )}
                      <th className="px-4 py-3 border-l border-slate-200">ผู้สมัครแข่งขัน</th>
                      <th className="px-4 py-3 border-l border-slate-200">ครูผู้ควบคุม</th>
                      <th className="px-3 py-3 border-l border-slate-200 text-center w-20">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {teams.map((team, idx) => (
                      <TeamPreviewRow
                        key={team.teamID}
                        team={team}
                        idx={idx}
                        includeProjectColumn={includeProjectColumn}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
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

function TeamPreviewRow({
  team,
  idx,
  includeProjectColumn,
}: {
  team: any;
  idx: number;
  includeProjectColumn: boolean;
}) {
  const { data: students = [], isLoading } = useGetReportStudentsByTeamQuery(team.teamID);

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-3 py-3 text-center text-slate-500 tabular-nums">{idx + 1}</td>
      <td className="px-4 py-3 text-slate-900 border-l border-slate-200 font-medium">
        {team.schoolName}
      </td>
      {includeProjectColumn && (
        <td className="px-4 py-3 text-slate-800 border-l border-slate-200 italic">
          {team.projectName || "—"}
        </td>
      )}
      <td className="px-4 py-3 text-slate-700 border-l border-slate-200">
        {isLoading ? (
          <span className="text-slate-400 text-xs">กำลังดึงข้อมูลสมาชิก...</span>
        ) : students.length === 0 ? (
          <span className="text-slate-400">—</span>
        ) : (
          <ol className="list-decimal list-inside space-y-0.5 text-xs sm:text-sm">
            {students.map((s: any) => (
              <li key={s.studentID}>
                {s.titlePrefixLabel || ""} {s.firstName} {s.lastName}
              </li>
            ))}
          </ol>
        )}
      </td>
      <td className="px-4 py-3 text-slate-700 border-l border-slate-200 text-xs sm:text-sm">
        {team.teacherName || "—"}
      </td>
      <td className="px-3 py-3 text-center text-slate-400 border-l border-slate-200">—</td>
    </tr>
  );
}
