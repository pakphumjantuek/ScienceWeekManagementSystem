import React, { useState } from "react";
import { useGetAllCompetitionLevelQuery } from "../../CompetitionLevel/CompetitionLevelApi";
import { useChangeTeamLevelMutation } from "../TeamApi";
import { showSuccessOk, showError } from "../../../utils";
import { ArrowRightLeft, AlertTriangle, CheckCircle, X } from "lucide-react";

interface ChangeTeamLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: {
    teamID: number;
    teamName?: string;
    primaryFirstName?: string;
    primaryLastName?: string;
    competitionLevelID?: number;
    competitionLevelName?: string;
    status?: number | string;
    schoolName?: string;
    schools?: { school_name?: string };
    studentCount?: number;
  } | null;
  competitionYearID?: number;
}

export const ChangeTeamLevelModal: React.FC<ChangeTeamLevelModalProps> = ({
  isOpen,
  onClose,
  team,
  competitionYearID,
}) => {
  const [selectedTargetLevelId, setSelectedTargetLevelId] = useState<number | "">("");
  const [changeTeamLevel, { isLoading: isSubmitting }] = useChangeTeamLevelMutation();

  const { data: competitionLevels, isLoading: isLoadingLevels } = useGetAllCompetitionLevelQuery(
    Number(competitionYearID),
    { skip: !competitionYearID || !isOpen }
  );

  if (!isOpen || !team) return null;

  // Check if team is checked in
  // SD.TeamStatus.CheckedIn = 3
  const isCheckedIn = team.status === 3 || team.status === "CheckedIn" || team.status === "เช็คอินแล้ว";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetLevelId) {
      showError("กรุณาเลือกระดับชั้นปลายทางที่ต้องการย้าย");
      return;
    }

    if (isCheckedIn) {
      showError("ไม่สามารถย้ายระดับชั้นได้ เนื่องจากทีมลงทะเบียนเช็คอินเข้างานแล้ว");
      return;
    }

    try {
      const res: any = await changeTeamLevel({
        teamId: team.teamID,
        targetCompetitionLevelId: Number(selectedTargetLevelId),
      }).unwrap();

      if (res?.isSuccess !== false) {
        showSuccessOk("ย้ายระดับชั้นสำเร็จเรียบร้อยแล้ว");
        onClose();
      } else {
        showError(res?.errorMessages?.[0] || "เกิดข้อผิดพลาดในการย้ายระดับชั้น");
      }
    } catch (err: any) {
      showError(err?.data?.errorMessages?.[0] || err?.message || "เกิดข้อผิดพลาดในการย้ายระดับชั้น");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="w-5 h-5 text-white/90" />
            <h3 className="text-lg font-bold">ย้ายระดับชั้นการแข่งขัน</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Team Info Card */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600 text-sm space-y-1">
            <div className="font-semibold text-gray-800 dark:text-gray-200 text-base">
              ทีม ID: #{team.teamID} {team.primaryFirstName ? `(${team.primaryFirstName} ${team.primaryLastName || ''})` : ''}
            </div>
            {team.schools?.school_name && (
              <div className="text-gray-600 dark:text-gray-400">
                สถานศึกษา: <span className="font-medium text-gray-700 dark:text-gray-300">{team.schools.school_name}</span>
              </div>
            )}
            <div className="text-gray-600 dark:text-gray-400">
              ระดับชั้นปัจจุบัน:{" "}
              <span className="inline-block font-semibold text-blue-600 dark:text-blue-400">
                {team.competitionLevelName || `ID: ${team.competitionLevelID}`}
              </span>
            </div>
          </div>

          {/* CheckedIn Alert */}
          {isCheckedIn ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start space-x-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">ไม่สามารถย้ายระดับชั้นได้</p>
                <p className="text-xs text-red-600 mt-0.5">
                  ทีมนี้ได้ทำการลงทะเบียนเช็คอินเข้างานเรียบร้อยแล้ว (CheckedIn) ระบบไม่อนุญาตให้แก้ไขระดับชั้นหลังจากเช็คอิน
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-start space-x-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                คำเตือน: โปรดตรวจสอบระดับชั้นใหม่ให้ถูกต้อง การย้ายระดับชั้นอาจมีผลกระทบต่อตารางและสายการแข่งขันในระบบ
              </span>
            </div>
          )}

          {/* Level Selector */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              เลือกระดับชั้นการแข่งขันใหม่ <span className="text-red-500">*</span>
            </label>

            {isLoadingLevels ? (
              <div className="text-xs text-gray-500 animate-pulse">กำลังดึงข้อมูลระดับชั้น...</div>
            ) : (
              <select
                disabled={isCheckedIn || isSubmitting}
                value={selectedTargetLevelId}
                onChange={(e) => setSelectedTargetLevelId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">-- กรุณาเลือกระดับชั้น --</option>
                {competitionLevels
                  ?.filter((lvl) => lvl.competitionLevelID !== team.competitionLevelID)
                  .map((lvl) => (
                    <option key={lvl.competitionLevelID} value={lvl.competitionLevelID}>
                      {lvl.levelName || `ระดับชั้น ID: ${lvl.competitionLevelID}`}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isCheckedIn || !selectedTargetLevelId || isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl shadow-md transition flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <span>กำลังย้าย...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>ยืนยันการย้าย</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
