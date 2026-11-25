// utils/image.ts
const getAssetBase = () => {
  // อ่านจาก .env ถ้ามี; ถ้าไม่มี fallback เป็น BASE_URL ของ Vite (คง sub-path ให้เอง)
  const envBase = String(import.meta.env.VITE_API_BASE_URLS ?? "").trim();
  // resolve กับ origin เสมอ เพื่อรองรับค่าแบบ relative เช่น "/ScienceWeek/"
  const base = new URL(
    envBase || import.meta.env.BASE_URL,
    window.location.origin
  ).toString();
  // บังคับให้ลงท้ายด้วย / แค่ตัวเดียว ไม่ว่าค่าต้นทางจะมีหรือไม่
  return base.replace(/\/+$/, "") + "/";
};

export const buildImageUrl = (p?: string | null) => {
  if (!p) return "";
  const path = String(p).trim().replace(/^\/+/, ""); // ตัด / นำหน้าเผื่อกรณี p เริ่มด้วย /
  if (/^https?:\/\//i.test(path)) return path; // ถ้าเป็น URL เต็มแล้ว คืนเลย
  return new URL(path, getAssetBase()).toString(); // new URL จะคง sub-path ให้ถูกต้อง
};
