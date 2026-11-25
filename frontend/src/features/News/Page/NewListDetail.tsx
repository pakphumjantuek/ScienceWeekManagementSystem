// src/features/news/NewListDetail.tsx
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { useGetAllNewsQuery, useGetNewsByIdQuery } from "../newsApi";
import {
  Calendar,
  ArrowLeft,
  Share2,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Link2,
  Check,
  X,
  MessageCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";

import { formatThaiDate, useDocumentTitle } from "../../../utils/dateUtils";
import { buildImageUrl } from "../../../utils/๊UrlImage";

export interface News {
  id: number;
  title: string;
  content: string;
  datePublished: string;
  coverImagePath: string | null;
  contentImagePaths: string[] | null;
}

const RELATED_COUNT = 3;

// ไอคอน X (Twitter) แบบ inline — lucide ไม่มีโลโก้ X
const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const NewListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // ----- Fetch -----
  const newsId = id ? Number(id) : NaN;
  const { data, isLoading, isError } = useGetNewsByIdQuery(newsId, {
    skip: !id || Number.isNaN(newsId),
  });
  const { data: allNews } = useGetAllNewsQuery();

  useDocumentTitle(data?.title ?? "ข่าวสาร");

  const cover = useMemo(
    () => (data?.coverImagePath ? buildImageUrl(data.coverImagePath) : ""),
    [data?.coverImagePath],
  );
  const gallery = useMemo(
    () => (data?.contentImagePaths ?? []).map((p) => buildImageUrl(p)).filter(Boolean) as string[],
    [data?.contentImagePaths],
  );
  const related = useMemo(
    () =>
      [...(allNews ?? [])]
        .filter((n) => n.id !== newsId)
        .sort((a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime())
        .slice(0, RELATED_COUNT),
    [allNews, newsId],
  );

  // Lightbox: ปุ่มลูกศร / Esc
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % gallery.length));
      if (e.key === "ArrowLeft")
        setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, gallery.length]);

  // เปิดลิงก์ตรง (เช่น จาก LINE) ไม่มีหน้าก่อนในเว็บ → กลับหน้ารายการข่าว
  const goBack = () => (location.key !== "default" ? navigate(-1) : navigate("/newsList"));

  if (!id || Number.isNaN(newsId) || isError || (!isLoading && !data)) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 pt-12">
          <div className="rounded-xl border border-red-200 bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="font-bold text-slate-900 text-lg">
              {isError ? "ไม่สามารถโหลดรายละเอียดข่าวได้" : "ไม่พบข่าวที่ต้องการ"}
            </h3>
            <p className="text-slate-600 mt-1">
              {isError
                ? "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง"
                : "ข่าวนี้อาจถูกลบแล้ว หรือลิงก์ไม่ถูกต้อง"}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              {isError && (
                <button
                  onClick={() => navigate(0)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  ลองใหม่
                </button>
              )}
              <Link
                to="/newsList"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับหน้าข่าว
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-10 py-10">
          <div className="animate-pulse space-y-6 rounded-2xl bg-white border border-slate-200 p-6 sm:p-10">
            <div className="aspect-video bg-slate-100 rounded-xl" />
            <div className="h-8 bg-slate-100 rounded w-11/12" />
            <div className="h-8 bg-slate-100 rounded w-3/5" />
            <div className="space-y-3 pt-4">
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-5/6" />
              <div className="h-4 bg-slate-100 rounded w-4/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pageUrl = window.location.href;
  const title = data.title ?? "ข่าวสาร";
  const openShare = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const shareToLine = () =>
    openShare(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}`);
  const shareToFacebook = () =>
    openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`);
  const shareToX = () =>
    openShare(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(title)}`,
    );
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("คัดลอกลิงก์นี้", pageUrl);
    }
  };
  // มือถือ: ใช้เมนูแชร์ของเครื่อง (รวม LINE ให้อัตโนมัติ)
  const nativeShare = async () => {
    try {
      await navigator.share({ title, url: pageUrl });
    } catch {
      // ผู้ใช้ยกเลิก
    }
  };
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const shareBtn =
    "inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer";

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 pb-16">
      {/* Breadcrumb (ไม่ sticky — ไม่ทับแถบเมนูหลัก) */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-10 py-3">
          <nav className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
            <button
              onClick={goBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </button>
            <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
            <Link to="/newsList" className="hover:text-blue-700 font-medium transition-colors shrink-0">
              ข่าวสาร
            </Link>
            <ChevronRight className="hidden sm:block h-4 w-4 text-slate-300 shrink-0" />
            <span className="hidden sm:block truncate text-slate-500">{title}</span>
          </nav>
        </div>
      </div>

      {/* Article (ความกว้างอ่านสบาย) */}
      <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-10 py-6 sm:py-10">
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {cover && (
            // ไม่ยืดภาพเกินขนาดจริง (ภาพเล็กจะแตก) และไม่ตัดขอบ — พื้นหลังเป็นภาพเดียวกันแบบเบลอ
            <figure className="relative flex justify-center overflow-hidden bg-slate-100 border-b border-slate-200">
              <img
                src={cover}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-40"
              />
              <img
                src={cover}
                alt={title}
                className="relative w-auto max-w-full max-h-[70vh] object-contain"
              />
            </figure>
          )}

          <div className="p-5 sm:p-10 lg:p-12">
            <header className="mb-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  {formatThaiDate(data.datePublished)}
                </span>
                {canNativeShare ? (
                  <button onClick={nativeShare} className={`${shareBtn} border-slate-200 text-slate-700 hover:bg-slate-50`}>
                    <Share2 className="h-4 w-4" />
                    แชร์
                  </button>
                ) : (
                  <button onClick={shareToLine} className={`${shareBtn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
                    <MessageCircle className="h-4 w-4" />
                    แชร์ LINE
                  </button>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-snug tracking-tight">
                {title}
              </h1>
            </header>

            {/* กรอง HTML ก่อนแสดง กันสคริปต์ที่แฝงมากับเนื้อหาข่าว */}
            <div className="prose prose-slate prose-base sm:prose-lg max-w-none">
              {data.content ? (
                /<[a-z][\s\S]*>/i.test(data.content) ? (
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.content) }} />
                ) : (
                  // ข่าวที่พิมพ์จากช่องข้อความธรรมดา: คงการขึ้นบรรทัดใหม่ไว้
                  <p className="whitespace-pre-line">{data.content}</p>
                )
              ) : (
                <p className="text-center py-10 text-slate-500">ไม่มีรายละเอียดเนื้อหา</p>
              )}
            </div>

            {/* Gallery → กดแล้วขยายในหน้าเดิม */}
            {gallery.length > 0 && (
              <section className="mt-12 pt-8 border-t border-slate-200">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                  รูปภาพประกอบ
                  <span className="text-base font-medium text-slate-500">({gallery.length})</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {gallery.map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      onClick={() => setLightbox(index)}
                      className="group overflow-hidden rounded-xl bg-slate-100 border border-slate-200 aspect-[4/3] cursor-zoom-in focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                      aria-label={`ขยายภาพประกอบ ${index + 1}`}
                    >
                      <img
                        src={src}
                        alt={`ภาพประกอบ ${index + 1}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Share row */}
            <div className="mt-10 pt-6 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-600 mb-3">แชร์ข่าวนี้</p>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <button onClick={shareToLine} className={`${shareBtn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
                  <MessageCircle className="h-4 w-4" />
                  LINE
                </button>
                <button onClick={shareToFacebook} className={`${shareBtn} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}>
                  <Facebook className="h-4 w-4" />
                  Facebook
                </button>
                <button onClick={shareToX} className={`${shareBtn} border-slate-200 bg-white text-slate-800 hover:bg-slate-50`}>
                  <XLogo className="h-3.5 w-3.5" />
                  X
                </button>
                <button
                  onClick={copyLink}
                  className={`${shareBtn} ${
                    copied
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                  {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Related news */}
      {related.length > 0 && (
        <section className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-10 mt-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">ข่าวอื่น ๆ</h2>
            <Link to="/newsList" className="text-base font-semibold text-blue-700 hover:underline shrink-0">
              ดูข่าวทั้งหมด
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {related.map((n) => {
              const img = buildImageUrl(n.coverImagePath);
              return (
                <Link
                  key={n.id}
                  to={`/news/${n.id}`}
                  className="group flex md:flex-col gap-3 md:gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-28 md:w-full shrink-0 aspect-[4/3] md:aspect-video bg-slate-100 overflow-hidden">
                    {img ? (
                      <img src={img} alt={n.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-300">
                        <ImageIcon size={32} />
                      </div>
                    )}
                  </div>
                  <div className="py-3 pr-3 md:p-4 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">{formatThaiDate(n.datePublished)}</p>
                    <h3 className="line-clamp-2 font-bold leading-snug group-hover:text-blue-700 transition-colors">
                      {n.title}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightbox !== null && gallery[lightbox] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ภาพประกอบ"
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-3 sm:p-8"
          onClick={() => setLightbox(null)}
        >
          <img
            src={gallery[lightbox]}
            alt={`ภาพประกอบ ${lightbox + 1}`}
            className="max-h-full max-w-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            aria-label="ปิด"
            className="absolute top-3 right-3 p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
          {gallery.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((lightbox - 1 + gallery.length) % gallery.length);
                }}
                aria-label="ภาพก่อนหน้า"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((lightbox + 1) % gallery.length);
                }}
                aria-label="ภาพถัดไป"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
                {lightbox + 1} / {gallery.length}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NewListDetail;
