import { CheckCircle2, ExternalLink, X } from "lucide-react";
import { adminManualUrl as fileUrl } from "./AdminManualButton";

export type LineGroup = {
  lineGroupUrl?: string | null;
  lineQrPath?: string | null;
  lineNote?: string | null;
};

/**
 * Popup กลุ่มไลน์ของหลักสูตร (ตั้งค่าที่หน้าแก้ไขหลักสูตร)
 * - justRegistered: แสดงหัวข้อ "ลงทะเบียนสำเร็จ" หลังกดสมัคร
 * - qrSrc: ใช้แทน lineQrPath (เช่น ตัวอย่างรูปที่ยังไม่ได้อัปโหลดในหน้าแอดมิน)
 */
const TrainingLineModal = ({
  topicName,
  group,
  qrSrc,
  justRegistered = false,
  onClose,
}: {
  topicName: string;
  group: LineGroup;
  qrSrc?: string | null;
  justRegistered?: boolean;
  onClose: () => void;
}) => {
  const qr = qrSrc ?? (group.lineQrPath ? fileUrl(group.lineQrPath) : null);
  const url = group.lineGroupUrl;
  const note = group.lineNote;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="เข้ากลุ่มไลน์ของหลักสูตร"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[95vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          autoFocus
          className="absolute right-3 top-3 rounded-full p-2 text-white/90 transition hover:bg-white/20 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-[#06C755] px-6 pb-5 pt-6 text-white">
          {justRegistered && (
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              ลงทะเบียนสำเร็จ
            </p>
          )}
          <p className="text-2xl font-bold">เข้ากลุ่มไลน์ของหลักสูตร</p>
          <p className="mt-1 text-sm text-white/90 line-clamp-2">{topicName}</p>
        </div>

        <div className="space-y-4 p-6">
          {qr && (
            <div className="mx-auto w-full max-w-[280px] rounded-2xl border border-slate-200 p-3">
              <img src={qr} alt="QR Code กลุ่มไลน์" className="aspect-square w-full object-contain" />
            </div>
          )}
          {note && <p className="text-base text-slate-700">{note}</p>}

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3.5 text-base font-bold text-white transition hover:brightness-95"
            >
              เปิด LINE เข้ากลุ่ม
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer"
          >
            ไว้ภายหลัง
          </button>
          {justRegistered && <p className="text-xs text-slate-400">เปิดดูอีกครั้งได้ที่หน้า “การอบรมของฉัน”</p>}
        </div>
      </div>
    </div>
  );
};

export const hasLineContent = (g?: LineGroup | null) => !!(g?.lineGroupUrl || g?.lineQrPath);

export default TrainingLineModal;
