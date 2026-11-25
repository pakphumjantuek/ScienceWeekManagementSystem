import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Loader2, Printer, X } from "lucide-react";

/**
 * แสดง PDF ในหน้าต่างบนหน้าเดิม พร้อมปุ่มพิมพ์ / ดาวน์โหลด / เปิดแท็บใหม่
 * load: ฟังก์ชันที่คืน Blob ของ PDF (เรียกครั้งเดียวตอนเปิด)
 */
const PdfPreviewModal = ({
  title,
  fileName,
  load,
  onClose,
}: {
  title: string;
  fileName: string;
  load: () => Promise<Blob>;
  onClose: () => void;
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    load()
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
        setUrl(objectUrl);
      })
      .catch((e: Error) => !cancelled && setError(e.message || "โหลดรายงานไม่สำเร็จ"));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // โหลดครั้งเดียวตอนเปิดหน้าต่าง
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const handlePrint = () => {
    try {
      frameRef.current?.contentWindow?.focus();
      frameRef.current?.contentWindow?.print();
    } catch {
      // บางเบราว์เซอร์ (เช่นมือถือ) สั่งพิมพ์ใน iframe ไม่ได้ → เปิดแท็บใหม่ให้พิมพ์เอง
      if (url) window.open(url, "_blank");
    }
  };

  const btn =
    "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-2 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <p className="min-w-0 truncate font-semibold text-slate-800">{title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handlePrint} disabled={!url} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>
              <Printer className="h-4 w-4" /> พิมพ์
            </button>
            <a
              href={url ?? undefined}
              download={fileName}
              aria-disabled={!url}
              className={`${btn} border border-slate-200 text-slate-700 hover:bg-slate-100 ${url ? "" : "pointer-events-none opacity-50"}`}
            >
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">ดาวน์โหลด</span>
            </a>
            <a
              href={url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              title="เปิดในแท็บใหม่"
              className={`${btn} border border-slate-200 text-slate-700 hover:bg-slate-100 ${url ? "" : "pointer-events-none opacity-50"}`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 bg-slate-100">
          {error ? (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <p className="font-semibold text-slate-700">โหลดรายงานไม่สำเร็จ</p>
                <p className="mt-1 text-sm text-slate-500">{error}</p>
              </div>
            </div>
          ) : !url ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              กำลังสร้างรายงาน...
            </div>
          ) : (
            <iframe ref={frameRef} src={url} title={title} className="h-full w-full" />
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
