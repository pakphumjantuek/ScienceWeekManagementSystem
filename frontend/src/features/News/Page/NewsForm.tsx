import { useAddNewsMutation, useUpdateNewsMutation } from "../newsApi";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { showError, showSuccessOk } from "../../../utils/confirmDelete";
import type { News } from "../type";
import { useModal } from "../../../components/modals/ModalContext";
import { TextArea, TextInput } from "../../../components/Inputs";
import { useEffect, useMemo, useState } from "react";

interface NewsFormProps {
  currentNews?: News | null;
  onClear: () => void;
}

const NewsSchema = Yup.object().shape({
  title: Yup.string()
    .required("กรุณากรอกชื่อข่าว")
    .min(3, "อย่างน้อย 3 ตัวอักษร"),
  content: Yup.string().nullable(),
  datePublished: Yup.string().required("กรุณาเลือกวันที่"),
});

type FormValues = {
  title: string;
  content: string;
  datePublished: string; // yyyy-MM-dd
  coverFile: File | null;
  contentFiles: File[];
  removeContentImagePaths: string[];
  replaceContentImages: boolean;
};

const ASSET_ORIGIN = ((): string => {
  try {
    // ใช้ ORIGIN เพื่อกันกรณี VITE_API_BASE_URLS ลงท้ายด้วย path
    return new URL(import.meta.env.VITE_API_BASE_URLS, window.location.origin).origin;
  } catch {
    return import.meta.env.VITE_API_BASE_URLS ?? "";
  }
})();

const buildImageUrl = (p?: string | null) =>
  p ? `${ASSET_ORIGIN}/${p.replace(/^\//, "")}` : "";

export const NewsForm = ({ currentNews }: NewsFormProps) => {
  const [addNews, { isLoading }] = useAddNewsMutation();
  const [updateNews, { isLoading: isUpdating }] = useUpdateNewsMutation();
  const { hideModal } = useModal();

  // พรีวิวรูปใหม่
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [contentPreviews, setContentPreviews] = useState<string[]>([]);

  // สำหรับ mark รูปเดิมที่จะลบ (ถ้าผู้ใช้คลิกปุ่มลบ)
  const [toRemove, setToRemove] = useState<string[]>([]);

  const initialValues: FormValues = useMemo(
    () => ({
      title: currentNews?.title ?? "",
      content: currentNews?.content ?? "",
      datePublished: currentNews
        ? currentNews.datePublished.split("T")[0]
        : new Date().toISOString().split("T")[0],
      coverFile: null,
      contentFiles: [],
      removeContentImagePaths: [],
      replaceContentImages: false,
    }),
    [currentNews]
  );

  // ทำความสะอาด object URL กัน memory leak
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      contentPreviews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [coverPreview, contentPreviews]);

  // helper: CREATE (POST)
  const buildCreateFormData = (v: FormValues) => {
    const fd = new FormData();
    fd.append("Title", v.title);
    fd.append("Content", v.content ?? "");
    fd.append("DatePublished", new Date(v.datePublished).toISOString()); // ส่ง ISO
    if (v.coverFile) fd.append("CoverImage", v.coverFile);
    for (const f of v.contentFiles) fd.append("ContentImages", f);
    return fd;
  };

  // helper: UPDATE (PUT)
  const buildUpdateFormData = (v: FormValues) => {
    const fd = new FormData();
    fd.append("Title", v.title);
    fd.append("Content", v.content ?? "");
    fd.append("DatePublished", new Date(v.datePublished).toISOString());
    if (v.coverFile) fd.append("NewCoverImage", v.coverFile);
    for (const f of v.contentFiles) fd.append("NewContentImages", f);

    // ลบรูปเดิมเฉพาะที่ผู้ใช้เลือก
    const uniqRemove = Array.from(
      new Set([...(v.removeContentImagePaths || []), ...toRemove])
    );
    for (const p of uniqRemove) {
      fd.append("RemoveContentImagePaths", p);
    }

    if (v.replaceContentImages) {
      fd.append("ReplaceContentImages", "true");
    }
    return fd;
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      if (currentNews) {
        const formData = buildUpdateFormData(values);
        await updateNews({ id: currentNews.id!, formData }).unwrap();
        await showSuccessOk("อัพเดทข่าวสำเร็จ!");
      } else {
        const formData = buildCreateFormData(values);
        await addNews(formData).unwrap();
        await showSuccessOk("เพิ่มข่าวสำเร็จ!");
      }
      hideModal();
    } catch (error: any) {
      const errorMessage =
        error?.data?.errorMessages?.[0] ??
        "ไม่สามารถบันทึกข้อมูลข่าวได้ กรุณาลองใหม่";
      await showError(errorMessage);
    }
  };

  const toggleRemove = (path: string) => {
    setToRemove((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg relative">
      <button
        onClick={hideModal}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors text-2xl z-10"
        aria-label="Close modal"
      >
        &times;
      </button>

      <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
        {currentNews ? "แก้ไขข่าว" : "เพิ่มข่าว"}
      </h2>

      <Formik
        initialValues={initialValues}
        validationSchema={NewsSchema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, values, isSubmitting }) => (
          <Form className="space-y-4" encType="multipart/form-data">
            <TextInput
              name="title"
              label="ชื่อข่าว"
              placeholder="ระบุชื่อข่าวของคุณ"
            />
            <TextArea
              name="content"
              label="รายละเอียด"
              placeholder="ระบุรายละเอียดข่าวของคุณ"
              className="min-h-[180px] max-h-[300px]"
              rows={6}
            />

            {/* อัปโหลดรูปหน้าปก */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                รูปหน้าปก
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.currentTarget.files?.[0] ?? null;
                  setFieldValue("coverFile", f);
                  if (coverPreview) URL.revokeObjectURL(coverPreview);
                  if (f) {
                    setCoverPreview(URL.createObjectURL(f));
                  } else {
                    setCoverPreview(null);
                  }
                }}
                className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {(coverPreview || currentNews?.coverImagePath) && (
                <div className="mt-2">
                  <img
                    src={
                      coverPreview ?? buildImageUrl(currentNews?.coverImagePath)
                    }
                    alt="preview cover"
                    className="w-24 h-24 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>

            {/* อัปโหลดรูปเนื้อหา (หลายรูป) */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  รูปภาพภายในหน้า (เลือกได้หลายรูป)
                </label>

                {/* แทนที่รูปเนื้อหาทั้งหมด */}
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={values.replaceContentImages}
                    onChange={(e) =>
                      setFieldValue("replaceContentImages", e.target.checked)
                    }
                  />
                  <span>แทนที่รูปเนื้อหาทั้งหมด</span>
                </label>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.currentTarget.files ?? []);
                  setFieldValue("contentFiles", files);

                  // clear previews เก่า
                  contentPreviews.forEach((u) => URL.revokeObjectURL(u));
                  setContentPreviews(files.map((f) => URL.createObjectURL(f)));
                }}
                className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />

              {/* พรีวิวรูปใหม่ & รูปเดิม */}
              {(contentPreviews.length > 0 ||
                (currentNews?.contentImagePaths?.length ?? 0) > 0) && (
                <div className="mt-3 space-y-2">
                  {/* ใหม่ */}
                  {contentPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {contentPreviews.map((src, i) => (
                        <img
                          key={`new-${i}`}
                          src={src}
                          alt="new content"
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                      ))}
                    </div>
                  )}

                  {/* เดิม: พร้อมปุ่ม “ลบ” ทีละรูป */}
                  {(currentNews?.contentImagePaths ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(currentNews?.contentImagePaths ?? []).map((p, i) => {
                        const fullUrl = buildImageUrl(p);
                        const marked = toRemove.includes(p);
                        return (
                          <div key={`old-${i}`} className="relative">
                            <img
                              src={fullUrl}
                              alt="old content"
                              className={`w-16 h-16 object-cover rounded-md border ${
                                marked ? "opacity-40" : ""
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => toggleRemove(p)}
                              className={`absolute -top-2 -right-2 text-xs rounded-full px-2 py-1 ${
                                marked
                                  ? "bg-slate-500 text-white"
                                  : "bg-rose-600 text-white"
                              }`}
                              title={marked ? "ยกเลิกลบรูปนี้" : "ลบรูปนี้"}
                            >
                              {marked ? "ยกเลิก" : "ลบ"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* เก็บค่า paths ที่จะลบลงใน form values (เพื่อให้ buildUpdateFormData เห็นค่า) */}
            <input
              type="hidden"
              name="removeContentImagePaths"
              value={JSON.stringify(toRemove)}
              readOnly
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isLoading || isUpdating}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 hover:bg-green-700 hover:shadow-md disabled:opacity-60"
              >
                {currentNews ? "บันทึกการแก้ไข" : "บันทึกข่าว"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};
