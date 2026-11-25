import { useParams } from "react-router-dom";
import {
  useGetAllMatchQuery,
  useMatchResultMutation,
  useGenerateMatchesMutation,
  useNextRoundMatchesMutation,
  useCancelMatchMutation,
} from "../matchApi";
import type { Match } from "../type";
import { Loading } from "../../../components/Loading";
import { useEffect, useMemo, useRef, useState } from "react";
import { roundName } from "../utils/matchUtils";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../utils/confirmDelete";
import { useMatchSignalR } from "../utils/useMatchSignalR";
import { MatchDrawLogModal } from "../components/MatchDrawLogModal";
import { History } from "lucide-react";

export const MatchResultList = () => {
  const { competitionLevelID } = useParams();

  const {
    data: matches,
    isLoading,
    refetch,
  } = useGetAllMatchQuery(competitionLevelID ?? "", {
    refetchOnMountOrArgChange: true,
  });

  const [matchResult] = useMatchResultMutation();
  const [generateMatches] = useGenerateMatchesMutation();
  const [nextRoundMatches] = useNextRoundMatchesMutation();
  const [cancelMatch] = useCancelMatchMutation();

  useMatchSignalR(competitionLevelID ?? "", () => {
    refetch();
  });

  // ===== Utils =====
  const formatTeamName = (team?: {
    teamNumberInLevel?: number;
    school_name?: string;
    nameOrdinal?: number;
  }) => {
    if (!team) return "";
    const num =
      team.teamNumberInLevel != null ? `#${team.teamNumberInLevel} ` : "";
    const ord =
      team.nameOrdinal && team.nameOrdinal > 0 ? ` (${team.nameOrdinal})` : "";
    return `${num}${team.school_name ?? ""}${ord}`.trim();
  };

  // ===== Local states =====
  const [selectedRound, setSelectedRound] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedRound");
    return saved !== null ? parseInt(saved) : null;
  });

  const [selectedStatusGroup, setSelectedStatusGroup] = useState<
    "All" | "Upcoming" | "Completed" | null
  >(null);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const normalize = (text: string) =>
    (text ?? "").toString().toLowerCase().trim().replace(/\s+/g, "");

  const includesSearch = (value: string | number | undefined | null) => {
    const s = normalize(searchTerm);
    if (!s) return true;
    const v = normalize(String(value ?? ""));
    return v.includes(s);
  };

  const [sampleSize, setSampleSize] = useState<number | undefined>(undefined);

  const [orderMap, setOrderMap] = useState<Record<number, number>>({});
  const orderCounterRef = useRef(0);

  useEffect(() => {
    if (!matches) return;
    setOrderMap((prev) => {
      const next = { ...prev };
      for (const m of matches) {
        if (next[Number(m.id)] == null) {
          next[Number(m.id)] = orderCounterRef.current++;
        }
      }
      return next;
    });
  }, [matches]);

  const filteredMatchesBySearch =
    matches?.filter((match) => {
      const teamAName = match.teamA?.school_name || "";
      const teamBName = match.teamB?.school_name || "";

      const aNum = match.teamA?.teamNumberInLevel ?? "";
      const bNum = match.teamB?.teamNumberInLevel ?? "";

      const aOrd =
        match.teamA?.nameOrdinal && match.teamA.nameOrdinal > 0
          ? match.teamA.nameOrdinal
          : "";
      const bOrd =
        match.teamB?.nameOrdinal && match.teamB.nameOrdinal > 0
          ? match.teamB.nameOrdinal
          : "";

      const tokensToSearch = [
        teamAName,
        teamBName,
        String(aNum),
        `#${aNum}`,
        `(${aNum})`,
        String(bNum),
        `#${bNum}`,
        `(${bNum})`,
        String(aOrd),
        `#${aOrd}`,
        `(${aOrd})`,
        String(bOrd),
        `#${bOrd}`,
        `(${bOrd})`,
      ];

      return tokensToSearch.some((t) => includesSearch(t));
    }) || [];

  const rounds = useMemo(() => {
    const r = Array.from(new Set((matches ?? []).map((m) => m.round))).sort(
      (a, b) => a - b,
    );
    return r.length ? r : [1];
  }, [matches]);

  const currentRound = selectedRound ?? rounds[0];

  const statusFiltered = useMemo(() => {
    if (!selectedStatusGroup || selectedStatusGroup === "All")
      return filteredMatchesBySearch;
    if (selectedStatusGroup === "Completed")
      return filteredMatchesBySearch.filter((m) => m.status === "Completed");
    return filteredMatchesBySearch.filter((m) => m.status !== "Completed");
  }, [filteredMatchesBySearch, selectedStatusGroup]);

  const displayedMatches = useMemo(() => {
    const list = statusFiltered.filter((m) => m.round === currentRound);

    return list.slice().sort((a, b) => {
      const byRound = a.round - b.round;
      if (byRound !== 0) return byRound;
      const oa = orderMap[Number(a.id)] ?? 0;
      const ob = orderMap[Number(b.id)] ?? 0;
      return oa - ob;
    });
  }, [statusFiltered, currentRound, orderMap]);

  const submitWinner = async (match: Match, winnerTeamId: number | string) => {
    try {
      await matchResult({
        matchId: match.id,
        winnerId: Number(winnerTeamId),
        isEdit: match.status === "Completed",
      }).unwrap();
      await refetch();
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ??
        "ไม่สามารถบันทึกข้อมูลทีมได้ กรุณาลองใหม่";
      await showError(errorMessage);
    }
  };

  const handleGenerateMatches = async () => {
    const ok = await confirmDelete("คุณต้องการสร้างการแข่งขันหรือไม่?");
    if (!ok) return;

    try {
      await generateMatches({
        competitionLevelID: competitionLevelID ?? "",
        sampleSize: sampleSize && sampleSize > 0 ? sampleSize : undefined,
      }).unwrap();

      await refetch();
      setSelectedRound(1);
      localStorage.setItem("selectedRound", "1");
      showSuccessOk("สร้างการแข่งขันสำเร็จ! ทีมต่างๆ ถูกสุ่มเรียบร้อย");
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ?? "ไม่สามารถสร้างการแข่งขันได้";
      showError(errorMessage);
    }
  };

  const handleNextRoundMatches = async () => {
    const ok = await confirmDelete("คุณต้องการขึ้นรอบถัดไปหรือไม่?");
    if (!ok) return;

    try {
      await nextRoundMatches(competitionLevelID ?? "").unwrap();
      await refetch();

      const latestRound = Math.max(...(matches?.map((m) => m.round) ?? [1]));
      setSelectedRound(latestRound);
      localStorage.setItem("selectedRound", String(latestRound));

      showSuccessOk("ขึ้นรอบถัดไปสำเร็จ!");
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ?? "ไม่สามารถขึ้นรอบถัดไปได้";
      showError(errorMessage);
    }
  };

  const handleCancelRound = async (round: number) => {
    const ok = await confirmDelete(`คุณต้องการลบรอบที่ ${round} ใช่หรือไม่?`);
    if (!ok) return;

    try {
      await cancelMatch({
        competitionLevelID: competitionLevelID ?? "",
        roundNumber: String(round),
      }).unwrap();

      await refetch();
      setSelectedRound(1);
      localStorage.setItem("selectedRound", "1");
      showSuccessOk(`ลบรอบ ${round} สำเร็จ!`);
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ?? "ไม่สามารถลบรอบนี้ได้";
      showError(errorMessage);
    }
  };

  const teamsCountByRound = useMemo(() => {
    const map = new Map<number, Set<number>>();
    (matches ?? []).forEach((m) => {
      if (!map.has(m.round)) map.set(m.round, new Set<number>());
      const bucket = map.get(m.round)!;
      if (m.teamA?.teamID != null) bucket.add(Number(m.teamA.teamID));
      if (m.teamB?.teamID != null) bucket.add(Number(m.teamB.teamID));
    });

    const obj: Record<number, number> = {};
    for (const [round, set] of map.entries()) obj[round] = set.size;
    return obj;
  }, [matches]);

  const totalTeamsInCurrentRound = useMemo(
    () => (currentRound != null ? (teamsCountByRound[currentRound] ?? 0) : 0),
    [teamsCountByRound, currentRound],
  );

  if (isLoading) return <Loading />;

  const hasPending = matches?.some((m) => m.status === "Pending");

  const getMatchStatusClass = (status?: string) => {
    if (status === "Completed") {
      return "border-emerald-300 bg-emerald-50/40";
    }
    if (status === "Pending") {
      return "border-amber-300 bg-amber-50/40";
    }
    return "border-slate-300 bg-white";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-100 to-indigo-50/50 px-4 py-6 font-sarabun">
      <div className="mx-auto max-w-10xl rounded-xl border border-slate-300 bg-white/90 p-4 shadow-sm md:p-5">
        {/* Header + Global actions */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-slate-800">ผลการแข่งขัน</h1>
            <span className="text-sm text-slate-600">
              {roundName(currentRound)} • ทั้งหมด{" "}
              <b>{totalTeamsInCurrentRound}</b> ทีม
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={2}
              className="w-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder="จำนวนทีม"
              value={sampleSize ?? ""}
              onChange={(e) =>
                setSampleSize(
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              title="กำหนดจำนวนทีมที่จะสุ่มสร้างรอบแรก (เว้นว่างหากต้องการใช้ทั้งหมด)"
            />

            <button
              className="rounded-md border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              onClick={handleGenerateMatches}
            >
              สร้างการแข่งขัน
            </button>

            <button
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                hasPending
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
              onClick={handleNextRoundMatches}
              disabled={hasPending}
              title={hasPending ? "มีแมตช์สถานะ Pending อยู่" : ""}
            >
              สุ่มรอบถัดไป
            </button>

            <button
              className="rounded-md border border-purple-600 bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 flex items-center gap-1.5"
              onClick={() => setIsLogModalOpen(true)}
            >
              <History className="w-4 h-4" />
              <span>ประวัติการสุ่ม</span>
            </button>

            {currentRound >= 2 && (
              <button
                className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
                onClick={() => handleCancelRound(currentRound)}
              >
                ยกเลิกรอบ {roundName(currentRound)}
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {rounds.map((round) => (
              <button
                key={round}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  currentRound === round
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => {
                  setSelectedRound(round);
                  localStorage.setItem("selectedRound", round.toString());
                }}
              >
                {roundName(round)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="ค้นหา: ชื่อทีม / #เลขทีม / (เลข)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm sm:w-64"
            />

            <div className="flex gap-2">
              {(["All", "Upcoming", "Completed"] as const).map((status) => (
                <button
                  key={status}
                  className={`rounded-md border px-3 py-1.5 text-sm ${(() => {
                    const active =
                      selectedStatusGroup === status ||
                      (status === "All" && selectedStatusGroup === null);
                    if (status === "Completed") {
                      return active
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
                    }
                    if (status === "Upcoming") {
                      return active
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100";
                    }
                    return active
                      ? "border-slate-700 bg-slate-700 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";
                  })()}`}
                  onClick={() =>
                    setSelectedStatusGroup(status === "All" ? null : status)
                  }
                >
                  {status === "All"
                    ? "ทั้งหมด"
                    : status === "Upcoming"
                      ? "กำลังแข่งขัน"
                      : "แข่งเสร็จแล้ว"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Match list */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {displayedMatches.map((match) => {
            const isWinnerA = match.winner?.teamID === match.teamA.teamID;
            const isWinnerB =
              match.teamB && match.winner?.teamID === match.teamB.teamID;

            const baseBtn =
              "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors";
            const winnerBtn = "border-slate-800 bg-slate-800 text-white";
            const normalBtn =
              "border-slate-300 bg-white text-slate-800 hover:bg-slate-100";

            return (
              <div
                key={match.id}
                className={`rounded-lg border p-3 ${getMatchStatusClass(match.status)}`}
              >
                <p className="mb-2 text-xs text-slate-600">
                  {roundName(match.round)} •{" "}
                  {match.status === "Completed"
                    ? `ผู้ชนะ: ${
                        formatTeamName(match.winner as any) || "ไม่ระบุ"
                      }`
                    : "ยังไม่มีผล"}
                </p>

                <div className="flex gap-2">
                  <button
                    className={`${baseBtn} ${
                      isWinnerA ? winnerBtn : normalBtn
                    }`}
                    onClick={() =>
                      submitWinner(match, match.teamA.teamID as number | string)
                    }
                  >
                    {formatTeamName(match.teamA as any)}
                  </button>

                  <button
                    className={`${baseBtn} ${
                      isWinnerB ? winnerBtn : normalBtn
                    } ${!match.teamB ? "opacity-50 pointer-events-none" : ""}`}
                    onClick={() =>
                      match.teamB &&
                      submitWinner(match, match.teamB.teamID as number | string)
                    }
                  >
                    {match.teamB
                      ? formatTeamName(match.teamB as any)
                      : "ไม่ระบุทีม B"}
                  </button>
                </div>
              </div>
            );
          })}

          {displayedMatches.length === 0 && (
            <div className="col-span-full rounded-lg border border-slate-300 bg-white px-4 py-10 text-center text-slate-600">
              ไม่พบข้อมูลการแข่งขันในเงื่อนไขที่เลือก
            </div>
          )}
        </div>
      </div>

      {/* Match Draw Log Modal */}
      <MatchDrawLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        competitionLevelID={competitionLevelID ?? ""}
        onRollbackSuccess={() => refetch()}
      />
    </div>
  );
};