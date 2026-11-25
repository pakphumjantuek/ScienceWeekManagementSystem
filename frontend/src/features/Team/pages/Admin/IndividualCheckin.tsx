import { useParams } from "react-router-dom";
import { useGetAllRewardTypeQuery } from "../../../RewardType/RewardTypeApi";
import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../../../config";
import {
  Search,
  Trophy,
  Users,
  Filter,
  RefreshCw,
} from "lucide-react";
import { showError, showSuccessOk } from "../../../../utils/confirmDelete";
import { handleDownloadWinnersWord } from "../../../../Apis/Export";
import { getRewardSortOrder } from "../../../../utils/rewardSort";

interface StudentItem {
  studentID: number;
  firstName: string;
  lastName: string;
  isMainMember?: boolean;
  schoolName?: string;
  rewardTypeID?: number | null;
  isCheckedIn?: boolean;
}

export default function IndividualCheckin() {
  const { competitionLevelID } = useParams();
  const { data: rewards = [] } = useGetAllRewardTypeQuery();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rewardFilter, setRewardFilter] = useState<"all" | "rewarded" | "none">(
    "all",
  );
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/individual-checkin/competition-level/${competitionLevelID}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await res.json();
      setStudents(data.result ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (competitionLevelID) {
      fetchStudents();
    }
  }, [competitionLevelID]);

  const handleUpdateReward = async (
    id: number,
    rewardTypeId: number | null,
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(
        `${API_BASE_URL}/individual-checkin/${id}/reward`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(rewardTypeId),
        },
      );

      if (!res.ok) {
        throw new Error("เกิดข้อผิดพลาดในการบันทึกรางวัล");
      }

      setStudents((prev) =>
        prev.map((x) =>
          x.studentID === id ? { ...x, rewardTypeID: rewardTypeId } : x,
        ),
      );

      await showSuccessOk("บันทึกผลรางวัลเรียบร้อยแล้ว");
    } catch (error) {
      await showError("ไม่สามารถบันทึกรางวัลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter checked-in students
  const checkedInStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.isCheckedIn === true ||
        (s as any).isCheckedIn === 1 ||
        (s as any).teamStatus === 3 ||
        (s as any).teamStatus === "CheckedIn",
    );
  }, [students]);

  // Filter & Search Logic
  const filteredStudents = useMemo(() => {
    return checkedInStudents.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const school = (s.schoolName || "").toLowerCase();
      const query = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !query || fullName.includes(query) || school.includes(query);

      const matchesReward =
        rewardFilter === "all"
          ? true
          : rewardFilter === "rewarded"
            ? !!s.rewardTypeID
            : !s.rewardTypeID;

      return matchesSearch && matchesReward;
    });
  }, [checkedInStudents, searchTerm, rewardFilter]);

  const sortedFilteredStudents = useMemo(
    () =>
      filteredStudents
        .map((student, originalIndex) => ({
          student,
          originalIndex,
          rewardOrder: getRewardSortOrder(
            rewards.find((reward) => reward.rewardTypeID === student.rewardTypeID)
              ?.rewardTypeName,
          ),
        }))
        .sort(
          (a, b) =>
            a.rewardOrder - b.rewardOrder || a.originalIndex - b.originalIndex,
        )
        .map(({ student }) => student),
    [filteredStudents, rewards],
  );

  // Statistics
  const totalCount = checkedInStudents.length;
  const rewardedCount = useMemo(
    () => checkedInStudents.filter((s) => s.rewardTypeID).length,
    [checkedInStudents],
  );
  const unassignedCount = totalCount - rewardedCount;

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="mx-auto max-w8xl space-y-6">
        {/* Header Card with Search & Filters */}
        <div className="rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
                <Trophy className="h-4 w-4 text-amber-500" />
                Individual Award Management
              </div>
              <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                บันทึกผลรางวัลรายบุคคล
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                ระบุผลรางวัลสำหรับผู้เข้าร่วมการแข่งขันที่ลงทะเบียนเข้างานแล้ว
                (ทั้งหมด {totalCount} คน)
              </p>
            </div>

            <div className="flex flex-wrap gap-2 self-start">
              <button
                onClick={() => handleDownloadWinnersWord(Number(competitionLevelID))}
                className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-800 focus:outline-none"
              >
                <Trophy className="h-4 w-4" />
                ดาวน์โหลดผลรางวัล Word
              </button>
              <button
                onClick={fetchStudents}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-100 hover:border-slate-400 focus:outline-none"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                รีเฟรชข้อมูล
              </button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้เข้าร่วม หรือ โรงเรียน/หน่วยงาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-white pl-11 pr-4 py-2.5 text-base font-medium text-slate-800 shadow-sm placeholder:text-slate-400 outline-none transition-colors focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Reward Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-700">
                กรองตามรางวัล:
              </span>
              <select
                value={rewardFilter}
                onChange={(e) => setRewardFilter(e.target.value as any)}
                className="rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-600"
              >
                <option value="all">ทั้งหมด ({totalCount})</option>
                <option value="rewarded">
                  ระบุรางวัลพิเศษแล้ว ({rewardedCount})
                </option>
                <option value="none">
                  เข้าร่วมการแข่งขัน ({unassignedCount})
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-base text-slate-900">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bold border-b border-slate-800">
                    ชื่อ-นามสกุล ผู้สมัคร
                  </th>
                  <th className="px-6 py-4 text-left font-bold border-b border-slate-800">
                    โรงเรียน / หน่วยงาน
                  </th>
                  <th className="px-6 py-4 text-center font-bold border-b border-slate-800">
                    เลือกผลรางวัลรายบุคคล
                  </th>
                  <th className="px-6 py-4 text-center font-bold border-b border-slate-800">
                    สถานะรางวัล
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedFilteredStudents.map((s) => {
                  const isUpdating = updatingId === s.studentID;
                  const currentReward = rewards.find(
                    (r) => r.rewardTypeID === s.rewardTypeID,
                  );

                  return (
                    <tr
                      key={s.studentID}
                      className="transition-colors hover:bg-slate-50/90"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-base">
                          {s.firstName} {s.lastName}
                        </div>
                        <span
                          className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            s.isMainMember
                              ? "bg-blue-100 text-blue-800 border border-blue-300"
                              : "bg-slate-100 text-slate-700 border border-slate-300"
                          }`}
                        >
                          {s.isMainMember ? "ผู้สมัครหลัก" : "ผู้สมัครสำรอง"}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-700">
                        {s.schoolName || "-"}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <select
                          value={s.rewardTypeID ?? ""}
                          onChange={(e) =>
                            handleUpdateReward(
                              s.studentID,
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                          disabled={isUpdating}
                          className="w-64 rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-800 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                        >
                          <option value="">เข้าร่วมการแข่งขัน (เริ่มต้น)</option>
                          {rewards.map((r) => (
                            <option key={r.rewardTypeID} value={r.rewardTypeID}>
                              {r.rewardTypeName}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {currentReward ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-900 shadow-sm">
                            <Trophy className="h-3.5 w-3.5 text-amber-500" />
                            {currentReward.rewardTypeName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-600">
                            เข้าร่วมการแข่งขัน
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-14 text-center text-slate-500"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-10 w-10 text-slate-400" />
                        <p className="text-base font-bold text-slate-700">
                          {searchTerm
                            ? `ไม่พบข้อมูลผู้สมัครที่ตรงกับ "${searchTerm}"`
                            : "ไม่พบรายชื่อผู้สมัครเข้าร่วมแข่งขัน"}
                        </p>
                        <p className="text-xs text-slate-500">
                          ลองเปลี่ยนคำค้นหา หรือเปลี่ยนตัวกรองรางวัล
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
