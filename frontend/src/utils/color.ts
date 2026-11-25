const norm = (s?: string) =>
  (s ?? "")
    .replace(/\s+/g, " ") // รวมช่องว่างหลายตัวเป็น 1
    .trim();

export const badgeClass = (raw?: string) => {
  const name = norm(raw);

  // ชื่อที่ระบบส่งมา (ต้องตรงกับ 5 ข้อที่กำหนด)
  switch (name) {
    case "รางวัลชนะเลิศ":
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-200"; // ทอง
    case "รางวัลชนะเลิศอันดับ1":
      return "bg-sky-100 text-sky-800 ring-1 ring-sky-200"; // น้ำเงินเด่น
    case "รางวัลชนะเลิศอันดับ2":
      return "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200"; // คราม
    case "รางวัลชมเชย":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"; // เขียวอ่อน
    case "เข้าร่วมการเเข่งขัน": // ตามสะกดที่ให้มา (เเข)
      return "bg-slate-200 text-slate-800 ring-1 ring-slate-300"; // เทากลาง
    default:
      return "bg-blue-50 text-blue-800 ring-1 ring-blue-100"; // เผื่อกรณีอื่น
  }
};
