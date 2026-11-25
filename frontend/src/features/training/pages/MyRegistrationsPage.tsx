import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetMyRegistrationsQuery, useUpdateRegistrationMutation, useCancelRegistrationMutation } from "../trainingApi";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Info,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { showSuccessOk, showError } from "../../../utils/confirmDelete";
import Swal from "sweetalert2";
import type { TrainingRegistration } from "../type";
import TrainingLineModal, { hasLineContent } from "../../../components/TrainingLineModal";
import { fetchExportBlob } from "../../../Apis/Export";
import { formatThaiDate } from "../../../utils/dateUtils";

type Tab = "active" | "cancelled";

const CANCELLED = "ยกเลิกแล้ว";
const ring = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300";
const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10";

const fullName = (r: { prefix?: string; firstName: string; lastName: string }) =>
  `${r.prefix ?? ""}${r.firstName.trim()} ${r.lastName.trim()}`.trim();

const thaiParts = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return {
    day: d.getDate(),
    month: d.toLocaleDateString("th-TH", { month: "short" }),
    weekday: d.toLocaleDateString("th-TH", { weekday: "short" }),
    year: d.getFullYear() + 543,
  };
};

const MyRegistrationsPage = () => {
  const navigate = useNavigate();
  const [lineReg, setLineReg] = useState<TrainingRegistration | null>(null);
  const { data: registrations = [], isLoading, isError, refetch } = useGetMyRegistrationsQuery();
  const [updateRegistration, { isLoading: isUpdating }] = useUpdateRegistrationMutation();
  const [cancelRegistration] = useCancelRegistrationMutation();

  const [tab, setTab] = useState<Tab>("active");

  // แก้ไขชื่อ
  const [selectedReg, setSelectedReg] = useState<TrainingRegistration | null>(null);
  const [prefix, setPrefix] = useState("นาย");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const nameErrors = {
    firstName: !firstName.trim() ? "กรุณากรอกชื่อ" : "",
    lastName: !lastName.trim() ? "กรุณากรอกนามสกุล" : "",
  };

  const handleOpenEditModal = (reg: TrainingRegistration) => {
    setSelectedReg(reg);
    setPrefix(reg.prefix ?? "นาย");
    setFirstName(reg.firstName);
    setLastName(reg.lastName);
    setSubmitted(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg) return;
    setSubmitted(true);
    if (nameErrors.firstName || nameErrors.lastName) return;

    try {
      await updateRegistration({
        id: selectedReg.id,
        body: { prefix, firstName: firstName.trim(), lastName: lastName.trim() },
      }).unwrap();

      showSuccessOk("แก้ไขชื่อเรียบร้อยแล้ว");
      setSelectedReg(null);
      refetch();
    } catch (err: any) {
      showError(err?.data?.errorMessages?.[0] || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    }
  };

  const handleCancelClick = async (reg: TrainingRegistration) => {
    const result = await Swal.fire({
      title: "ยกเลิกการสมัคร?",
      text: `ยกเลิกการสมัครหลักสูตร "${reg.trainingtopic?.name || ""}" ที่นั่งของคุณจะถูกปล่อยให้ผู้อื่น`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      confirmButtonText: "ยกเลิกการสมัคร",
      cancelButtonText: "ไม่ใช่",
    });
    if (!result.isConfirmed) return;

    try {
      await cancelRegistration(reg.id).unwrap();
      showSuccessOk("ยกเลิกการสมัครเรียบร้อยแล้ว");
      refetch();
    } catch (err: any) {
      showError(err?.data?.errorMessages?.[0] || "ไม่สามารถยกเลิกได้ในขณะนี้");
    }
  };

  // ดาวน์โหลดเกียรติบัตรของตัวเอง
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const handleDownloadCertificate = async (reg: TrainingRegistration) => {
    setDownloadingId(reg.id);
    try {
      const blob = await fetchExportBlob(`trainingCertificate/${reg.id}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `เกียรติบัตร-${reg.firstName} ${reg.lastName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showError(err?.message || "ไม่สามารถดาวน์โหลดเกียรติบัตรได้");
    } finally {
      setDownloadingId(null);
    }
  };

  const isRegistrationClosed = (reg: TrainingRegistration) =>
    !!reg.trainingtopic?.registerEndDate && new Date(reg.trainingtopic.registerEndDate) < new Date();

  const active = registrations.filter((r) => r.status !== CANCELLED);
  const cancelled = registrations.filter((r) => r.status === CANCELLED);
  const list = (tab === "active" ? active : cancelled)
    .slice()
    .sort((a, b) => (a.trainingtopic?.trainingDate ?? "9").localeCompare(b.trainingtopic?.trainingDate ?? "9"));

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* ===== ส่วนหัว ===== */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 2xl:max-w-[1600px]">
          <nav aria-label="breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
            <Link to="/" className="hover:text-blue-700 hover:underline">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/training/list" className="hover:text-blue-700 hover:underline">
              กิจกรรมการอบรม
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-slate-700">การสมัครของฉัน</span>
          </nav>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">การสมัครของฉัน</h1>
              <p className="mt-2 text-lg text-slate-600">ดูหลักสูตรที่สมัครไว้ ดาวน์โหลดเกียรติบัตร และแก้ไขชื่อ</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/training/list")}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer ${ring}`}
            >
              <ArrowLeft className="h-5 w-5" />
              ดูหลักสูตรอื่น
            </button>
          </div>

          {/* คำแนะนำสั้น ๆ */}
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: <Award className="h-5 w-5" />, title: "ดาวน์โหลดเกียรติบัตร", desc: "กดปุ่มสีน้ำเงินของแต่ละหลักสูตร", tone: "bg-blue-100 text-blue-700" },
              { icon: <Edit3 className="h-5 w-5" />, title: "ชื่อผิด แก้ได้", desc: "ก่อนหมดเขตรับสมัคร", tone: "bg-amber-100 text-amber-700" },
              { icon: <XCircle className="h-5 w-5" />, title: "ไปไม่ได้ ยกเลิกได้", desc: "เพื่อเปิดที่นั่งให้ผู้อื่น", tone: "bg-rose-100 text-rose-700" },
            ].map((f) => (
              <li key={f.title} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${f.tone}`}>{f.icon}</span>
                <div>
                  <p className="font-bold text-slate-900">{f.title}</p>
                  <p className="text-sm text-slate-500">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8 2xl:max-w-[1600px]">
        {/* แท็บ */}
        <div className="flex gap-2" role="tablist" aria-label="สถานะการสมัคร">
          {(
            [
              { key: "active", label: "กำลังสมัคร", count: active.length },
              { key: "cancelled", label: "ยกเลิกแล้ว", count: cancelled.length },
            ] as { key: Tab; label: string; count: number }[]
          ).map((t) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition cursor-pointer ${ring} ${
                  on ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {t.label}
                <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${on ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-4" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="hidden w-32 bg-slate-200 sm:block" />
                <div className="flex-1 space-y-3 p-5">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="h-6 w-3/4 rounded bg-slate-200" />
                  <div className="h-4 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div role="alert" className="flex flex-col items-center rounded-2xl border border-rose-200 bg-white px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <AlertCircle className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900">โหลดข้อมูลการสมัครไม่สำเร็จ</h2>
            <p className="text-slate-500">กรุณาลองใหม่อีกครั้ง</p>
            <button
              type="button"
              onClick={() => refetch()}
              className={`mt-5 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 cursor-pointer ${ring}`}
            >
              ลองใหม่
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Search className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              {tab === "active" ? "คุณยังไม่ได้สมัครหลักสูตรใด" : "ไม่มีการสมัครที่ยกเลิก"}
            </h2>
            {tab === "active" && (
              <>
                <p className="text-slate-500">เลือกหลักสูตรที่สนใจ แล้วกด "สมัครเข้าร่วม"</p>
                <button
                  type="button"
                  onClick={() => navigate("/training/list")}
                  className={`mt-5 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 cursor-pointer ${ring}`}
                >
                  ดูหลักสูตรที่เปิดรับสมัคร
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((reg) => {
              const isCancelled = reg.status === CANCELLED;
              const closed = isRegistrationClosed(reg);
              const topic = reg.trainingtopic;
              const d = thaiParts(topic?.trainingDate);

              return (
                <article
                  key={reg.id}
                  className={`flex flex-col overflow-hidden rounded-2xl border bg-white sm:flex-row ${
                    isCancelled ? "border-slate-200 opacity-75" : "border-slate-200"
                  }`}
                >
                  {/* วันที่ */}
                  <div
                    className={`flex items-center gap-3 px-5 py-3 text-white sm:w-32 sm:flex-shrink-0 sm:flex-col sm:justify-center sm:gap-0 sm:py-5 ${
                      isCancelled ? "bg-slate-400" : "bg-blue-600"
                    }`}
                  >
                    {d ? (
                      <>
                        <span className="text-sm font-medium opacity-90">{d.weekday}</span>
                        <span className="text-3xl font-bold leading-none sm:my-1 sm:text-5xl">{d.day}</span>
                        <span className="text-sm font-semibold">
                          {d.month} {d.year}
                        </span>
                      </>
                    ) : (
                      <>
                        <CalendarDays className="h-7 w-7" />
                        <span className="text-sm font-semibold sm:mt-1">รอประกาศวัน</span>
                      </>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6">
                    {/* ข้อมูล */}
                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                          isCancelled ? "bg-slate-100 text-slate-600 ring-slate-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        }`}
                      >
                        {isCancelled ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        {isCancelled ? "ยกเลิกแล้ว" : "สมัครแล้ว"}
                      </span>
                      <h3 className={`mt-1.5 text-xl font-bold leading-snug ${isCancelled ? "text-slate-500 line-through" : "text-slate-900"}`}>
                        {topic?.name || "ไม่ระบุหลักสูตร"}
                      </h3>
                      <ul className="mt-2 space-y-1.5 text-[15px] text-slate-600">
                        {topic?.location && (
                          <li className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
                            <span className="whitespace-pre-line">{topic.location}</span>
                          </li>
                        )}
                        {topic?.trainingDate && (
                          <li className="flex items-start gap-2">
                            <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                            {formatThaiDate(topic.trainingDate)}
                          </li>
                        )}
                      </ul>

                      {/* ชื่อบนเกียรติบัตร */}
                      <div className="mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-amber-50 px-3.5 py-2 ring-1 ring-amber-200">
                        <span className="flex items-center gap-1.5 text-sm text-amber-800">
                          <User className="h-4 w-4" />
                          ชื่อบนเกียรติบัตร:
                        </span>
                        <span className="font-bold text-slate-900">{fullName(reg)}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">สมัครเมื่อ {formatThaiDate(reg.registeredAt)}</p>
                    </div>

                    {/* ปุ่ม */}
                    {!isCancelled && (
                      <div className="flex flex-col gap-2 lg:w-64 lg:flex-shrink-0">
                        {hasLineContent(topic) && (
                          <button
                            type="button"
                            onClick={() => setLineReg(reg)}
                            className={`flex items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3 font-bold text-white transition hover:brightness-95 cursor-pointer ${ring}`}
                          >
                            <MessageCircle className="h-5 w-5" />
                            เข้ากลุ่มไลน์ของหลักสูตร
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDownloadCertificate(reg)}
                          disabled={downloadingId === reg.id}
                          className={`flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer ${ring}`}
                        >
                          {downloadingId === reg.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Award className="h-5 w-5" />}
                          {downloadingId === reg.id ? "กำลังสร้างไฟล์..." : "ดาวน์โหลดเกียรติบัตร"}
                        </button>
                        {closed ? (
                          <p className="flex items-start gap-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-500 ring-1 ring-slate-200">
                            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            หมดเขตรับสมัครแล้ว แก้ไขชื่อหรือยกเลิกไม่ได้
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(reg)}
                              className={`flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 py-2.5 font-semibold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100 cursor-pointer ${ring}`}
                            >
                              <Edit3 className="h-4 w-4" />
                              แก้ไขชื่อ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelClick(reg)}
                              className={`flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 py-2.5 font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100 cursor-pointer ${ring}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              ยกเลิกสมัคร
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {lineReg?.trainingtopic && (
        <TrainingLineModal topicName={lineReg.trainingtopic.name} group={lineReg.trainingtopic} onClose={() => setLineReg(null)} />
      )}

      {/* ===== Modal: แก้ไขชื่อ ===== */}
      {selectedReg && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4"
          onClick={() => setSelectedReg(null)}
          onKeyDown={(e) => e.key === "Escape" && setSelectedReg(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="แก้ไขชื่อบนเกียรติบัตร"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Edit3 className="h-5 w-5 text-amber-600" />
                แก้ไขชื่อบนเกียรติบัตร
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReg(null)}
                aria-label="ปิด"
                autoFocus
                className={`rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer ${ring}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} noValidate className="space-y-5 overflow-y-auto p-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-lg font-bold leading-snug text-slate-900">{selectedReg.trainingtopic?.name}</p>
                <p className="mt-1 text-sm text-slate-500">แก้ไขได้จนถึงวันปิดรับสมัคร</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[170px_1fr_1fr]">
                <div>
                  <label htmlFor="edit-prefix" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    คำนำหน้าชื่อ
                  </label>
                  <select id="edit-prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} className={inputClass}>
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="เด็กชาย">เด็กชาย</option>
                    <option value="เด็กหญิง">เด็กหญิง</option>
                  </select>
                </div>
                {(
                  [
                    { id: "edit-first", label: "ชื่อ", value: firstName, set: setFirstName, err: nameErrors.firstName },
                    { id: "edit-last", label: "นามสกุล", value: lastName, set: setLastName, err: nameErrors.lastName },
                  ] as const
                ).map((f) => (
                  <div key={f.id}>
                    <label htmlFor={f.id} className="mb-1.5 block text-sm font-semibold text-slate-700">
                      {f.label} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id={f.id}
                      type="text"
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      aria-invalid={submitted && !!f.err}
                      aria-describedby={`${f.id}-err`}
                      className={`${inputClass} ${submitted && f.err ? "border-rose-400 bg-rose-50/40" : ""}`}
                    />
                    {submitted && f.err && (
                      <p id={`${f.id}-err`} className="mt-1 text-sm text-rose-600">
                        {f.err}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 px-4 py-4 text-center">
                <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-800">
                  <Award className="h-4 w-4" />
                  ชื่อที่จะพิมพ์บนเกียรติบัตร
                </p>
                <p className="mt-1 min-h-[1.75rem] text-xl font-bold text-blue-800">
                  {firstName.trim() || lastName.trim() ? fullName({ prefix, firstName, lastName }) : "—"}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedReg(null)}
                  className={`rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-100 cursor-pointer ${ring}`}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer ${ring}`}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  {isUpdating ? "กำลังบันทึก..." : "บันทึกชื่อ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRegistrationsPage;
