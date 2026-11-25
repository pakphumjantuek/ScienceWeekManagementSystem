import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import {
  ArrowLeft,
  Save,
  Upload,
  Image as ImageIcon,
  Images,
  X,
  RotateCcw,
  CalendarDays,
  Info,
} from "lucide-react";
import { useAddNewsMutation, useGetAllNewsQuery, useUpdateNewsMutation } from "../newsApi";
import type { News } from "../type";
import { showError, showSuccessOk } from "../../../utils/confirmDelete";
import { formatThaiDate } from "../../../utils";
import { TextArea, TextInput } from "../../../components/Inputs";
import { withAdminAuth } from "../../../HOC";
import { Loading } from "../../../components/Loading";

const TITLE_MAX = 150;

const NewsSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .required("กรุณากรอกหัวข้อข่าว")
    .min(3, "หัวข้อข่าวต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(TITLE_MAX, `หัวข้อข่าวยาวได้ไม่เกิน ${TITLE_MAX} ตัวอักษร`),
  content: Yup.string().nullable(),
});

type FormValues = {
  title: string;
  content: string;
  coverFile: File | null;
  contentFiles: File[];
};

const ASSET_ORIGIN = ((): string => {
  try {
    return new URL(import.meta.env.VITE_API_BASE_URLS, window.location.origin).origin;
  } catch {
    return import.meta.env.VITE_API_BASE_URLS ?? "";
  }
})();

const buildImageUrl = (p?: string | null) =>
  p ? `${ASSET_ORIGIN}/${p.replace(/^\//, "")}` : "";

const card = "bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm";
const cardTitle = "text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2";

function NewsFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const newsId = id ? Number(id) : null;

  const { data: newsList, isLoading: isFetchingNews } = useGetAllNewsQuery();
  const [addNews, { isLoading: isAdding }] = useAddNewsMutation();
  const [updateNews, { isLoading: isUpdating }] = useUpdateNewsMutation();

  const currentNews: News | undefined = useMemo(() => {
    if (!newsId || !newsList) return undefined;
    return newsList.find((n: News) => n.id === newsId);
  }, [newsId, newsList]);

  // พรีวิวรูปภาพ
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [contentPreviews, setContentPreviews] = useState<string[]>([]);
  const [toRemove, setToRemove] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      contentPreviews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [coverPreview, contentPreviews]);

  if (newsId && isFetchingNews) {
    return <Loading />;
  }

  const initialValues: FormValues = {
    title: currentNews?.title ?? "",
    content: currentNews?.content ?? "",
    coverFile: null,
    contentFiles: [],
  };

  // วันที่ลงประกาศ: ข่าวใหม่ = วันเวลาที่กดบันทึก, แก้ไข = คงวันเดิม
  const datePublishedIso = () =>
    currentNews?.datePublished
      ? new Date(currentNews.datePublished).toISOString()
      : new Date().toISOString();

  const buildCreateFormData = (v: FormValues) => {
    const fd = new FormData();
    fd.append("Title", v.title.trim());
    fd.append("Content", v.content ?? "");
    fd.append("DatePublished", datePublishedIso());
    if (v.coverFile) fd.append("CoverImage", v.coverFile);
    for (const f of v.contentFiles) fd.append("ContentImages", f);
    return fd;
  };

  const buildUpdateFormData = (v: FormValues) => {
    const fd = new FormData();
    fd.append("Title", v.title.trim());
    fd.append("Content", v.content ?? "");
    fd.append("DatePublished", datePublishedIso());
    if (v.coverFile) fd.append("NewCoverImage", v.coverFile);
    for (const f of v.contentFiles) fd.append("NewContentImages", f);
    for (const p of toRemove) fd.append("RemoveContentImagePaths", p);
    return fd;
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      if (currentNews) {
        await updateNews({ id: currentNews.id!, formData: buildUpdateFormData(values) }).unwrap();
        await showSuccessOk("บันทึกการแก้ไขเรียบร้อยแล้ว");
      } else {
        await addNews(buildCreateFormData(values)).unwrap();
        await showSuccessOk("ลงข่าวใหม่เรียบร้อยแล้ว");
      }
      navigate("/admin/news");
    } catch (error: any) {
      await showError(
        error?.data?.errorMessages?.[0] ?? "ไม่สามารถบันทึกข่าวได้ กรุณาลองใหม่อีกครั้ง",
      );
    }
  };

  const toggleRemove = (path: string) =>
    setToRemove((prev) => (prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]));

  const isSaving = isAdding || isUpdating;
  const oldImages = currentNews?.contentImagePaths ?? [];
  const existingCover = buildImageUrl(currentNews?.coverImagePath);

  return (
    <div className="font-sans pb-6">
      <div className="mx-auto max-w-[1920px] space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/news")}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            title="กลับไปหน้าข่าวสาร"
            aria-label="กลับไปหน้าข่าวสาร"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
              {currentNews ? "แก้ไขข่าว" : "ลงข่าวใหม่"}
            </h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {currentNews
                ? `ลงประกาศเมื่อ ${formatThaiDate(currentNews.datePublished)}`
                : "วันที่ลงประกาศจะเป็นวันที่กดบันทึก"}
            </p>
          </div>
        </div>

        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={NewsSchema}
          onSubmit={handleSubmit}
        >
          {({ setFieldValue, values }) => {
            const removeNewImage = (index: number) => {
              URL.revokeObjectURL(contentPreviews[index]);
              setContentPreviews((prev) => prev.filter((_, i) => i !== index));
              setFieldValue(
                "contentFiles",
                values.contentFiles.filter((_, i) => i !== index),
              );
            };
            const keptOld = oldImages.length - toRemove.length;
            const totalImages = keptOld + contentPreviews.length;

            return (
              <Form className="space-y-5" encType="multipart/form-data">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* ===== Left: text ===== */}
                  <div className="lg:col-span-2 space-y-5">
                    <section className={`${card} space-y-5`}>
                      <div>
                        <TextInput
                          name="title"
                          label="หัวข้อข่าว *"
                          placeholder="เช่น ประกาศรายชื่อผู้มีสิทธิ์เข้าแข่งขัน ปี 2569"
                        />
                        <p
                          className={`mt-1 text-right text-xs ${
                            values.title.length > TITLE_MAX ? "text-rose-600" : "text-slate-400"
                          }`}
                        >
                          {values.title.length}/{TITLE_MAX}
                        </p>
                      </div>

                      <div>
                        <TextArea
                          name="content"
                          label="เนื้อหาข่าว"
                          placeholder={"พิมพ์รายละเอียดข่าว\nกด Enter เพื่อขึ้นบรรทัดใหม่ได้ตามปกติ"}
                          rows={14}
                        />
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Info className="w-3.5 h-3.5" />
                          การขึ้นบรรทัดใหม่จะแสดงบนหน้าเว็บตามที่พิมพ์
                        </p>
                      </div>
                    </section>
                  </div>

                  {/* ===== Right: images ===== */}
                  <div className="space-y-5">
                    {/* Cover */}
                    <section className={`${card} space-y-3`}>
                      <h2 className={cardTitle}>
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        ภาพปก
                      </h2>
                      <label className="group relative block aspect-video rounded-xl overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 hover:border-blue-400 cursor-pointer transition-colors">
                        {coverPreview || existingCover ? (
                          <>
                            <img
                              src={coverPreview ?? existingCover}
                              alt="ภาพปกข่าว"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                              <Upload className="w-5 h-5" />
                              เปลี่ยนภาพปก
                            </span>
                          </>
                        ) : (
                          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-500">
                            <Upload className="w-8 h-8 text-blue-500" />
                            <span className="font-semibold">กดเพื่อเลือกภาพปก</span>
                            <span className="text-xs text-slate-400">แนะนำแนวนอน กว้าง 1200px ขึ้นไป</span>
                          </span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.currentTarget.files?.[0] ?? null;
                            setFieldValue("coverFile", f);
                            if (coverPreview) URL.revokeObjectURL(coverPreview);
                            setCoverPreview(f ? URL.createObjectURL(f) : null);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                      {coverPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(coverPreview);
                            setCoverPreview(null);
                            setFieldValue("coverFile", null);
                          }}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-rose-600 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          {existingCover ? "ใช้ภาพปกเดิม" : "เอาภาพที่เลือกออก"}
                        </button>
                      )}
                    </section>

                    {/* Content images */}
                    <section className={`${card} space-y-3`}>
                      <h2 className={cardTitle}>
                        <Images className="w-5 h-5 text-blue-600" />
                        รูปภาพประกอบ
                        {totalImages > 0 && (
                          <span className="text-sm font-medium text-slate-500">({totalImages} รูป)</span>
                        )}
                      </h2>

                      {(oldImages.length > 0 || contentPreviews.length > 0) && (
                        <div className="grid grid-cols-3 gap-2">
                          {oldImages.map((p) => {
                            const marked = toRemove.includes(p);
                            return (
                              <div
                                key={p}
                                className={`relative aspect-square rounded-lg overflow-hidden border ${
                                  marked ? "border-rose-300" : "border-slate-200"
                                }`}
                              >
                                <img
                                  src={buildImageUrl(p)}
                                  alt=""
                                  className={`w-full h-full object-cover ${marked ? "opacity-30 grayscale" : ""}`}
                                />
                                {marked && (
                                  <span className="absolute inset-x-0 bottom-0 bg-rose-600 text-white text-[10px] font-bold text-center py-0.5">
                                    จะถูกลบ
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => toggleRemove(p)}
                                  aria-label={marked ? "ยกเลิกการลบรูป" : "ลบรูป"}
                                  title={marked ? "ยกเลิกการลบ" : "ลบรูปนี้"}
                                  className={`absolute top-1 right-1 p-1 rounded-full shadow cursor-pointer ${
                                    marked ? "bg-white text-slate-700" : "bg-rose-600 text-white"
                                  }`}
                                >
                                  {marked ? <RotateCcw className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            );
                          })}
                          {contentPreviews.map((src, i) => (
                            <div
                              key={src}
                              className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-300"
                            >
                              <img src={src} alt="" className="w-full h-full object-cover" />
                              <span className="absolute inset-x-0 bottom-0 bg-blue-600 text-white text-[10px] font-bold text-center py-0.5">
                                ใหม่
                              </span>
                              <button
                                type="button"
                                onClick={() => removeNewImage(i)}
                                aria-label="เอารูปนี้ออก"
                                className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <label className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 text-slate-700 font-semibold text-sm cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 text-blue-600" />
                        เพิ่มรูปประกอบ (เลือกได้หลายรูป)
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={(e) => {
                            // เพิ่มต่อจากที่เลือกไว้ ไม่แทนที่ของเดิม
                            const files = Array.from(e.currentTarget.files ?? []);
                            setFieldValue("contentFiles", [...values.contentFiles, ...files]);
                            setContentPreviews((prev) => [
                              ...prev,
                              ...files.map((f) => URL.createObjectURL(f)),
                            ]);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                      <p className="text-xs text-slate-500">กด ✕ ที่มุมรูปเพื่อลบ · รูปจะแสดงท้ายข่าว และกดขยายดูได้</p>
                    </section>
                  </div>
                </div>

                {/* Actions (ติดล่างเฉพาะพื้นที่เนื้อหา ไม่ทับเมนูด้านข้าง) */}
                <div className="sticky bottom-0 z-20 -mx-4 sm:mx-0 border-t sm:border sm:rounded-2xl border-slate-200 bg-white/95 backdrop-blur px-4 py-3 flex flex-col-reverse sm:flex-row sm:items-center gap-2">
                  {toRemove.length > 0 && (
                    <p className="text-sm text-rose-600 sm:mr-auto">จะลบรูปประกอบ {toRemove.length} รูปเมื่อบันทึก</p>
                  )}
                  <div className="flex gap-2 sm:ml-auto">
                    <button
                      type="button"
                      onClick={() => navigate("/admin/news")}
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-5 h-5" />
                      {isSaving ? "กำลังบันทึก..." : currentNews ? "บันทึกการแก้ไข" : "ลงข่าว"}
                    </button>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}

export default withAdminAuth(NewsFormPage);
