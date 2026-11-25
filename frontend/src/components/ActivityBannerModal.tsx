import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useGetHomeBannersQuery } from "../features/HomeConfig/homeBannersApi";

// ปิดแล้วไม่ขึ้นอีกจนถึงวันถัดไป (นับตามวันที่ในเครื่องผู้ใช้)
const STORAGE_KEY = "activityBannerClosedOn";

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

// ค่าที่บันทึก = "วันที่|ชุดรูป" ถ้าแอดมินเปลี่ยนรูปใน Popup ผู้ใช้ที่ปิดไปแล้วจะเห็นชุดใหม่ทันที
const readClosedSignature = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Popup แบนเนอร์กิจกรรม ใช้รูปจากเมนู "แบนเนอร์หน้าแรก" ที่เปิด "แสดงใน Popup"
 * preview: ใช้ในหน้าแอดมินเพื่อดูตัวอย่าง ไม่สนใจ/ไม่บันทึกสถานะ "ปิดแล้ววันนี้"
 */
const ActivityBannerModal = ({ preview = false, onClose }: { preview?: boolean; onClose?: () => void }) => {
  const { data: banners = [] } = useGetHomeBannersQuery();
  const active = useMemo(
    () => banners.filter((b) => b.showInPopup).sort((a, b) => a.sortOrder - b.sortOrder),
    [banners],
  );
  const [closedSignature] = useState(readClosedSignature);
  const [dismissed, setDismissed] = useState(false);
  const [current, setCurrent] = useState(0);

  const signature = `${today()}|${active.map((b) => `${b.id}:${b.imagePath}`).join(",")}`;
  const closedEarlier = !preview && closedSignature === signature;
  const open = !dismissed && !closedEarlier && active.length > 0;

  const close = () => {
    if (!preview) {
      try {
        localStorage.setItem(STORAGE_KEY, signature);
      } catch {
        // storage blocked: close for this visit only
      }
    }
    setDismissed(true);
    onClose?.();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setCurrent((i) => (i + 1) % active.length);
      if (e.key === "ArrowLeft") setCurrent((i) => (i - 1 + active.length) % active.length);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, active.length]);

  if (!open) return null;

  const baseUrl = (import.meta.env.VITE_API_BASE_URLS as string).replace(/\/$/, "");
  const banner = active[Math.min(current, active.length - 1)];
  const src = `${baseUrl}/${banner.imagePath.replace(/^\//, "")}`;
  const move = (dir: number) => setCurrent((i) => (i + dir + active.length) % active.length);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70" onClick={close} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="แบนเนอร์กิจกรรม"
        className="relative w-full max-w-3xl"
      >
        <button
          type="button"
          onClick={close}
          aria-label="ปิด"
          className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 z-10 w-10 h-10 rounded-full bg-white text-slate-700 shadow-lg flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl">
          <img
            src={src}
            alt={`แบนเนอร์กิจกรรม ${current + 1}`}
            className="block w-full max-h-[75vh] object-contain bg-slate-100"
          />

          {active.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="รูปก่อนหน้า"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-slate-700 shadow flex items-center justify-center hover:bg-white cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="รูปถัดไป"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-slate-700 shadow flex items-center justify-center hover:bg-white cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
                {active.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-label={`รูปที่ ${i + 1}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === current ? "w-6 bg-white" : "w-2 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={close}
            className="text-base text-white/90 underline underline-offset-4 hover:text-white cursor-pointer"
          >
            ปิด และไม่ต้องแสดงอีกวันนี้
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityBannerModal;
