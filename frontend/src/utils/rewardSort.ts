/** Sort assigned competition rewards from winner to participation/no award. */
export const getRewardSortOrder = (rewardType?: string) => {
  const name = (rewardType ?? "").toLowerCase().replace(/\s+/g, "");
  if (!name || name.includes("เข้าร่วม")) return 5;

  // Legacy values sometimes use "ชนะเลิศอันดับ 1/2" for runner-up awards.
  if (name.includes("รองชนะเลิศ")) {
    if (/อันดับ(?:ที่)?1|อันดับหนึ่ง/.test(name)) return 1;
    if (/อันดับ(?:ที่)?2|อันดับสอง/.test(name)) return 2;
    return 1.5;
  }
  if (/ชนะเลิศอันดับ(?:ที่)?1|ชนะเลิศอันดับหนึ่ง/.test(name)) return 1;
  if (/ชนะเลิศอันดับ(?:ที่)?2|ชนะเลิศอันดับสอง/.test(name)) return 2;
  if (name.includes("ชนะเลิศ") || name.includes("gold")) return 0;
  if (name.includes("silver")) return 1;
  if (name.includes("bronze")) return 2;
  if (name.includes("ชมเชย")) return 3;
  return 4;
};
