import { useGetAllMatchQuery } from "../matchApi";
import { useParams } from "react-router-dom";
import { filteredMatches, roundName, uniqueRounds } from "../utils/matchUtils";
import { Loading } from "../../../components/Loading";
import { useState, useMemo } from "react";
import { useMatchSignalR } from "../utils/useMatchSignalR";
import { motion, AnimatePresence } from "framer-motion";
import { MatchSlotModal } from "../components/MatchSlotModal";
import { MatchDrawLogModal } from "../components/MatchDrawLogModal";
import { Tv, Sparkles, Play, Trophy, History } from "lucide-react";

export const MatchUserList = () => {
  const { competitionLevelID } = useParams();

  const {
    data: matches,
    isLoading,
    refetch,
  } = useGetAllMatchQuery(competitionLevelID ?? "", {
    refetchOnMountOrArgChange: true,
  });

  useMatchSignalR(competitionLevelID ?? "", () => {
    refetch();
  });

  const [selectedRound, setSelectedRound] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedRound");
    return saved !== null ? parseInt(saved) : null;
  });

  const [selectedStatusGroup, setSelectedStatusGroup] = useState<string | null>(
    null,
  );

  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const rounds = useMemo(() => uniqueRounds(matches ?? []), [matches]);
  const currentRound = selectedRound ?? rounds[0] ?? 0;

  const displayedMatches = useMemo(() => {
    return filteredMatches(
      matches ?? [],
      currentRound,
      selectedStatusGroup,
    );
  }, [matches, currentRound, selectedStatusGroup]);

  const allTeams = useMemo(() => {
    const list: any[] = [];
    (matches ?? []).forEach((m) => {
      if (m.teamA) list.push(m.teamA);
      if (m.teamB) list.push(m.teamB);
    });
    return list;
  }, [matches]);

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-900 py-6 px-3 text-slate-100 font-sarabun">
      <div className="max-w-4xl mx-auto">
        {/* Fullscreen Presentation Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.3)] border border-yellow-300/40 text-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="p-3 bg-slate-950/10 rounded-xl">
              <Trophy className="w-8 h-8 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide flex items-center justify-center sm:justify-start gap-2">
                <span>STAGE PRESENTATION MODE</span>
                <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
              </h2>
              <p className="text-xs font-semibold text-slate-900/80">
                เปิดหน้าจอใหญ่สำหรับจับคู่สุ่มทีม (Slot Machine Stage Animation)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="px-4 py-3 rounded-xl bg-slate-950/40 hover:bg-slate-950/70 border border-slate-950/50 text-slate-950 font-bold text-sm flex items-center justify-center gap-1.5 transition"
            >
              <History className="w-4 h-4" />
              <span>ประวัติการสุ่ม</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsSlotModalOpen(true)}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-slate-950 text-yellow-400 font-black text-sm md:text-base flex items-center justify-center gap-2 shadow-xl hover:bg-slate-900 transition"
            >
              <Tv className="w-5 h-5" />
              <span>เปิด Animation ขึ้นจอใหญ่</span>
              <Play className="w-4 h-4 fill-current" />
            </motion.button>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="bg-slate-800/90 rounded-2xl shadow-xl p-4 mb-5 border border-slate-700">
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {rounds.map((round) => (
              <button
                key={round}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  currentRound === round
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-105"
                    : "bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white"
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

          <div className="flex flex-wrap gap-2 justify-center">
            {["All", "Upcoming", "Completed"].map((status) => (
              <button
                key={status}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedStatusGroup === status ||
                  (status === "All" && selectedStatusGroup === null)
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "bg-slate-700/60 text-slate-300 hover:bg-slate-700"
                }`}
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

        {/* Matches List */}
        <div className="space-y-4">
          <AnimatePresence>
            {displayedMatches.map((match, index) => {
              const isWinnerA =
                match.status === "Completed" &&
                match.winner &&
                String(match.winner.teamID) === String(match.teamA?.teamID);

              const isWinnerB =
                match.status === "Completed" &&
                match.winner &&
                match.teamB &&
                String(match.winner.teamID) === String(match.teamB?.teamID);

              const teamANumber = match.teamA?.teamNumberInLevel ?? match.teamA?.teamID ?? "-";
              const teamBNumber = match.teamB ? (match.teamB.teamNumberInLevel ?? match.teamB.teamID ?? "-") : "-";

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.24) }}
                  className="relative bg-gradient-to-r from-blue-950 via-slate-900 to-red-950 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none"></div>
                  <div className="absolute top-0 left-0 w-1/2 h-full bg-blue-500/10 skew-x-12 transform -translate-x-10 pointer-events-none"></div>
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-red-500/10 -skew-x-12 transform translate-x-10 pointer-events-none"></div>

                  <div className="relative p-5 md:p-6">
                    <div className="flex items-center justify-between gap-2">
                      {/* ===== Team A ===== */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.25, delay: Math.min(index * 0.03 + 0.05, 0.29) }}
                        className={`flex-1 flex items-center justify-start gap-3 md:gap-4 ${
                          isWinnerA ? "bg-emerald-500/20 rounded-xl p-3 ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]" : "p-2 md:p-3"
                        }`}
                      >
                        <div className="text-center shrink-0 z-10">
                          <div
                            className={`px-4 py-2.5 md:px-5 md:py-3 rounded-xl text-xl md:text-2xl font-black tracking-wider shadow-lg overflow-hidden ${
                              isWinnerA
                                ? "bg-gradient-to-br from-yellow-400 to-amber-600 text-black"
                                : "bg-gradient-to-br from-blue-500 to-indigo-700 text-white"
                            }`}
                          >
                            #{teamANumber}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 z-10">
                          {isWinnerA && (
                            <motion.span 
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", delay: 0.2 }}
                              className="text-yellow-400 text-4xl drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                            >
                              ★
                            </motion.span>
                          )}
                          <div
                            className={`text-base md:text-lg font-bold drop-shadow-md ${
                              isWinnerA ? "text-yellow-400" : "text-blue-100"
                            }`}
                          >
                            {match.teamA?.school_name}
                          </div>
                        </div>
                      </motion.div>

                      {/* VS */}
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.03 + 0.1, 0.34) }}
                        className="mx-3 md:mx-6 relative z-20 shrink-0"
                      >
                        <div className="text-3xl md:text-4xl italic font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-amber-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] transform -skew-x-12">
                          VS
                        </div>
                      </motion.div>

                      {/* ===== Team B ===== */}
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.25, delay: Math.min(index * 0.03 + 0.05, 0.29) }}
                        className={`flex-1 flex items-center justify-end gap-3 md:gap-4 ${
                          isWinnerB ? "bg-emerald-500/20 rounded-xl p-3 ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]" : "p-2 md:p-3"
                        }`}
                      >
                        <div className="flex items-center gap-2 z-10 justify-end">
                          <div
                            className={`text-base md:text-lg font-bold text-right drop-shadow-md ${
                              isWinnerB ? "text-yellow-400" : "text-rose-100"
                            }`}
                          >
                            {match.teamB ? (
                              match.teamB.school_name
                            ) : (
                              <span className="text-slate-400 italic font-normal">ผ่านเข้ารอบ (BYE)</span>
                            )}
                          </div>
                          {isWinnerB && (
                            <motion.span 
                              initial={{ scale: 0, rotate: 180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", delay: 0.2 }}
                              className="text-yellow-400 text-4xl drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                            >
                              ★
                            </motion.span>
                          )}
                        </div>
                        <div className="text-center shrink-0 z-10">
                          {match.teamB && (
                            <div
                              className={`px-4 py-2.5 md:px-5 md:py-3 rounded-xl text-xl md:text-2xl font-black tracking-wider shadow-lg overflow-hidden ${
                                isWinnerB
                                  ? "bg-gradient-to-br from-yellow-400 to-amber-600 text-black"
                                  : "bg-gradient-to-br from-rose-500 to-red-700 text-white"
                              }`}
                            >
                              #{teamBNumber}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {displayedMatches.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-slate-700"
            >
              <div className="text-4xl mb-3">🎮</div>
              <div className="text-slate-400 font-medium">ไม่มีการแข่งขันในเงื่อนไขนี้</div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Stage Presentation Slot Machine Modal */}
      <MatchSlotModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        matches={displayedMatches}
        allTeams={allTeams}
        round={currentRound}
      />

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