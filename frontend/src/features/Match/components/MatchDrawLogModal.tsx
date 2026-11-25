import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMatchDrawLogsQuery, useRollbackMatchDrawLogMutation } from "../matchApi";
import type { MatchDrawLog } from "../type";
import { roundName } from "../utils/matchUtils";
import { confirmDelete, showError, showSuccessOk } from "../../../utils/confirmDelete";
import { History, RotateCcw, X, Clock, Sparkles, AlertCircle } from "lucide-react";

interface MatchDrawLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionLevelID: string;
  onRollbackSuccess?: () => void;
}

export const MatchDrawLogModal: React.FC<MatchDrawLogModalProps> = ({
  isOpen,
  onClose,
  competitionLevelID,
  onRollbackSuccess,
}) => {
  const { data: logs, isLoading } = useGetMatchDrawLogsQuery(competitionLevelID, {
    skip: !isOpen,
  });

  const [rollbackLog, { isLoading: isRollbacking }] = useRollbackMatchDrawLogMutation();

  const handleRollback = async (log: MatchDrawLog) => {
    const ok = await confirmDelete(
      `คุณต้องการย้อนกลับไปใช้ผลการสุ่มของรายการ #${log.id} (${roundName(log.round)}) ใช่หรือไม่?`
    );
    if (!ok) return;

    try {
      await rollbackLog(log.id).unwrap();
      showSuccessOk(`ย้อนกลับไปใช้ผลการสุ่ม #${log.id} สำเร็จ!`);
      if (onRollbackSuccess) onRollbackSuccess();
      onClose();
    } catch (error: any) {
      const errMsg = error?.data?.errorMessages?.[0] ?? "ไม่สามารถย้อนกลับผลการสุ่มได้";
      showError(errMsg);
    }
  };

  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case "GENERATE_FIRST_ROUND":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            🎲 สุ่มจับคู่รอบแรก
          </span>
        );
      case "NEXT_ROUND":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            ⚡ สุ่มรอบถัดไป
          </span>
        );
      case "ROLLBACK":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            ⏮️ ย้อนกลับผลสุ่ม
          </span>
        );
      case "CANCEL_ROUND":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            ❌ ยกเลิกรอบ
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-300">
            {actionType}
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sarabun text-slate-100 select-none"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-wide text-white flex items-center gap-2">
                  <span>ประวัติการสุ่มจับคู่ (DRAW LOGS)</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </h3>
                <p className="text-xs text-slate-400">
                  ตรวจสอบและกู้คืน (Rollback) ผลการสุ่มจับคู่แข่งขันย้อนหลัง
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logs Timeline Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
                กำลังโหลดประวัติการสุ่ม...
              </div>
            ) : logs && logs.length > 0 ? (
              logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="relative p-4 md:p-5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-purple-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                        Log #{log.id}
                      </span>
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/30">
                        {roundName(log.round)}
                      </span>
                      {getActionBadge(log.actionType)}
                    </div>

                    <p className="text-sm font-semibold text-slate-200">
                      {log.note || "ไม่มีรายละเอียดเพิ่มเติม"}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                  </div>

                  {/* Rollback Action Button */}
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => handleRollback(log)}
                      disabled={isRollbacking}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50 transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>ย้อนกลับใช้ผลสุ่มนี้</span>
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p>ยังไม่มีประวัติบันทึกการสุ่มในระบบ</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <span>เมื่อย้อนกลับผลสุ่ม ระบบจะส่งสัญญาณ real-time อัปเดตหน้าจอทันที</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};