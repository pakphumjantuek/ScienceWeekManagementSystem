import { useState } from "react";
import {
  Trash2,
  Upload,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  X,
  Eye,
  Layers,
  MessageSquare,
  Monitor,
} from "lucide-react";
import { withAdminAuth } from "../../../HOC";
import ActivityBannerModal from "../../../components/ActivityBannerModal";
import {
  useAddHomeBannerMutation,
  useDeleteHomeBannerMutation,
  useGetHomeBannersQuery,
  useUpdateHomeBannerMutation,
  type HomeBanner,
} from "../homeBannersApi";
import { confirmDelete, showError, showSuccessOk } from "../../../utils/confirmDelete";

/** สวิตช์เปิด/ปิด พร้อมป้ายชื่อ */
function Toggle({
  checked,
  onChange,
  label,
  icon,
  color,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  icon: React.ReactNode;
  color: "emerald" | "violet";
}) {
  const on = color === "emerald" ? "bg-emerald-500" : "bg-violet-600";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon}
        {label}
      </span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? on : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function HomeBannersPage() {
  const { data: banners = [], isLoading: isLoadingList } = useGetHomeBannersQuery();
  const [addBanner, { isLoading }] = useAddHomeBannerMutation();
  const [updateBanner] = useUpdateHomeBannerMutation();
  const [deleteBanner] = useDeleteHomeBannerMutation();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const baseUrl = (import.meta.env.VITE_API_BASE_URLS as string).replace(/\/$/, "");

  // เรียงลำดับแบนเนอร์ตาม sortOrder
  const sortedBanners = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeCount = banners.filter((b) => b.isActive).length;
  const popupCount = banners.filter((b) => b.showInPopup).length;

  const handleSelectFile = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setPreview("");
      return;
    }
    if (!selectedFile.type.startsWith("image/")) {
      showError("กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)");
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      const form = new FormData();
      form.append("Image", file);
      form.append("SortOrder", String(banners.length + 1));
      form.append("IsActive", "true");

      await addBanner(form).unwrap();
      setFile(null);
      setPreview("");
      await showSuccessOk("เพิ่มแบนเนอร์เรียบร้อยแล้ว");
    } catch {
      await showError("ไม่สามารถเพิ่มแบนเนอร์ได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete("คุณแน่ใจหรือไม่ว่าต้องการลบแบนเนอร์นี้?");
    if (!confirmed) return;

    try {
      await deleteBanner(id).unwrap();
      await showSuccessOk("ลบแบนเนอร์สำเร็จ");
    } catch {
      await showError("ไม่สามารถลบแบนเนอร์ได้");
    }
  };

  // สวิตช์เห็นผลทันทีจากสถานะ จึงแจ้งเฉพาะตอนผิดพลาด
  const handleToggle = async (banner: HomeBanner, field: "isActive" | "showInPopup") => {
    try {
      await updateBanner({ ...banner, [field]: !banner[field] }).unwrap();
    } catch {
      await showError("ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedBanners.length) return;

    const currentBanner = sortedBanners[index];
    const targetBanner = sortedBanners[targetIndex];

    try {
      await Promise.all([
        updateBanner({ ...currentBanner, sortOrder: targetBanner.sortOrder }).unwrap(),
        updateBanner({ ...targetBanner, sortOrder: currentBanner.sortOrder }).unwrap(),
      ]);
    } catch {
      await showError("ไม่สามารถเปลี่ยนลำดับได้");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {showPreview && <ActivityBannerModal preview onClose={() => setShowPreview(false)} />}

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold">จัดการแบนเนอร์ประชาสัมพันธ์</h1>
              <p className="text-sm text-slate-500">
                อัปโหลดรูป เลือกให้แสดงบนสไลด์หน้าแรก และ/หรือ เด้งเป็น Popup ตอนเข้าเว็บ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium">
              ทั้งหมด <b>{banners.length}</b>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 px-3 py-1.5 text-sm font-medium">
              <Monitor className="w-4 h-4" /> หน้าแรก <b>{activeCount}</b>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 text-violet-800 px-3 py-1.5 text-sm font-medium">
              <MessageSquare className="w-4 h-4" /> Popup <b>{popupCount}</b>
            </span>
            <button
              type="button"
              onClick={() =>
                popupCount > 0
                  ? setShowPreview(true)
                  : showError('ยังไม่มีรูปที่เปิด "แสดงใน Popup"')
              }
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              ดูตัวอย่าง Popup
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 grid gap-6 xl:grid-cols-[380px_1fr] items-start">
        {/* ===== Upload panel (sticky on wide screens) ===== */}
        <section className="xl:sticky xl:top-6 rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
            <Upload className="w-5 h-5 text-blue-600" />
            เพิ่มแบนเนอร์ใหม่
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            แนะนำรูปแนวนอน 16:9 หรือ 21:8 · JPG, PNG, WEBP ไม่เกิน 5MB
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative rounded-xl border-2 border-dashed text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 bg-slate-50 hover:border-blue-400"
              } ${preview ? "p-2" : "p-6"}`}
            >
              {!preview && (
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleSelectFile(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              )}

              {!preview ? (
                <>
                  <span className="mx-auto mb-2 w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6" />
                  </span>
                  <p className="font-semibold text-slate-800">คลิกเพื่อเลือกรูป</p>
                  <p className="text-sm text-slate-500">หรือลากรูปมาวางที่นี่</p>
                </>
              ) : (
                <div className="relative">
                  <img
                    src={preview}
                    alt="ตัวอย่างรูปที่เลือก"
                    className="w-full max-h-56 object-contain rounded-lg bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleSelectFile(null)}
                    className="absolute top-2 right-2 bg-slate-900/80 text-white p-1.5 rounded-full hover:bg-rose-600 transition-colors cursor-pointer"
                    title="ยกเลิกการเลือกรูป"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="mt-2 text-xs text-slate-500 truncate">
                    {file?.name} · {(file ? file.size / (1024 * 1024) : 0).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              {isLoading ? "กำลังอัปโหลด..." : "อัปโหลดแบนเนอร์"}
            </button>
            <p className="text-xs text-slate-500">
              รูปใหม่จะแสดงบนหน้าแรกทันที แต่ยังไม่ขึ้น Popup จนกว่าจะเปิดสวิตช์
            </p>
          </form>
        </section>

        {/* ===== Banner list ===== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">รายการแบนเนอร์</h2>
            <span className="text-sm text-slate-500">ลำดับเดียวกับที่แสดงบนหน้าเว็บ</span>
          </div>

          {isLoadingList ? (
            <div className="rounded-2xl bg-white border border-slate-200 py-16 text-center text-slate-500">
              กำลังโหลด...
            </div>
          ) : sortedBanners.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 py-16 text-center">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">ยังไม่มีแบนเนอร์</p>
              <p className="text-sm text-slate-500 mt-1">อัปโหลดรูปแรกจากกล่องด้านซ้าย</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              {sortedBanners.map((banner, index) => {
                const imageUrl = `${baseUrl}/${banner.imagePath.replace(/^\//, "")}`;
                const hidden = !banner.isActive && !banner.showInPopup;
                return (
                  <article
                    key={banner.id}
                    className={`flex flex-col rounded-2xl bg-white border overflow-hidden ${
                      hidden ? "border-slate-200 opacity-70" : "border-slate-200"
                    }`}
                  >
                    <div className="relative aspect-[16/8] bg-slate-100">
                      <img
                        src={imageUrl}
                        alt={`แบนเนอร์ลำดับ ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute top-2 left-2 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-white">
                        ลำดับ {index + 1}
                      </span>
                      {hidden && (
                        <span className="absolute top-2 right-2 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">
                          ซ่อนอยู่ทั้งหมด
                        </span>
                      )}
                    </div>

                    <div className="p-2 border-b border-slate-100">
                      <Toggle
                        checked={banner.isActive}
                        onChange={() => handleToggle(banner, "isActive")}
                        label="แสดงบนสไลด์หน้าแรก"
                        icon={<Monitor className="w-4 h-4 text-emerald-600" />}
                        color="emerald"
                      />
                      <Toggle
                        checked={banner.showInPopup}
                        onChange={() => handleToggle(banner, "showInPopup")}
                        label="แสดงใน Popup ตอนเข้าเว็บ"
                        icon={<MessageSquare className="w-4 h-4 text-violet-600" />}
                        color="violet"
                      />
                    </div>

                    <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(index, "up")}
                          disabled={index === 0}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title="เลื่อนขึ้น"
                          aria-label="เลื่อนขึ้น"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(index, "down")}
                          disabled={index === sortedBanners.length - 1}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title="เลื่อนลง"
                          aria-label="เลื่อนลง"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(banner.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        ลบ
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default withAdminAuth(HomeBannersPage);
