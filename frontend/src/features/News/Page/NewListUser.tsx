import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, CalendarDays, FileText, Image as ImageIcon, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useGetAllNewsQuery } from "../newsApi";
import { formatThaiDate, useDocumentTitle } from "../../../utils/dateUtils";
import { buildImageUrl } from "../../../utils/๊UrlImage";

const PAGE_SIZE = 9; // หน้าแรก: ข่าวเด่น 1 + การ์ด 8 (เต็ม 2 แถวบนจอกว้าง 4 คอลัมน์)
const NEW_DAYS = 7;

// เนื้อหาข่าวเป็น HTML → ตัดแท็กออกเพื่อใช้เป็นข้อความตัวอย่าง
const toPlainText = (html?: string) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
};

const isNew = (date?: string) => {
  const d = date ? new Date(date) : null;
  return !!d && !isNaN(d.getTime()) && Date.now() - d.getTime() < NEW_DAYS * 86_400_000;
};

const NewBadge = () => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">
    ใหม่
  </span>
);

export default function NewsShowcase() {
  useDocumentTitle("ประกาศและอัปเดตข่าวสาร");
  const { data, isLoading, isError } = useGetAllNewsQuery();
  const [query, setQuery] = useState("");

  // เรียงข่าวล่าสุดก่อน + เตรียมข้อความตัวอย่างไว้ครั้งเดียว
  const allItems = useMemo(
    () =>
      [...(data ?? [])]
        .sort((a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime())
        .map((n) => ({ ...n, excerpt: toPlainText(n.content) })),
    [data],
  );
  const q = query.trim().toLowerCase();
  const items = q
    ? allItems.filter((n) => `${n.title} ${n.excerpt}`.toLowerCase().includes(q))
    : allItems;

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);
  useEffect(() => setPage(1), [q]);

  const start = (page - 1) * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);
  // ข่าวเด่นเฉพาะหน้าแรกและไม่ได้ค้นหา
  const featured = page === 1 && !q ? pageItems[0] : undefined;
  const rest = featured ? pageItems.slice(1) : pageItems;

  const topRef = useRef<HTMLDivElement | null>(null);
  const gotoPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    if (next !== page) {
      setPage(next);
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  };

  const Skeleton = ({ tall = false }: { tall?: boolean }) => (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className={`${tall ? "aspect-video lg:aspect-[21/9]" : "aspect-video"} animate-pulse bg-slate-100`} />
      <div className="p-6 space-y-3">
        <div className="h-5 w-2/3 rounded bg-slate-100" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-5/6 rounded bg-slate-100" />
      </div>
    </div>
  );

  const PaginationBar = () => {
    // แบบ compact: [1] … [p-1, p, p+1] … [last]
    const neighbors = [page - 1, page, page + 1].filter((n) => n >= 1 && n <= totalPages);

    const pagesToShow: (number | string)[] = [];
    if (!neighbors.includes(1)) {
      pagesToShow.push(1);
      if (neighbors[0] && neighbors[0] > 2) pagesToShow.push("...");
    }
    pagesToShow.push(...neighbors);
    if (!neighbors.includes(totalPages)) {
      if (neighbors[neighbors.length - 1] && neighbors[neighbors.length - 1] < totalPages - 1) {
        pagesToShow.push("...");
      }
      pagesToShow.push(totalPages);
    }

    const btn =
      "px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-base font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm cursor-pointer";

    return (
      <nav aria-label="เปลี่ยนหน้า" className="mt-10 flex items-center justify-center gap-2">
        <button onClick={() => gotoPage(page - 1)} disabled={page === 1} className={btn}>
          ก่อนหน้า
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pagesToShow.map((p, i) =>
            typeof p === "number" ? (
              <button
                key={`${p}-${i}`}
                onClick={() => gotoPage(p)}
                className={`min-w-[44px] px-3 py-2.5 rounded-lg border text-base font-medium transition-colors shadow-sm cursor-pointer ${
                  p === page
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            ) : (
              <span key={`dots-${i}`} className="px-2 text-slate-500 select-none">
                …
              </span>
            ),
          )}
        </div>

        <span className="sm:hidden px-3 text-sm text-slate-600 font-medium">
          หน้า {page} / {totalPages}
        </span>

        <button onClick={() => gotoPage(page + 1)} disabled={page === totalPages} className={btn}>
          ถัดไป
        </button>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      {/* Header (เหมือนหน้าอื่น) */}
      <header className="border-b border-slate-200 bg-white" ref={topRef}>
        <div className="flex h-1.5">
          <span className="flex-1 bg-blue-600" />
          <span className="flex-1 bg-emerald-500" />
          <span className="flex-1 bg-amber-500" />
          <span className="flex-1 bg-rose-500" />
        </div>
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 py-6 md:py-10 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            ประกาศและข่าวสาร
          </h1>
          <p className="mt-2 text-base md:text-lg text-slate-500">
            ติดตามข่าวล่าสุดจากงานสัปดาห์วิทยาศาสตร์และการแข่งขัน
          </p>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 mt-5 sm:mt-6 space-y-6">
        {/* Search */}
        {!isLoading && !isError && allItems.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาข่าว เช่น ประกาศผล, เลื่อน, อบรม"
                aria-label="ค้นหาข่าว"
                className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-10 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <span className="text-sm text-slate-500 shrink-0">
              {q ? `พบ ${items.length} จาก ${allItems.length} ข่าว` : `ทั้งหมด ${allItems.length} ข่าว`}
            </span>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-6">
            <Skeleton tall />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 md:gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center max-w-2xl mx-auto">
            <p className="text-red-700 font-bold text-lg mb-2">ไม่สามารถโหลดข้อมูลประกาศได้</p>
            <p className="text-red-600">เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้งในภายหลัง</p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && (
          <>
            {items.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="mx-auto mb-5 h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  {q ? <Search size={36} /> : <FileText size={40} />}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {q ? `ไม่พบข่าวที่ตรงกับ "${query}"` : "ยังไม่มีประกาศให้แสดงในขณะนี้"}
                </h3>
                <p className="text-slate-500">
                  {q ? "ลองใช้คำค้นอื่น" : "กรุณาติดตามอัปเดตข่าวสารเร็ว ๆ นี้"}
                </p>
              </div>
            ) : (
              <>
                {/* ข่าวเด่น (เฉพาะหน้าแรก) */}
                {featured && (
                  <Link
                    to={`/news/${featured.id}`}
                    className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-shadow"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      <div className="relative aspect-video lg:aspect-auto lg:h-full bg-slate-100 overflow-hidden">
                        {buildImageUrl(featured.coverImagePath) ? (
                          <img
                            src={buildImageUrl(featured.coverImagePath)}
                            alt={featured.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300 bg-slate-50">
                            <ImageIcon size={64} />
                          </div>
                        )}
                      </div>

                      <div className="p-5 sm:p-8 lg:p-10 flex flex-col justify-center">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                            <CalendarDays className="h-4 w-4" />
                            {formatThaiDate(featured.datePublished)}
                          </span>
                          {isNew(featured.datePublished) && <NewBadge />}
                        </div>
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-snug mb-3 line-clamp-3 group-hover:text-blue-700 transition-colors">
                          {featured.title}
                        </h2>
                        <p className="text-slate-600 text-base sm:text-lg leading-relaxed line-clamp-3 mb-6">
                          {featured.excerpt}
                        </p>
                        <span className="mt-auto inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold text-white group-hover:bg-blue-700 transition-colors">
                          อ่านข่าวฉบับเต็ม
                          <ChevronRight className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                )}

                {/* การ์ดข่าว */}
                {rest.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 md:gap-6">
                    {rest.map((item) => {
                      const cover = buildImageUrl(item.coverImagePath);
                      return (
                        <Link
                          key={item.id}
                          to={`/news/${item.id}`}
                          className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-shadow"
                        >
                          <div className="relative aspect-video bg-slate-100 overflow-hidden">
                            {cover ? (
                              <img
                                src={cover}
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300 bg-slate-50">
                                <ImageIcon size={48} />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col flex-grow p-5">
                            <div className="mb-2.5 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {formatThaiDate(item.datePublished)}
                              </span>
                              {isNew(item.datePublished) && <NewBadge />}
                            </div>
                            <h3 className="line-clamp-2 text-lg sm:text-xl font-bold text-slate-900 leading-snug mb-2 group-hover:text-blue-700 transition-colors">
                              {item.title}
                            </h3>
                            <p className="line-clamp-3 text-sm sm:text-base text-slate-600 leading-relaxed mb-4 flex-grow">
                              {item.excerpt}
                            </p>
                            <span className="inline-flex items-center font-semibold text-blue-700 mt-auto">
                              อ่านรายละเอียด
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {totalPages > 1 && <PaginationBar />}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
