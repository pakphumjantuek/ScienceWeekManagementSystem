import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Match, Team } from "../type";
import { roundName } from "../utils/matchUtils";
import { matchAudio } from "../utils/audioEffects";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Trophy,
  Zap,
  Gauge,
  HelpCircle,
} from "lucide-react";

interface MatchSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  allTeams: Team[];
  round: number;
}

// Particle generator helper for reveal fireworks
const CanvasConfetti: React.FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const colors = [
      "#3b82f6",
      "#ef4444",
      "#eab308",
      "#06b6d4",
      "#a855f7",
      "#ffffff",
    ];
    const particles = Array.from({ length: 90 }, () => ({
      x: width / 2,
      y: height / 2 - 80,
      vx: (Math.random() - 0.5) * 22,
      vy: (Math.random() - 0.7) * 22,
      size: Math.random() * 9 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      alpha: 1,
    }));

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      let aliveCount = 0;

      particles.forEach((p) => {
        if (p.alpha <= 0) return;
        aliveCount++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45;
        p.vx *= 0.97;
        p.rotation += p.rotationSpeed;
        p.alpha -= 0.012;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (aliveCount > 0) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
};

export const MatchSlotModal: React.FC<MatchSlotModalProps> = ({
  isOpen,
  onClose,
  matches,
  allTeams,
  round,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLockedA, setIsLockedA] = useState(false);
  const [isLockedB, setIsLockedB] = useState(false);

  // Track revealed state per match index so revisiting keeps it revealed
  const [revealedMatches, setRevealedMatches] = useState<Record<number, boolean>>({});

  const [speedMode, setSpeedMode] = useState<"normal" | "fast" | "turbo">(
    "fast",
  );

  const [dummyTeamA, setDummyTeamA] = useState<Team | null>(null);
  const [dummyTeamB, setDummyTeamB] = useState<Team | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const currentMatch = matches[currentIndex];

  const poolTeams = useRef<Team[]>([]);

  useEffect(() => {
    const teamsList: Team[] = [];
    matches.forEach((m) => {
      if (m.teamA) teamsList.push(m.teamA);
      if (m.teamB) teamsList.push(m.teamB);
    });
    if (allTeams && allTeams.length > 0) {
      allTeams.forEach((t) => {
        if (!teamsList.some((existing) => existing.teamID === t.teamID)) {
          teamsList.push(t);
        }
      });
    }
    poolTeams.current =
      teamsList.length > 0
        ? teamsList
        : [
            { teamID: "1", school_name: "โรงเรียน A", teamNumberInLevel: 1 },
            { teamID: "2", school_name: "โรงเรียน B", teamNumberInLevel: 2 },
            { teamID: "3", school_name: "โรงเรียน C", teamNumberInLevel: 3 },
          ];
  }, [matches, allTeams]);

  useEffect(() => {
    if (currentMatch) {
      const isAlreadyRevealed = !!revealedMatches[currentIndex];
      setIsLockedA(isAlreadyRevealed);
      setIsLockedB(isAlreadyRevealed);
      setIsSpinning(false);
      setShowConfetti(false);
    }
  }, [currentIndex, currentMatch, revealedMatches]);

  const getSpeedConfig = () => {
    switch (speedMode) {
      case "turbo":
        return { spinDuration: 500, autoPlayDelay: 600, tickInterval: 40 };
      case "fast":
        return { spinDuration: 1000, autoPlayDelay: 1200, tickInterval: 45 };
      case "normal":
      default:
        return { spinDuration: 2000, autoPlayDelay: 2500, tickInterval: 60 };
    }
  };

  const startSpin = () => {
    if (!currentMatch || isSpinning) return;

    setIsSpinning(true);
    setIsLockedA(false);
    setIsLockedB(false);
    setShowConfetti(false);

    const { spinDuration, tickInterval } = getSpeedConfig();
    let startTime = Date.now();
    let tickCounter = 0;
    let lockedA = false;
    let lockedB = false;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pool = poolTeams.current;

      if (pool.length > 0) {
        const idxA = Math.floor(Math.random() * pool.length);
        let idxB = Math.floor(Math.random() * pool.length);
        if (pool.length > 1 && idxB === idxA) {
          idxB = (idxA + 1) % pool.length;
        }
        setDummyTeamA(pool[idxA]);
        setDummyTeamB(pool[idxB]);
      }

      tickCounter++;
      if (tickCounter % 2 === 0) {
        matchAudio.playSpinTick();
      }

      // Lock Team A at 50% of spin duration
      if (elapsed >= spinDuration * 0.5 && !lockedA) {
        lockedA = true;
        setIsLockedA(true);
        matchAudio.playLockSound();
      }

      // Lock Team B at 100% of spin duration
      if (elapsed >= spinDuration && !lockedB) {
        lockedB = true;
        clearInterval(interval);
        setIsLockedA(true);
        setIsLockedB(true);
        setIsSpinning(false);
        setRevealedMatches((prev) => ({ ...prev, [currentIndex]: true }));
        matchAudio.playLockSound();

        setTimeout(() => {
          matchAudio.playFanfare();
          setShowConfetti(true);
        }, 100);
      }
    }, tickInterval);
  };

  useEffect(() => {
    let timer: number;
    if (isAutoPlay && isOpen && currentMatch) {
      const { autoPlayDelay } = getSpeedConfig();
      if (!isSpinning && !isLockedB) {
        startSpin();
      } else if (isLockedB && currentIndex < matches.length - 1) {
        timer = window.setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, autoPlayDelay);
      } else if (isLockedB && currentIndex === matches.length - 1) {
        setIsAutoPlay(false);
      }
    }
    return () => clearTimeout(timer);
  }, [
    isAutoPlay,
    isLockedB,
    isSpinning,
    currentIndex,
    isOpen,
    currentMatch,
    speedMode,
  ]);

  if (!isOpen) return null;

  const isCurrentMatchRevealed = !!revealedMatches[currentIndex];

  // Active teams display logic
  const displayTeamA =
    isLockedA || (isCurrentMatchRevealed && !isSpinning)
      ? currentMatch?.teamA
      : isSpinning
      ? dummyTeamA
      : null;

  const displayTeamB =
    isLockedB || (isCurrentMatchRevealed && !isSpinning)
      ? currentMatch?.teamB
      : isSpinning
      ? dummyTeamB
      : null;

  const getTeamDisplayNumber = (team?: Team | null) => {
    if (!team) return null;
    if (team.teamNumberInLevel != null) return `#${team.teamNumberInLevel}`;
    if (team.teamID != null) return `#${team.teamID}`;
    return null;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/95 backdrop-blur-xl text-white font-sarabun overflow-hidden select-none"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-black pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-yellow-500 to-amber-300 text-black shadow-lg shadow-yellow-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 uppercase">
                {roundName(round)} • STAGE MATCH DRAW
              </h2>
              <p className="text-xs text-slate-400">
                โหมดแสดงผลการสุ่มจับคู่บนหน้าจอใหญ่ (Esports Presentation)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl bg-slate-800/90 border border-slate-700 p-1">
              <div className="px-2 text-xs font-bold text-slate-400 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5" />
                <span>ความเร็ว:</span>
              </div>
              <button
                onClick={() => setSpeedMode("normal")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  speedMode === "normal"
                    ? "bg-slate-700 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ปกติ
              </button>
              <button
                onClick={() => setSpeedMode("fast")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  speedMode === "fast"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ⚡ เร็ว
              </button>
              <button
                onClick={() => setSpeedMode("turbo")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  speedMode === "turbo"
                    ? "bg-cyan-400 text-slate-950 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🚀 ทอร์โบ
              </button>
            </div>

            <button
              onClick={() => setIsMuted(matchAudio.toggleMute())}
              className={`p-2.5 rounded-xl border transition-all ${
                isMuted
                  ? "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
              }`}
              title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-red-600 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Match Navigation Pills */}
        <div className="relative z-20 px-6 py-2 bg-slate-900/30 flex items-center justify-center gap-2 overflow-x-auto">
          {matches.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setCurrentIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentIndex === idx
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-105"
                  : revealedMatches[idx]
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {revealedMatches[idx] ? "✓ " : ""}คู่ที่ {idx + 1}
            </button>
          ))}
        </div>

        {/* Main Slot Arena Stage */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-12 py-6">
          {currentMatch ? (
            <div className="w-full max-w-6xl flex flex-col items-center">
              <motion.div
                key={`header-${currentMatch.id}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 px-6 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 font-bold text-sm md:text-base flex items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
                การแข่งขันคู่ที่ {currentIndex + 1} / {matches.length}
              </motion.div>

              <div className="w-full grid grid-cols-1 md:grid-cols-11 gap-6 items-center">
                {/* BLUE TEAM A CARD */}
                <div className="md:col-span-5 relative rounded-3xl p-6 md:p-8 bg-gradient-to-br from-blue-950/80 via-slate-900/90 to-blue-900/50 border-2 border-blue-500/60 shadow-[0_0_40px_rgba(59,130,246,0.3)] overflow-hidden flex flex-col items-center text-center">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600" />
                  <div className="text-blue-400 font-black tracking-widest text-xs uppercase mb-3 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    BLUE SIDE (ทีม A)
                  </div>

                  <div className="relative my-4 w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-b from-blue-600 to-indigo-900 border-4 border-cyan-400/80 flex items-center justify-center shadow-inner overflow-hidden">
                    {displayTeamA ? (
                      <span className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] transition-all">
                        {getTeamDisplayNumber(displayTeamA) ?? "?"}
                      </span>
                    ) : (
                      <div className="flex flex-col items-center text-blue-300/80">
                        <HelpCircle className="w-12 h-12 animate-pulse mb-1" />
                        <span className="text-xs font-bold">รอเปิดสุ่ม</span>
                      </div>
                    )}
                  </div>

                  <div className="h-16 flex items-center justify-center px-2">
                    <h3 className="text-xl md:text-2xl font-black text-blue-100 drop-shadow text-center line-clamp-2">
                      {displayTeamA
                        ? displayTeamA.school_name
                        : isSpinning
                        ? "กำลังสุ่มทีม..."
                        : "??? (รอเปิดสุ่ม)"}
                    </h3>
                  </div>

                  <div className="mt-4">
                    {isLockedA || (isCurrentMatchRevealed && !isSpinning) ? (
                      <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse">
                        ✓ ล็อคทีมแล้ว (READY)
                      </span>
                    ) : (
                      <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
                        {isSpinning ? "🎰 กำลังสุ่ม..." : "รอเริ่มสุ่ม"}
                      </span>
                    )}
                  </div>
                </div>

                {/* VS Emblem Center */}
                <div className="md:col-span-1 flex flex-col items-center justify-center py-4 md:py-0">
                  <motion.div
                    animate={
                      isSpinning
                        ? { scale: [1, 1.25, 1], rotate: [0, 10, -10, 0] }
                        : { scale: 1 }
                    }
                    transition={{
                      repeat: isSpinning ? Infinity : 0,
                      duration: 0.5,
                    }}
                    className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-600 p-1 shadow-[0_0_30px_rgba(234,179,8,0.6)] flex items-center justify-center z-10"
                  >
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center border-2 border-yellow-400">
                      <span className="text-3xl md:text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        VS
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* RED TEAM B CARD */}
                <div className="md:col-span-5 relative rounded-3xl p-6 md:p-8 bg-gradient-to-br from-red-950/80 via-slate-900/90 to-rose-900/50 border-2 border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.3)] overflow-hidden flex flex-col items-center text-center">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-600" />
                  <div className="text-red-400 font-black tracking-widest text-xs uppercase mb-3 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                    RED SIDE (ทีม B)
                  </div>

                  <div className="relative my-4 w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-b from-red-600 to-rose-900 border-4 border-rose-400/80 flex items-center justify-center shadow-inner overflow-hidden">
                    {displayTeamB ? (
                      <span className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] transition-all">
                        {getTeamDisplayNumber(displayTeamB) ?? (currentMatch.teamB ? "?" : "BYE")}
                      </span>
                    ) : !currentMatch.teamB ? (
                      <span className="text-4xl font-black text-yellow-300">
                        BYE
                      </span>
                    ) : (
                      <div className="flex flex-col items-center text-red-300/80">
                        <HelpCircle className="w-12 h-12 animate-pulse mb-1" />
                        <span className="text-xs font-bold">รอเปิดสุ่ม</span>
                      </div>
                    )}
                  </div>

                  <div className="h-16 flex items-center justify-center px-2">
                    <h3 className="text-xl md:text-2xl font-black text-red-100 drop-shadow text-center line-clamp-2">
                      {displayTeamB
                        ? displayTeamB.school_name
                        : !currentMatch.teamB
                        ? "ผ่านเข้ารอบอัตโนมัติ (BYE)"
                        : isSpinning
                        ? "กำลังสุ่มทีม..."
                        : "??? (รอเปิดสุ่ม)"}
                    </h3>
                  </div>

                  <div className="mt-4">
                    {isLockedB || (isCurrentMatchRevealed && !isSpinning) ? (
                      <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/40 animate-pulse">
                        ✓ ล็อคทีมแล้ว (READY)
                      </span>
                    ) : (
                      <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
                        {isSpinning ? "🎰 กำลังสุ่ม..." : "รอเริ่มสุ่ม"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400">
              ไม่มีแมตช์การแข่งขันในรอบนี้
            </div>
          )}
        </div>

        {/* Bottom Stage Controls Toolbar */}
        <div className="relative z-20 px-6 py-5 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0 || isSpinning}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 font-bold text-sm flex items-center gap-2 disabled:opacity-40 hover:bg-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              คู่ก่อนหน้า
            </button>
            <button
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(matches.length - 1, prev + 1),
                )
              }
              disabled={currentIndex === matches.length - 1 || isSpinning}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 font-bold text-sm flex items-center gap-2 disabled:opacity-40 hover:bg-slate-700 transition"
            >
              คู่ถัดไป
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startSpin}
              disabled={isSpinning}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-slate-950 font-black text-lg shadow-[0_0_25px_rgba(234,179,8,0.5)] flex items-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-6 h-6 fill-current" />
              {isSpinning
                ? "🎰 กำลังสุ่ม SLOT..."
                : isCurrentMatchRevealed
                ? "🔄 หมุนสุ่มซ้ำอีกครั้ง"
                : "⚡ หมุนสุ่มคู่นี้ (SPIN DRAW)"}
            </motion.button>

            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`px-5 py-3 rounded-2xl border font-bold text-sm flex items-center gap-2 transition-all ${
                isAutoPlay
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.4)]"
                  : "border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {isAutoPlay ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isAutoPlay ? "หยุด Auto Play" : "▶ Auto Play ทั้งหมด"}
            </button>
          </div>
        </div>

        <CanvasConfetti active={showConfetti} />
      </motion.div>
    </AnimatePresence>
  );
};