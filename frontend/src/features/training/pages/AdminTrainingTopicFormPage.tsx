import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useGetAllYearQuery } from "../../Year/YearApi";
import {
  useGetTrainingTopicByIdQuery,
  useGetBranchesQuery,
  useCreateTrainingTopicMutation,
  useUpdateTrainingTopicMutation,
  useUploadTopicLineQrMutation,
  useDeleteTopicLineQrMutation,
} from "../trainingApi";
import { AlertCircle, ArrowLeft, Eye, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { adminManualUrl as fileUrl } from "../../../components/AdminManualButton";
import TrainingLineModal from "../../../components/TrainingLineModal";
import { showSuccessOk, showError } from "../../../utils/confirmDelete";
import type { TrainingTopic } from "../type";
import { ThaiDatePicker, ThaiDateTimePicker } from "../../../components/ThaiDatePicker";

// วันเวลาจาก server เก็บเป็น UTC (บางครั้งไม่มี Z ต่อท้าย) → "yyyy-MM-ddTHH:mm" ตามเวลาเครื่อง
const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const inputClass = (invalid?: boolean) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 outline-none transition focus:ring-4 ${
    invalid
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/10"
  }`;

const Section = ({ no, title, desc, children }: { no: number; title: string; desc?: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
    <div className="mb-6 flex items-start gap-3">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white">
        {no}
      </span>
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {desc && <p className="mt-0.5 text-base text-slate-500">{desc}</p>}
      </div>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">{children}</div>
  </section>
);

const Field = ({
  label,
  required,
  hint,
  error,
  wide,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) => (
  <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
    <span className="mb-2 block text-base font-semibold text-slate-800">
      {label}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </span>
    {children}
    {error ? (
      <span className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-rose-600">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        {error}
      </span>
    ) : (
      hint && <span className="mt-1.5 block text-sm text-slate-500">{hint}</span>
    )}
  </label>
);

const AdminTrainingTopicFormPage = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const isEditMode = !!topicId;
  const id = Number(topicId);

  const { data: topic, isLoading: isLoadingTopic } = useGetTrainingTopicByIdQuery(id, { skip: !isEditMode });
  const copyId = Number(new URLSearchParams(window.location.search).get("copy")) || 0;
  const { data: copySource } = useGetTrainingTopicByIdQuery(copyId, { skip: isEditMode || !copyId });
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: years = [] } = useGetAllYearQuery();
  const [searchParams] = useSearchParams();

  const [createTopic, { isLoading: isCreating }] = useCreateTrainingTopicMutation();
  const [updateTopic, { isLoading: isUpdating }] = useUpdateTrainingTopicMutation();
  const [uploadQr, { isLoading: isUploadingQr }] = useUploadTopicLineQrMutation();
  const [deleteQr, { isLoading: isDeletingQr }] = useDeleteTopicLineQrMutation();
  const saving = isCreating || isUpdating || isUploadingQr || isDeletingQr;

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trainingDate, setTrainingDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(30);
  const [isOpenRegister, setIsOpenRegister] = useState(true);
  const [registerStartDate, setRegisterStartDate] = useState("");
  const [registerEndDate, setRegisterEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [trainingrequirements, setTrainingRequirements] = useState("");
  const [audience, setAudience] = useState("");
  const [branchId, setBranchId] = useState<number | "">("");
  // ปีการจัดงาน: เพิ่มใหม่จากหน้าของปีไหน ใช้ปีนั้นเป็นค่าเริ่มต้น
  const [yearId, setYearId] = useState<number | "">(() => Number(searchParams.get("year")) || "");
  // กลุ่มไลน์ของหลักสูตร (ไม่บังคับ): รูป QR อัปโหลดหลังบันทึกหลักสูตร
  const [lineUrl, setLineUrl] = useState("");
  const [lineNote, setLineNote] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [removeQr, setRemoveQr] = useState(false);
  const [showLinePreview, setShowLinePreview] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Load editing topic data
  useEffect(() => {
    if (isEditMode && topic) {
      setName(topic.name);
      setDescription(topic.description ?? "");
      setTrainingDate(toLocalInput(topic.trainingDate).substring(0, 10));
      setMaxParticipants(topic.maxParticipants);
      setIsOpenRegister(topic.isOpenRegister);
      setRegisterStartDate(toLocalInput(topic.registerStartDate));
      setRegisterEndDate(toLocalInput(topic.registerEndDate));
      setLocation(topic.location ?? "");
      setTeacherName(topic.teacherName ?? "");
      setTrainingRequirements(topic.trainingtopicsrequirements ?? "");
      setAudience(topic.audience ?? "");
      setBranchId(topic.branch_id ?? "");
      setYearId(topic.yearID ?? "");
      setLineUrl(topic.lineGroupUrl ?? "");
      setLineNote(topic.lineNote ?? "");
    }
  }, [isEditMode, topic]);

  // คัดลอกจากหลักสูตรเดิม: เอาเนื้อหามา ส่วนวันที่ให้กรอกใหม่
  useEffect(() => {
    if (!copySource) return;
    setName(`${copySource.name} (สำเนา)`);
    setDescription(copySource.description ?? "");
    setMaxParticipants(copySource.maxParticipants);
    setLocation(copySource.location ?? "");
    setTeacherName(copySource.teacherName ?? "");
    setTrainingRequirements(copySource.trainingtopicsrequirements ?? "");
    setAudience(copySource.audience ?? "");
    setBranchId(copySource.branch_id ?? "");
  }, [copySource]);

  // ตรวจข้อมูลก่อนบันทึก
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "กรุณากรอกชื่อหลักสูตร";
    if (!yearId) e.yearId = "กรุณาเลือกปีการจัดงาน";
    if (lineUrl.trim() && !/^https?:\/\/\S+$/i.test(lineUrl.trim())) e.lineUrl = "ลิงก์กลุ่มไลน์ต้องขึ้นต้นด้วย https://";
    if (maxParticipants < 0 || !Number.isFinite(maxParticipants)) e.maxParticipants = "จำนวนต้องเป็น 0 ขึ้นไป";
    if (registerStartDate && registerEndDate && registerEndDate <= registerStartDate)
      e.registerEndDate = "วันปิดรับสมัครต้องหลังวันเปิดรับสมัคร";
    if (isOpenRegister && registerEndDate && new Date(registerEndDate) < new Date())
      e.registerEndDate = "วันปิดรับสมัครผ่านไปแล้ว ถ้าจะเปิดรับต่อ ให้เลื่อนวันปิดรับสมัคร";
    else if (registerEndDate && trainingDate && registerEndDate.substring(0, 10) > trainingDate)
      e.registerEndDate = "วันปิดรับสมัครต้องไม่เกินวันอบรม";
    return e;
  }, [name, maxParticipants, registerStartDate, registerEndDate, trainingDate, isOpenRegister, yearId, lineUrl]);
  const err = (key: string) => (submitted ? errors[key] : undefined);

  useEffect(() => () => {
    if (qrPreview) URL.revokeObjectURL(qrPreview);
  }, [qrPreview]);

  const currentQr = qrPreview ?? (!removeQr && topic?.lineQrPath && isEditMode ? fileUrl(topic.lineQrPath) : null);

  const handleQrFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!/\.(png|jpe?g|webp)$/i.test(f.name)) return showError("รูป QR ต้องเป็นไฟล์ PNG, JPG หรือ WEBP");
    if (f.size > 5 * 1024 * 1024) return showError("รูปต้องมีขนาดไม่เกิน 5MB");
    setQrFile(f);
    setQrPreview(URL.createObjectURL(f));
    setRemoveQr(false);
  };

  const handleRemoveQr = () => {
    if (qrFile) {
      setQrFile(null);
      setQrPreview(null);
      return;
    }
    setRemoveQr(true);
  };

  // บันทึก/ลบรูป QR หลังบันทึกข้อมูลหลักสูตรแล้ว
  const saveQr = async (topicIdToSave: number) => {
    if (qrFile) await uploadQr({ id: topicIdToSave, file: qrFile }).unwrap();
    else if (removeQr) await deleteQr(topicIdToSave).unwrap();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const payload: Partial<TrainingTopic> = {
      name: name.trim(),
      description,
      trainingDate: trainingDate ? new Date(trainingDate).toISOString() : undefined,
      maxParticipants: Number(maxParticipants),
      isOpenRegister,
      registerStartDate: registerStartDate ? new Date(registerStartDate).toISOString() : undefined,
      registerEndDate: registerEndDate ? new Date(registerEndDate).toISOString() : undefined,
      location,
      teacherName,
      trainingtopicsrequirements: trainingrequirements,
      audience: audience.trim() || undefined,
      branch_id: branchId ? Number(branchId) : undefined,
      yearID: Number(yearId),
      lineGroupUrl: lineUrl.trim() || undefined,
      lineNote: lineNote.trim() || undefined,
    };

    try {
      if (isEditMode) {
        await updateTopic({ id, body: payload }).unwrap();
        await saveQr(id);
        showSuccessOk("แก้ไขหลักสูตรอบรมเรียบร้อยแล้ว");
      } else {
        const created: any = await createTopic(payload).unwrap();
        const newId = created?.result?.id ?? created?.id;
        if (newId) await saveQr(newId);
        showSuccessOk("เพิ่มหลักสูตรอบรมเรียบร้อยแล้ว");
      }
      navigate(`/admin/trainingtopics?year=${yearId}`);
    } catch (err: any) {
      showError(err?.data?.errorMessages?.[0] || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  if (isEditMode && isLoadingTopic) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        กำลังโหลดรายละเอียดหลักสูตร...
      </div>
    );
  }

  const backParam = topic?.yearID ?? searchParams.get("year");
  const backUrl = backParam ? `/admin/trainingtopics?year=${backParam}` : "/admin/trainingtopics";
  const errorCount = submitted ? Object.keys(errors).length : 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto w-full max-w-5xl space-y-5 pb-4 2xl:max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(backUrl)}
          aria-label="กลับไปหน้ารายการหลักสูตร"
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {isEditMode ? "แก้ไขหลักสูตรอบรม" : copySource ? "คัดลอกหลักสูตรอบรม" : "เพิ่มหลักสูตรอบรมใหม่"}
          </h1>
          <p className="text-base text-slate-500">
            ช่องที่มี <span className="text-rose-500">*</span> ต้องกรอก ที่เหลือเว้นว่างได้
          </p>
        </div>
      </div>

      {errorCount > 0 && (
        <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-base text-rose-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">ยังบันทึกไม่ได้ มี {errorCount} จุดที่ต้องแก้</p>
            <ul className="mt-1 list-inside list-disc text-sm">
              {Object.values(errors).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid gap-5 2xl:grid-cols-2 2xl:items-start">
      <Section no={1} title="ข้อมูลหลักสูตร" desc="ชื่อและรายละเอียดที่ผู้สมัครจะเห็น">
        <Field label="ชื่อหลักสูตรอบรม" required wide error={err("name")}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass(!!err("name"))}
            placeholder="เช่น การใช้ AI ช่วยสอนวิทยาศาสตร์"
            autoFocus={!isEditMode}
          />
        </Field>
        <Field label="ปีการจัดงาน" required error={err("yearId")}>
          <select
            value={yearId}
            onChange={(e) => setYearId(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputClass(!!err("yearId"))}
          >
            <option value="">— กรุณาเลือกปี —</option>
            {[...years]
              .sort((a, b) => b.yearNumber - a.yearNumber)
              .map((y) => (
                <option key={y.yearID} value={y.yearID}>
                  {y.yearName || `ปี ${y.yearNumber}`}
                </option>
              ))}
          </select>
        </Field>
        <Field label="สาขาวิชา">
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputClass()}
          >
            <option value="">— ไม่ระบุสาขา —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="วิทยากร" wide>
          <input
            type="text"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            className={inputClass()}
            placeholder="เช่น ดร.สมชาย ใจดี"
          />
        </Field>
        <Field label="รายละเอียดหลักสูตร" wide>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={inputClass()}
            placeholder="เนื้อหาที่จะได้เรียน เหมาะกับใคร"
          />
        </Field>
        <Field label="การเข้าร่วมกิจกรรม" hint="ใครเข้าร่วมได้บ้าง" wide>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            maxLength={500}
            className={inputClass()}
            placeholder="เช่น นักเรียนชั้นมัธยมศึกษาปีที่ 4-5-6"
          />
        </Field>
        <Field label="สิ่งที่ผู้เข้าอบรมต้องเตรียมมา" wide>
          <textarea
            value={trainingrequirements}
            onChange={(e) => setTrainingRequirements(e.target.value)}
            rows={2}
            className={inputClass()}
            placeholder="เช่น นำโน้ตบุ๊กส่วนตัวมาด้วย"
          />
        </Field>
      </Section>

      <div className="space-y-5">
      <Section no={2} title="วันและสถานที่">
        <Field label="วันที่อบรม" wide>
          <ThaiDatePicker value={trainingDate} onChange={setTrainingDate} placeholder="เลือกวันอบรม" />
        </Field>
        <Field label="สถานที่และเวลา" hint="พิมพ์สถานที่และเวลารวมกันได้เลย" wide>
          <textarea
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            rows={2}
            className={inputClass()}
            placeholder="เช่น ตึก 1 อาคารวิทยาการคอมพิวเตอร์ ชั้น 2 ห้องเรียนรวม เวลา 9.00 น."
          />
        </Field>
      </Section>

      <Section no={3} title="การรับสมัคร">
        <Field label="จำนวนที่นั่ง (คน)" required hint="ใส่ 0 = ไม่จำกัดจำนวน" error={err("maxParticipants")}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value === "" ? 0 : Number(e.target.value))}
            className={inputClass(!!err("maxParticipants"))}
          />
          <span className="mt-2 flex flex-wrap gap-1.5">
            {[20, 30, 50, 100, 0].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMaxParticipants(n)}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition cursor-pointer ${
                  maxParticipants === n ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {n === 0 ? "ไม่จำกัด" : n}
              </button>
            ))}
          </span>
        </Field>

        <div className="sm:self-start">
          <span className="mb-2 block text-base font-semibold text-slate-800">สถานะรับสมัคร</span>
          <label
            className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 transition ${
              isOpenRegister ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-slate-50"
            }`}
          >
            <span>
              <span className={`block text-base font-semibold ${isOpenRegister ? "text-emerald-800" : "text-slate-700"}`}>
                {isOpenRegister ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
              </span>
              <span className="block text-sm text-slate-500">
                {isOpenRegister
                  ? "ผู้ใช้สมัครได้ภายในช่วงวันด้านล่าง เลยวันปิดรับแล้วระบบปิดให้อัตโนมัติ"
                  : "ผู้ใช้สมัครไม่ได้"}
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={isOpenRegister}
              onChange={(e) => setIsOpenRegister(e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-7 w-12 flex-shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-500/20 after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>

        <Field label="เปิดรับสมัครตั้งแต่" wide>
          <ThaiDateTimePicker
            value={registerStartDate}
            onChange={setRegisterStartDate}
            defaultTime="08:00"
            timePresets={["00:00", "08:00", "08:30", "09:00", "12:00"]}
          />
        </Field>
        <Field label="ปิดรับสมัคร" error={err("registerEndDate")} wide>
          <ThaiDateTimePicker
            value={registerEndDate}
            onChange={setRegisterEndDate}
            min={registerStartDate || undefined}
            max={trainingDate || undefined}
            invalid={!!err("registerEndDate")}
            defaultTime="23:59"
            timePresets={["12:00", "16:00", "16:30", "18:00", "23:59"]}
          />
        </Field>
      </Section>

      <Section no={4} title="กลุ่มไลน์ของหลักสูตร" desc="ไม่บังคับ · แสดงให้เฉพาะผู้ที่สมัครหลักสูตรนี้แล้ว (หลังกดสมัคร และในหน้า “การอบรมของฉัน”)">
        <div className="space-y-2">
          <span className="mb-2 block text-base font-semibold text-slate-800">รูป QR Code</span>
          <div className="flex aspect-square max-w-[220px] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
            {currentQr ? (
              <img src={currentQr} alt="QR กลุ่มไลน์" className="h-full w-full object-contain p-2" />
            ) : (
              <span className="px-4 text-center text-sm text-slate-400">ยังไม่มีรูป QR</span>
            )}
          </div>
          <div className="flex max-w-[220px] gap-2">
            <label className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
              <ImagePlus className="h-4 w-4" />
              {currentQr ? "เปลี่ยนรูป" : "เลือกรูป QR"}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleQrFile} className="hidden" />
            </label>
            {currentQr && (
              <button
                type="button"
                onClick={handleRemoveQr}
                title="ลบรูป"
                aria-label="ลบรูป QR"
                className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          {(qrFile || removeQr) && <p className="text-sm text-amber-700">รูปจะเปลี่ยนเมื่อกดบันทึกหลักสูตร</p>}
        </div>

        <div className="space-y-5">
          <Field label="ลิงก์เข้ากลุ่ม" hint="สำหรับผู้ที่เปิดบนมือถือ กดแล้วเข้ากลุ่มได้ทันที" error={err("lineUrl")}>
            <input
              type="url"
              value={lineUrl}
              onChange={(e) => setLineUrl(e.target.value)}
              maxLength={500}
              className={inputClass(!!err("lineUrl"))}
              placeholder="https://line.me/R/ti/g/..."
            />
          </Field>
          <Field label="ข้อความใต้รูป">
            <input
              type="text"
              value={lineNote}
              onChange={(e) => setLineNote(e.target.value)}
              maxLength={500}
              className={inputClass()}
              placeholder="เช่น กรุณาเข้ากลุ่มก่อนวันอบรม เพื่อรับเอกสาร"
            />
          </Field>
          <button
            type="button"
            onClick={() => setShowLinePreview(true)}
            disabled={!currentQr && !lineUrl.trim()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            ดูตัวอย่างที่ผู้สมัครจะเห็น
          </button>
        </div>
      </Section>
      </div>
      </div>

      {showLinePreview && (
        <TrainingLineModal
          topicName={name || "ชื่อหลักสูตร"}
          group={{ lineGroupUrl: lineUrl.trim(), lineNote: lineNote.trim() }}
          qrSrc={currentQr}
          justRegistered
          onClose={() => setShowLinePreview(false)}
        />
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 px-5 py-4 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => navigate(backUrl)}
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {saving ? "กำลังบันทึก..." : isEditMode ? "บันทึกการแก้ไข" : "บันทึกหลักสูตร"}
        </button>
      </div>
    </form>
  );
};

export default AdminTrainingTopicFormPage;
