import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loading } from "../../../components/Loading";
import {
  confirmDelete,
  showError,
  showSuccessOk,
} from "../../../utils/confirmDelete";
import { withAdminAuth } from "../../../HOC";
import { formatThaiDate } from "../../../utils";
import { useDeleteNewsMutation, useGetAllNewsQuery } from "../newsApi";
import type { News } from "../type";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  ExternalLink,
  Image as ImageIcon,
  Images,
  CalendarDays,
  Newspaper,
} from "lucide-react";

const NEW_DAYS = 7;
const PAGE_SIZE = 12;

// เนื้อหาเป็น HTML → ตัดแท็กเพื่อใช้เป็นข้อความตัวอย่าง
const toPlainText = (html?: string) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
};

const isNew = (date?: string) => {
  const d = date ? new Date(date) : null;
  return !!d && !isNaN(d.getTime()) && Date.now() - d.getTime() < NEW_DAYS * 86_400_000;
};

const imageUrl = (path: string) => `${import.meta.env.VITE_API_BASE_URLS}/${path}`;

const NewsList = () => {
  const navigate = useNavigate();
  const { data: news, isLoading } = useGetAllNewsQuery();
  const [deleteNews] = useDeleteNewsMutation();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // ข่าวล่าสุดก่อน
  const allItems = useMemo(
    () =>
      [...(news ?? [])]
        .sort((a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime())
        .map((n) => ({ ...n, excerpt: toPlainText(n.content) })),
    [news],
  );

  const q = query.trim().toLowerCase();
  const items = q
    ? allItems.filter((n) => `${n.title} ${n.excerpt}`.toLowerCase().includes(q))
    : allItems;
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [q]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (isLoading) return <Loading />;

  const newCount = allItems.filter((n) => isNew(n.datePublished)).length;
  const noCoverCount = allItems.filter((n) => !n.coverImagePath).length;

  const handleDelete = async (item: News) => {
    const isConfirmed = await confirmDelete(`ต้องการลบข่าว "${item.title}" ใช่หรือไม่?`);
    if (!isConfirmed) return;
    try {
      await deleteNews(item.id).unwrap();
      await showSuccessOk("ลบข่าวสำเร็จ!");
    } catch {
      await showError("ไม่สามารถลบข่าวได้");
    }
  };

  return (
    <div className="w-full font-sarabun space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-3 lg:mr-auto">
            <span className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Newspaper className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">ข่าวสาร</h1>
              <p className="text-sm sm:text-base text-slate-500">
                ทั้งหมด <b className="text-slate-700">{allItems.length}</b> ข่าว
                {newCount > 0 && <> · ใหม่ 7 วันนี้ <b className="text-rose-600">{newCount}</b></>}
                {noCoverCount > 0 && <> · ไม่มีภาพปก <b className="text-amber-600">{noCoverCount}</b></>}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <label className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาหัวข้อหรือเนื้อหาข่าว"
                aria-label="ค้นหาข่าว"
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-9 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-base font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
              onClick={() => navigate("/admin/news/new")}
            >
              <Plus className="w-5 h-5" />
              เพิ่มข่าวใหม่
            </button>
          </div>
        </div>
      </div>

      {/* Empty */}
      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white py-14 text-center">
          <Newspaper className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-lg font-bold text-slate-700">
            {q ? `ไม่พบข่าวที่ตรงกับ "${query}"` : "ยังไม่มีข่าวในระบบ"}
          </p>
          {!q && (
            <button
              onClick={() => navigate("/admin/news/new")}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              เขียนข่าวแรก
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
            {/* การ์ดเพิ่มข่าว (หน้าแรก ไม่ได้ค้นหา) */}
            {page === 1 && !q && (
              <button
                onClick={() => navigate("/admin/news/new")}
                className="hidden sm:flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-colors min-h-[280px] cursor-pointer"
              >
                <span className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Plus className="w-7 h-7" />
                </span>
                <span className="text-lg font-bold">เพิ่มข่าวใหม่</span>
              </button>
            )}

            {pageItems.map((item) => {
              const imgCount = item.contentImagePaths?.length ?? 0;
              return (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Cover → กดแล้วแก้ไข */}
                  <Link
                    to={`/admin/news/${item.id}/edit`}
                    className="relative aspect-video bg-slate-100 overflow-hidden"
                    title="แก้ไขข่าวนี้"
                  >
                    {item.coverImagePath ? (
                      <img
                        src={imageUrl(item.coverImagePath)}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center gap-1 text-amber-600 bg-amber-50">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-sm font-semibold">ยังไม่มีภาพปก</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {isNew(item.datePublished) && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-xs font-bold shadow">
                          ใหม่
                        </span>
                      )}
                    </div>
                    {imgCount > 0 && (
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs font-semibold">
                        <Images className="w-3.5 h-3.5" />
                        {imgCount}
                      </span>
                    )}
                  </Link>

                  {/* Body */}
                  <div className="flex-1 flex flex-col p-4">
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {item.datePublished ? formatThaiDate(item.datePublished) : "ไม่ระบุวันที่"}
                    </p>
                    <h2 className="font-bold text-slate-900 leading-snug line-clamp-2">{item.title}</h2>
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2 flex-1">
                      {item.excerpt || <span className="italic text-slate-400">ไม่มีเนื้อหา</span>}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 border-t border-slate-100 px-3 py-2.5">
                    <button
                      onClick={() => navigate(`/admin/news/${item.id}/edit`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                      แก้ไข
                    </button>
                    <a
                      href={`${import.meta.env.BASE_URL}news/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      title="ดูหน้าข่าวบนเว็บไซต์ (แท็บใหม่)"
                    >
                      <ExternalLink className="w-4 h-4" />
                      ดู
                    </a>
                    <button
                      onClick={() => handleDelete(item)}
                      className="inline-flex items-center justify-center rounded-lg p-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="ลบข่าว"
                      aria-label={`ลบข่าว ${item.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="เปลี่ยนหน้า" className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
              >
                ก่อนหน้า
              </button>
              <span className="px-3 text-sm text-slate-600">
                หน้า {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
              >
                ถัดไป
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default withAdminAuth(NewsList);
