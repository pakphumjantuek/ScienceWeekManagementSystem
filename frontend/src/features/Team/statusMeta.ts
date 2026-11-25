import { AlertTriangle, CheckCircle2, CircleDashed, Hourglass, XCircle, type LucideIcon } from "lucide-react";

// หน้าตาของแต่ละสถานะทีม: สีขอบซ้าย, แถบสถานะ, ไอคอน และคำอธิบายสั้น ๆ ว่าต้องทำอะไรต่อ
export type StatusMeta = {
  border: string;
  bar: string;
  iconWrap: string;
  icon: LucideIcon;
  hint: string;
  /** ชื่อสถานะที่แสดงฝั่งผู้ใช้ (ไม่ใส่ = ใช้ชื่อเดียวกับฝั่งเจ้าหน้าที่) */
  label?: string;
};
export const STATUS_META: Record<number, StatusMeta> = {
  1: {
    border: "border-l-blue-500",
    bar: "bg-blue-50 text-blue-900",
    iconWrap: "bg-blue-600 text-white",
    icon: Hourglass,
    label: "สมัครสำเร็จ",
    hint: "สมัครเรียบร้อย — สถานะจะเปลี่ยนเป็น \"ลงทะเบียนเข้างาน\" เมื่อมารายงานตัวที่จุดลงทะเบียนในวันแข่งขัน",
  },
  2: {
    border: "border-l-amber-500",
    bar: "bg-amber-50 text-amber-900",
    iconWrap: "bg-amber-500 text-white",
    icon: AlertTriangle,
    hint: "กรุณากด \"แก้ไข\" เพื่อปรับปรุงโครงงานแล้วบันทึกใหม่",
  },
  3: {
    border: "border-l-emerald-500",
    bar: "bg-emerald-50 text-emerald-900",
    iconWrap: "bg-emerald-600 text-white",
    icon: CheckCircle2,
    hint: "รายงานตัวที่จุดลงทะเบียนเรียบร้อยแล้ว",
  },
  4: {
    border: "border-l-rose-500",
    bar: "bg-rose-50 text-rose-900",
    iconWrap: "bg-rose-600 text-white",
    icon: XCircle,
    hint: "ทีมนี้ไม่มีสิทธิ์เข้าแข่งขัน ติดต่อเจ้าหน้าที่หากมีข้อสงสัย",
  },
};
export const DEFAULT_STATUS_META: StatusMeta = {
  border: "border-l-slate-400",
  bar: "bg-slate-50 text-slate-800",
  iconWrap: "bg-slate-400 text-white",
  icon: CircleDashed,
  hint: "ยังลงทะเบียนไม่เสร็จ",
};
