import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Search,
  School,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Loading } from "../../../components";
import { handleDownloadWordCompetitionLevels } from "../../../Apis/Export";
import {
  useGetReportCompetitionLevelSummaryQuery,
  useGetReportStudentsByTeamQuery,
  useGetReportTeamsQuery,
} from "../PublicReportApi";

export default function PublicReportCompetitionLevelOverviewPage() {
  const { competitionLevelID } = useParams<{ competitionLevelID: string }>();
  const parsedCompetitionLevelID = Number(competitionLevelID);
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_BASE_URLS;
  const [search, setSearch] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useGetReportCompetitionLevelSummaryQuery(parsedCompetitionLevelID, {
    skip: !parsedCompetitionLevelID,
  });

  const {
    data: teamsResponse,
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useGetReportTeamsQuery(
    {
      competitionLevelID: parsedCompetitionLevelID,
      page: 1,
      pageSize: 100,
      search: search.trim() || undefined,
    },
    { skip: !parsedCompetitionLevelID },
  );

  const { data: students, isFetching: isStudentsFetching } =
    useGetReportStudentsByTeamQuery(selectedTeamId ?? 0, {
      skip: !selectedTeamId,
    });

  const selectedTeam = useMemo(
    () =>
      teamsResponse?.items.find((team) => team.teamID === selectedTeamId) ??
      null,
    [selectedTeamId, teamsResponse],
  );

  const handleDownloadCurrentLevel = async () => {
    if (!parsedCompetitionLevelID) {
      return;
    }

    await handleDownloadWordCompetitionLevels([parsedCompetitionLevelID]);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    if (summary?.competitionYearID) {
      navigate(
        `/reports/applicants/competition-years/${summary.competitionYearID}/levels`,
      );
      return;
    }

    navigate("/reports/applicants");
  };

  if (isSummaryLoading || isTeamsLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับไปเลือกระดับชั้น
          </button>

          <button
            type="button"
            onClick={handleDownloadCurrentLevel}
            disabled={!parsedCompetitionLevelID}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            <Download className="h-4 w-4" />
            ดาวน์โหลดรายชื่อระดับชั้นนี้
          </button>
        </div>

        {summaryError || teamsError ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-14 text-center text-rose-800">
            ไม่สามารถโหลดข้อมูลรายงานระดับชั้นนี้ได้
          </section>
        ) : null}

        {summary ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
            <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="flex items-center justify-between gap-4 py-3 md:pr-8">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    จำนวนโรงเรียนที่สมัคร
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-teal-600 sm:text-3xl">
                    {new Intl.NumberFormat("th-TH").format(summary.schoolCount)}
                    <span className="ml-1 text-sm font-normal text-slate-500">
                      โรงเรียน
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-3 md:pl-8">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    จำนวนนักเรียน
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-teal-600 sm:text-3xl">
                    {new Intl.NumberFormat("th-TH").format(
                      summary.studentCount,
                    )}
                    <span className="ml-1 text-sm font-normal text-slate-500">
                      คน
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  รายชื่อทีมที่สมัคร
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  ดูว่ามาจากโรงเรียนไหน และกดดูรายชื่อนักเรียนได้
                </p>
              </div>
              <label className="relative block w-full sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ค้นหาโรงเรียนหรือชื่อทีม"
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                />
              </label>
            </div>

            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:hidden">
              เลื่อนตารางซ้ายขวาเพื่อดูข้อมูลเพิ่มเติม
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full text-sm">
                <thead className="bg-slate-900 text-left text-slate-100">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold sm:px-6">โรงเรียน</th>
                    <th className="px-4 py-3.5 font-semibold sm:px-6">
                      โครงงาน
                    </th>
                    <th className="px-4 py-3.5 text-center font-semibold sm:px-6">
                      จำนวนคนสมัคร
                    </th>
                    <th className="px-4 py-3.5 text-center font-semibold sm:px-6">
                      ดูเด็ก
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(teamsResponse?.items ?? []).map((team, index) => (
                    <tr
                      key={team.teamID}
                      className={`border-b border-slate-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-sky-50 p-2 text-sky-700 ring-1 ring-sky-100">
                            <School className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {team.schoolName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {[team.district, team.province]
                                .filter(Boolean)
                                .join(", ") || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        {team.projectName ? (
                          <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-amber-50 p-2 text-amber-700 ring-1 ring-amber-100">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">
                                {team.projectName}
                              </p>
                              {team.projectPDFLink ? (
                                <a
                                  href={`${baseUrl}${team.projectPDFLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  เปิดโครงงาน
                                </a>
                              ) : (
                                <p className="mt-1 text-xs text-slate-500">
                                  ไม่มีไฟล์แนบ
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center sm:px-6">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                          <Users className="h-4 w-4" />
                          {team.studentCount}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center sm:px-6">
                        <button
                          onClick={() => setSelectedTeamId(team.teamID)}
                          className="w-full rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 sm:w-auto"
                        >
                          เปิดรายชื่อ
                        </button>
                      </td>
                    </tr>
                  ))}

                  {(teamsResponse?.items.length ?? 0) === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-12 text-center text-slate-500 sm:px-6"
                      >
                        ไม่พบทีมที่ตรงกับคำค้นหา
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                รายชื่อนักเรียน
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {selectedTeam
                  ? selectedTeam.schoolName
                  : "เลือกทีมจากตารางทางซ้าย"}
              </p>
            </div>

            {selectedTeamId === null ? (
              <div className="px-4 py-16 text-center text-sm text-slate-500 sm:px-6">
                ยังไม่ได้เลือกทีม
              </div>
            ) : isStudentsFetching ? (
              <div className="px-4 py-16 text-center text-sm text-slate-500 sm:px-6">
                กำลังโหลดรายชื่อนักเรียน...
              </div>
            ) : (
              <div className="space-y-3 px-4 py-4 sm:px-6 sm:py-5">
                {(students ?? []).map((student) => (
                  <article
                    key={student.studentID}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <p className="font-medium text-slate-900">
                      {[
                        student.titlePrefixLabel,
                        student.firstName,
                        student.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {student.isMainMember ? "สมาชิกหลัก" : "สมาชิกสำรอง"}
                    </p>
                  </article>
                ))}

                {(students?.length ?? 0) === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-500">
                    ไม่พบรายชื่อนักเรียนในทีมนี้
                  </div>
                ) : null}
              </div>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}
