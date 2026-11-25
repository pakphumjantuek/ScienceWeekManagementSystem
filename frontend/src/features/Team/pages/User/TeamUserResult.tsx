import { Loading } from "../../../../components/Loading";
import { useGetAllTeamStatusQuery } from "../../TeamApi";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Download, Search, ArrowLeft, Medal, ChevronRight, X, Trophy } from "lucide-react";
import { handleDownloadCertificate, handleDownloadCertificateStudent } from "../../../../Apis/Export";
import { useFilteredData } from "../../../../components";
import { badgeClass } from "../../../../utils";
import { useGetCompetitionLevelByIdQuery } from "../../../CompetitionLevel/CompetitionLevelApi";
import { API_BASE_URL } from "../../../../config";
import { useEffect, useMemo, useState } from "react";

import { useGetAllRewardTypeQuery } from "../../../RewardType/RewardTypeApi";

const STEPS = ["เลือกปี", "เลือกกิจกรรม", "เลือกระดับชั้น", "ดูผลการแข่งขัน"];

function StepsBar({ current = 4 }: { current?: 1 | 2 | 3 | 4 }) {
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

const getRewardRank = (item: any) => {
  // Standard reward IDs are ordered from champion (1) to participation (5).
  const rewardTypeID = Number(item.rewardTypeID);
  if (Number.isFinite(rewardTypeID) && rewardTypeID >= 1 && rewardTypeID <= 5) {
    return rewardTypeID;
  }

  // Keep a safe fallback for legacy records that only contain a reward name.
  const rewardName = String(item.rewardTypeName ?? item.rewardType ?? "").toLowerCase();
  if (rewardName.includes("รองชนะเลิศอันดับ1") || rewardName.includes("รองชนะเลิศอันดับ 1")) return 2;
  if (rewardName.includes("รองชนะเลิศอันดับ2") || rewardName.includes("รองชนะเลิศอันดับ 2")) return 3;
  if (rewardName.includes("ชนะเลิศ")) return 1;
  if (rewardName.includes("ชมเชย")) return 4;
  return 5;
};

// สไตล์การ์ดผู้ชนะ 3 อันดับแรก
const PODIUM_STYLE: Record<number, { card: string; medal: string; label: string }> = {
  1: { card: "border-amber-300 bg-amber-50", medal: "text-amber-500", label: "text-amber-800" },
  2: { card: "border-slate-300 bg-slate-50", medal: "text-slate-400", label: "text-slate-700" },
  3: { card: "border-orange-300 bg-orange-50", medal: "text-orange-500", label: "text-orange-800" },
};

const TeamUserResult = () => {
  const { competitionLevelID } = useParams<{ competitionLevelID: string }>();
  const location = useLocation();
  const state = (location.state as { levelName?: string; competitionName?: string }) || {};
  const navigate = useNavigate();

  const { data, isLoading } = useGetAllTeamStatusQuery(Number(competitionLevelID));
  const { data: level } = useGetCompetitionLevelByIdQuery(Number(competitionLevelID));
  const { data: rewards = [] } = useGetAllRewardTypeQuery();
  const [individuals, setIndividuals] = useState<any[]>([]);

  const levelName = level?.levelName ?? state.levelName;
  const competitionName = state.competitionName;

  // The individual check-in endpoint is restricted to signed-in users. The
  // public status response contains checked-in members too; when using it as
  // a fallback, preserve each member's own award only. A team award must not
  // be copied to every member of that team.
  const publicIndividualResults = useMemo(
    () =>
      (data?.checkedInTeams ?? []).flatMap((team: any) =>
        (team.students ?? []).map((student: any) => ({
          ...student,
          teamID: student.teamID ?? team.teamID,
          teamName: team.teamName,
          schoolName: student.schoolName ?? team.schoolName ?? team.school_name,
          school_name: student.schoolName ?? team.schoolName ?? team.school_name,
          rewardTypeID: student.rewardTypeID ?? null,
          rewardTypeName: student.rewardTypeName ?? null,
        })),
      ),
    [data?.checkedInTeams],
  );

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Anonymous visitors must not call this protected endpoint: its 401
    // challenge makes the browser display a credential prompt. They use the
    // public status data below instead.
    if (level?.registrationMode === "individual" && token) {
      fetch(`${API_BASE_URL}/individual-checkin/competition-level/${competitionLevelID}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((x) => {
          const list = x.result ?? [];
          // กรองเฉพาะผู้สมัครที่เช็คอินเข้างานแล้ว
          setIndividuals(
            list.filter(
              (item: any) =>
                item.isCheckedIn === true ||
                item.isCheckedIn === 1 ||
                item.teamStatus === 3 ||
                item.teamStatus === "CheckedIn",
            ),
          );
        });
    }
  }, [level?.registrationMode, competitionLevelID]);

  const getRewardDisplayName = (item: any) => {
    if (item.rewardTypeName) return item.rewardTypeName;
    if (item.rewardType) return item.rewardType;
    if (item.rewardTypeID) {
      const found = rewards.find((r: any) => r.rewardTypeID === item.rewardTypeID);
      if (found) return found.rewardTypeName;
    }
    return "เข้าร่วมการแข่งขัน";
  };

  const allResults =
    level?.registrationMode === "individual"
      ? individuals.length > 0
        ? individuals
        : publicIndividualResults
      : data?.checkedInTeams ?? [];

  const { searchTerm, setSearchTerm, filteredData } = useFilteredData(allResults, [
    "teamName",
    "school_name",
    "firstName",
    "lastName",
    "schoolName",
  ]);

  const displayedResults = useMemo(
    () => [...filteredData].sort((left, right) => getRewardRank(left) - getRewardRank(right)),
    [filteredData],
  );

  if (isLoading) return <Loading />;

  const isIndividual = level?.registrationMode === "individual";
  const unit = isIndividual ? "คน" : "ทีม";
  const searching = searchTerm.trim() !== "";

  // ผู้ชนะ 3 อันดับแรกแยกไปแสดงเป็นการ์ดด้านบน (ซ่อนตอนค้นหา ให้ผลค้นหาอยู่ในตารางเดียว)
  const podium = searching ? [] : displayedResults.filter((r) => getRewardRank(r) <= 3);
  const rest = searching ? displayedResults : displayedResults.filter((r) => getRewardRank(r) > 3);

  const displayName = (team: any) =>
    team.firstName || team.lastName
      ? `${team.firstName ?? ""} ${team.lastName ?? ""}`.trim()
      : team.teamName || "-";
  const schoolOf = (team: any) => team.schoolName ?? team.school_name ?? team.teamName ?? "-";
  const rowKey = (team: any, idx: number) => (isIndividual ? team.studentID : team.teamID) ?? idx;
  const download = (team: any) =>
    team.studentID
      ? handleDownloadCertificateStudent(team.teamID ?? team.teamId ?? 0, team.studentID)
      : handleDownloadCertificate(team.teamID ?? team.teamId ?? 0);

  // เปิดลิงก์ตรง/รีเฟรช ไม่มีหน้าก่อนในเว็บ → กลับไปหน้าเลือกปี แทนการออกจากเว็บ
  const goBack = () => (location.key !== "default" ? navigate(-1) : navigate("/yearresults"));

  const DownloadButton = ({ team, full }: { team: any; full?: boolean }) => (
    <button
      onClick={() => download(team)}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap ${
        full ? "w-full" : ""
      }`}
      title="ดาวน์โหลดเกียรติบัตร"
    >
      <Download className="w-4 h-4" />
      เกียรติบัตร
    </button>
  );

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
        <div className="relative max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 py-5 sm:py-7 md:py-10 text-center">
          <button
            onClick={goBack}
            className="mb-4 md:mb-0 md:absolute md:left-10 md:top-8 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            ย้อนกลับ
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-snug">
            ประกาศผลการแข่งขัน
          </h1>
          {(competitionName || levelName) && (
            <p className="mt-2 text-lg md:text-xl font-semibold text-blue-700">
              {competitionName}
              {competitionName && levelName && " · "}
              {levelName && `ระดับ ${levelName}`}
            </p>
          )}
          <StepsBar current={4} />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 mt-5 sm:mt-6 space-y-6">
        {allResults.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 md:p-12 text-center">
            <Trophy className="w-10 h-10 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl md:text-2xl font-bold mb-2">ยังไม่มีผลการแข่งขัน</h3>
            <p className="text-slate-500 text-base md:text-lg">
              ผลจะแสดงที่นี่หลังเจ้าหน้าที่ประกาศผลแล้ว
            </p>
          </div>
        ) : (
          <>
            {/* ===== Podium ===== */}
            {podium.length > 0 && (
              <section aria-label="ผู้ได้รับรางวัล" className="grid gap-3 md:grid-cols-3">
                {podium.map((team, idx) => {
                  const rank = getRewardRank(team);
                  const s = PODIUM_STYLE[rank];
                  return (
                    <article
                      key={rowKey(team, idx)}
                      className={`rounded-2xl border-2 p-4 sm:p-5 flex flex-col gap-3 ${s.card}`}
                    >
                      <div className="flex items-center gap-3">
                        <Medal className={`w-9 h-9 shrink-0 ${s.medal}`} />
                        <span className={`text-base sm:text-lg font-extrabold ${s.label}`}>
                          {getRewardDisplayName(team)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg sm:text-xl font-bold leading-snug break-words">
                          {schoolOf(team)}
                        </p>
                        {isIndividual && (
                          <p className="mt-0.5 text-base text-slate-600 break-words">{displayName(team)}</p>
                        )}
                      </div>
                      <DownloadButton team={team} full />
                    </article>
                  );
                })}
              </section>
            )}

            {/* ===== Everyone else ===== */}
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h2 className="text-lg sm:text-xl font-bold sm:mr-auto">
                  {searching ? "ผลการค้นหา" : podium.length > 0 ? "ผู้ได้รับรางวัลอื่นและผู้เข้าร่วม" : "ผลการแข่งขัน"}
                  <span className="ml-2 text-base font-semibold text-slate-500">
                    ({searching ? displayedResults.length : allResults.length} {unit})
                  </span>
                </h2>
                <label className="relative w-full sm:w-96">
                  <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder={isIndividual ? "ค้นหาชื่อ-นามสกุล หรือโรงเรียน" : "ค้นหาชื่อโรงเรียน"}
                    aria-label="ค้นหาผลการแข่งขัน"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-10 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      aria-label="ล้างคำค้นหา"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </label>
              </div>

              {rest.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center text-base sm:text-lg text-slate-500">
                  {searching ? `ไม่พบผลที่ตรงกับ "${searchTerm}"` : "ไม่มีรายชื่ออื่นเพิ่มเติม"}
                </div>
              ) : (
                <ul className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                  {rest.map((team: any, idx: number) => {
                    const reward = getRewardDisplayName(team);
                    return (
                      <li
                        key={rowKey(team, idx)}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className={`text-base sm:text-lg break-words ${isIndividual ? "font-semibold" : "font-bold"}`}>
                            {isIndividual ? displayName(team) : schoolOf(team)}
                          </p>
                          {isIndividual && (
                            <p className="text-sm sm:text-base text-slate-500 break-words">{schoolOf(team)}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${badgeClass(reward)}`}>
                            {reward}
                          </span>
                          <DownloadButton team={team} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default TeamUserResult;
