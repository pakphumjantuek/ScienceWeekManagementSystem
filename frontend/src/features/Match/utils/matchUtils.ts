import type { Match } from "../type";

export const statusName = (status: string): string => {
  switch (status) {
    case "Pending":
      return "รอผลการแข่งขัน";
    case "Completed":
      return "จบการแข่งขัน";
    case "Bye":
      return "ชนะบาย";
    case "In_progress":
      return "กำลังแข่งขัน";
    default:
      return status;
  }
};

export const colorName = (status: string): string => {
  switch (status) {
    case "Pending":
      return "bg-yellow-500";
    case "Completed":
    case "Bye":
      return "bg-green-500";
    case "In_progress":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

export const roundName = (round: number): string => {
  return `รอบที่ ${round}`;
};

export const uniqueRounds = (matches: Match[]) => {
  return Array.from(new Set(matches?.map((m) => m.round)));
};

// กลุ่มสถานะ
export const matchStatusGroups: Record<string, string[]> = {
  Upcoming: ["Pending"],
  Completed: ["Completed", "Bye"],
};

// กรอง match ตามรอบและสถานะกลุ่ม
export const filteredMatches = (
  matches: Match[],
  selectedRound: number,
  selectedStatusGroup: string | null
): Match[] => {
  return matches.filter((match) => {
    const matchRoundOk = match.round === selectedRound;
    const matchStatusOk =
      !selectedStatusGroup ||
      matchStatusGroups[selectedStatusGroup]?.includes(match.status);
    return matchRoundOk && matchStatusOk;
  });
};
