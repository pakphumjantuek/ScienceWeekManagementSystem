import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import type { RootState } from "../../../Redux/store";
import {
  useGetTrainingTopicsQuery,
  useGetBranchesQuery,
  useRegisterTrainingMutation,
  useGetMyRegistrationsQuery,
  useGetAllTrainingRegistrationsQuery,
} from "../trainingApi";
import {
  X,
  Search,
  ArrowRight,
  Award,
  BookOpen,
  Users,
  CalendarDays,
  MapPin,
  User,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  LogIn,
  BadgeCheck,
  Gift,
  SlidersHorizontal,
  MessageCircle,
} from "lucide-react";
import { showSuccessOk, showError } from "../../../utils/confirmDelete";
import type { TrainingTopic } from "../type";
import { formatThaiDate } from "../../../utils/dateUtils";
import { useGetSystemSettingsQuery } from "../../setting/systemSettingsApi";
import TrainingLineModal, { hasLineContent, type LineGroup } from "../../../components/TrainingLineModal";

type StatusKey = "registered" | "open" | "closed" | "notyet" | "expired" | "full";
type Status = { key: StatusKey; label: string; disabled: boolean; isRegistered?: boolean };
type Row = { topic: TrainingTopic; status: Status };
type View = "open" | "all" | "mine";

const registeredOf = (t: TrainingTopic) => (t as TrainingTopic & { registeredCount?: number }).registeredCount ?? 0;

// ไม่แยกสีตามสาขา: ใช้สีเดียวกันทุกหลักสูตร
const branchColor = (_id?: number | null) => ({ solid: "bg-blue-600", text: "text-slate-500" });

const STATUS_STYLE: Record<StatusKey, string> = {
  open: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  registered: "bg-blue-50 text-blue-700 ring-blue-200",
  notyet: "bg-slate-100 text-slate-600 ring-slate-200",
  full: "bg-amber-50 text-amber-800 ring-amber-200",
  expired: "bg-rose-50 text-rose-700 ring-rose-200",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
};

const ring = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300";
const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10";

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

const Modal = ({
  title,
  icon,
  onClose,
  children,
  footer,
  size = "max-w-lg",
}: {
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: string;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4"
    onClick={onClose}
    onKeyDown={(e) => e.key === "Escape" && onClose()}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.stopPropagation()}
      className={`flex max-h-[92vh] w-full ${size} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          {icon}
          {title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          autoFocus
          className={`rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer ${ring}`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="overflow-y-auto p-6">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">{footer}</div>}
    </div>
  </div>
);

const TrainingTopicsListPage = () => {
  const navigate = useNavigate();
  const userData = useSelector((state: RootState) => state.userAuthStore);
  const isAuthenticated = !!userData.id;

  const { data: topics = [], isLoading, isError, refetch } = useGetTrainingTopicsQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  // แสดงเฉพาะหลักสูตรของปีที่ตั้งค่าไว้ให้แสดงบนหน้าเว็บ (ไม่ได้ตั้งค่า = ทุกปี)
  const { data: settings } = useGetSystemSettingsQuery();
  const displayYearId = settings?.homeDisplayYearId;
  const { data: myRegistrations = [] } = useGetMyRegistrationsQuery(undefined, { skip: !isAuthenticated });
  const [registerTraining, { isLoading: isRegistering }] = useRegisterTrainingMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [branchIds, setBranchIds] = useState<number[]>([]);
  const [view, setView] = useState<View>("open");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [lineFor, setLineFor] = useState<{ topicName: string; group: LineGroup } | null>(null);

  const [registeringTopic, setRegisteringTopic] = useState<TrainingTopic | null>(null);
  const [viewingDetailsTopic, setViewingDetailsTopic] = useState<TrainingTopic | null>(null);
  const [viewingRegistrantsTopic, setViewingRegistrantsTopic] = useState<TrainingTopic | null>(null);

  const [prefix, setPrefix] = useState("นาย");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const nameErrors = {
    firstName: !firstName.trim() ? "กรุณากรอกชื่อ" : "",
    lastName: !lastName.trim() ? "กรุณากรอกนามสกุล" : "",
  };

  const handleOpenRegisterModal = (topic: TrainingTopic) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // เติมชื่อจากบัญชีผู้ใช้ให้ก่อน
    let defaultFirstName = "";
    let defaultLastName = "";
    if ((userData as any).fullName) {
      const parts = (userData as any).fullName.trim().split(/\s+/);
      defaultFirstName = parts[0] || "";
      defaultLastName = parts.slice(1).join(" ") || "";
    }
    setFirstName(defaultFirstName);
    setLastName(defaultLastName);
    setSubmitted(false);
    setRegisteringTopic(topic);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringTopic) return;
    setSubmitted(true);
    if (nameErrors.firstName || nameErrors.lastName) return;

    try {
      const reg = await registerTraining({
        trainingtopicId: registeringTopic.id,
        prefix,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      }).unwrap();

      // หลักสูตรมีกลุ่มไลน์ → แสดง QR แทนข้อความสำเร็จ
      if (hasLineContent(reg.trainingtopic)) setLineFor({ topicName: registeringTopic.name, group: reg.trainingtopic! });
      else       showSuccessOk(`ลงทะเบียนเข้าร่วมอบรม "${registeringTopic.name}" สำเร็จแล้ว`);
      setRegisteringTopic(null);
      refetch();
    } catch (err: any) {
      showError(err?.data?.errorMessages?.[0] || "เกิดข้อผิดพลาดในการลงทะเบียน");
    }
  };

  const getRegistrationStatus = (topic: TrainingTopic): Status => {
    const now = new Date();
    const isAlreadyReg = myRegistrations.some((r) => r.trainingtopicId === topic.id && r.status !== "ยกเลิกแล้ว");

    if (isAlreadyReg) return { key: "registered", label: "คุณลงทะเบียนแล้ว", disabled: false, isRegistered: true };
    if (!topic.isOpenRegister) return { key: "closed", label: "ปิดรับสมัคร", disabled: true };
    if (topic.registerStartDate && new Date(topic.registerStartDate) > now)
      return { key: "notyet", label: "ยังไม่เปิดรับสมัคร", disabled: true };
    if (topic.registerEndDate && new Date(topic.registerEndDate) < now)
      return { key: "expired", label: "หมดเขตรับสมัคร", disabled: true };
    if (topic.maxParticipants > 0 && registeredOf(topic) >= topic.maxParticipants)
      return { key: "full", label: "ที่นั่งเต็มแล้ว", disabled: true };
    return { key: "open", label: "เปิดรับสมัคร", disabled: false };
  };

  const allRows = useMemo<Row[]>(
    () =>
      topics
        .filter((t) => t.isActive && (!displayYearId || t.yearID === displayYearId))
        .map((t) => ({ topic: t, status: getRegistrationStatus(t) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topics, myRegistrations, displayYearId],
  );

  const inView = (r: Row, v: View) =>
    v === "all" ? true : v === "mine" ? !!r.status.isRegistered : ["open", "registered", "notyet"].includes(r.status.key);

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRows
      .filter((r) => inView(r, view))
      .filter(({ topic: t }) => branchIds.length === 0 || (t.branch_id != null && branchIds.includes(t.branch_id)))
      .filter(
        ({ topic: t }) =>
          !q || t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.teacherName?.toLowerCase().includes(q),
      )
      .sort((a, b) => (a.topic.trainingDate ?? "9").localeCompare(b.topic.trainingDate ?? "9"));
  }, [allRows, view, branchIds, searchQuery]);

  const viewCount = (v: View) => allRows.filter((r) => inView(r, v)).length;
  const branchCount = (id: number) => allRows.filter((r) => inView(r, view) && r.topic.branch_id === id).length;
  const mineCount = viewCount("mine");
  const hasFilter = !!searchQuery || branchIds.length > 0;
  const clearFilters = () => {
    setSearchQuery("");
    setBranchIds([]);
  };
  const toggleBranch = (id: number) => setBranchIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  // ===== แผงตัวกรอง =====
  const filterPanel = (
    <div className="space-y-6">
      <div>
        <label htmlFor="training-search" className="mb-2 block text-sm font-bold text-slate-900">
          ค้นหา
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="training-search"
            type="search"
            placeholder="ชื่อหลักสูตร หรือวิทยากร"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-slate-900">แสดง</legend>
        <div className="space-y-1">
          {(
            [
              { key: "open", label: "เปิดอยู่ / กำลังจะเปิด" },
              { key: "all", label: "ทุกหลักสูตร" },
              ...(isAuthenticated ? [{ key: "mine", label: "ที่ฉันสมัครแล้ว" }] : []),
            ] as { key: View; label: string }[]
          ).map((o) => (
            <label
              key={o.key}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                view === o.key ? "bg-blue-50 font-semibold text-blue-800" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="training-view"
                  checked={view === o.key}
                  onChange={() => setView(o.key)}
                  className="h-4 w-4 accent-blue-600"
                />
                {o.label}
              </span>
              <span className="tabular-nums text-slate-400">{viewCount(o.key)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {branches.length > 0 && (
        <fieldset>
          <legend className="mb-2 flex w-full items-center justify-between text-sm font-bold text-slate-900">
            สาขาวิชา
            {branchIds.length > 0 && (
              <button type="button" onClick={() => setBranchIds([])} className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer">
                ล้าง
              </button>
            )}
          </legend>
          <div className="space-y-1">
            {branches.map((b) => {
              const on = branchIds.includes(b.id);
              return (
                <label
                  key={b.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                    on ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <input type="checkbox" checked={on} onChange={() => toggleBranch(b.id)} className="h-4 w-4 rounded accent-blue-600" />
                    {b.name}
                  </span>
                  <span className="tabular-nums text-slate-400">{branchCount(b.id)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );

  // ===== รายการหลักสูตร 1 แถว =====
  const TopicRow = ({ topic, status }: Row) => {
    const c = branchColor(topic.branch_id);
    const d = thaiParts(topic.trainingDate);
    const regCount = registeredOf(topic);
    const max = topic.maxParticipants > 0 ? topic.maxParticipants : 0;
    const percent = max > 0 ? Math.min(100, Math.round((regCount / max) * 100)) : 0;
    const remaining = max > 0 ? Math.max(0, max - regCount) : null;
    const dim = status.disabled;

    return (
      <article
        className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition sm:flex-row ${
          status.isRegistered ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300 hover:shadow-md"
        }`}
      >
        {/* วันที่ */}
        <div
          className={`flex items-center gap-3 px-5 py-3 text-white sm:w-32 sm:flex-shrink-0 sm:flex-col sm:justify-center sm:gap-0 sm:py-5 ${
            dim ? "bg-slate-400" : c.solid
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

        {/* เนื้อหา */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-sm font-bold ${dim ? "text-slate-500" : c.text}`}>{topic.branch?.name || "สาขาทั่วไป"}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLE[status.key]}`}>
                {status.isRegistered && <CheckCircle2 className="h-3.5 w-3.5" />}
                {status.label}
              </span>
              {topic.hasLineGroup && (
                <span
                  title="ผู้สมัครจะได้รับ QR เข้ากลุ่มไลน์ของหลักสูตร"
                  className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  มีกลุ่มไลน์
                </span>
              )}
            </div>
            <h3 className={`mt-1 text-xl font-bold leading-snug ${dim ? "text-slate-600" : "text-slate-900"}`}>
              <button
                type="button"
                onClick={() => setViewingDetailsTopic(topic)}
                className={`text-left hover:text-blue-700 hover:underline cursor-pointer ${ring}`}
              >
                {topic.name}
              </button>
            </h3>
            <ul className="mt-2.5 flex flex-col gap-x-5 gap-y-1.5 text-[15px] text-slate-600 xl:flex-row xl:flex-wrap">
              {topic.location && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
                  <span className="line-clamp-2">{topic.location}</span>
                </li>
              )}
              {topic.audience && (
                <li className="flex items-start gap-2">
                  <GraduationCap className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-500" />
                  {topic.audience}
                </li>
              )}
              {topic.teacherName && (
                <li className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  {topic.teacherName}
                </li>
              )}
            </ul>
          </div>

          {/* ที่นั่ง + ปุ่ม */}
          <div className="flex flex-col gap-3 lg:w-60 lg:flex-shrink-0">
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <span className={`font-semibold ${remaining === 0 ? "text-rose-600" : "text-slate-700"}`}>
                  {max > 0 ? (remaining === 0 ? "เต็มแล้ว" : `เหลือ ${remaining} ที่`) : "ไม่จำกัดที่นั่ง"}
                </span>
                <span className="tabular-nums text-slate-500">
                  {regCount}
                  {max > 0 && `/${max}`} คน
                </span>
              </div>
              {max > 0 && (
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${percent >= 100 ? "bg-rose-500" : percent >= 80 ? "bg-amber-400" : "bg-emerald-500"}`}
                    style={{ width: `${Math.max(percent, 3)}%` }}
                  />
                </div>
              )}
            </div>

            {status.isRegistered ? (
              <button
                type="button"
                onClick={() => navigate("/training/my")}
                className={`flex items-center justify-center gap-2 rounded-xl border border-blue-600 bg-white py-2.5 font-bold text-blue-700 transition hover:bg-blue-50 cursor-pointer ${ring}`}
              >
                <Award className="h-4 w-4" />
                ดูการสมัคร / เกียรติบัตร
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenRegisterModal(topic)}
                disabled={dim}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-bold transition ${ring} ${
                  dim ? "cursor-not-allowed bg-slate-100 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                }`}
              >
                {dim ? status.label : isAuthenticated ? "สมัครเข้าร่วม" : "เข้าสู่ระบบเพื่อสมัคร"}
                {!dim && <ArrowRight className="h-4 w-4" />}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button
                type="button"
                onClick={() => setViewingDetailsTopic(topic)}
                className={`flex items-center justify-center gap-1.5 rounded-xl bg-sky-50 py-2.5 font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100 hover:ring-sky-300 cursor-pointer ${ring}`}
              >
                <BookOpen className="h-4 w-4" />
                รายละเอียด
              </button>
              <button
                type="button"
                onClick={() => setViewingRegistrantsTopic(topic)}
                className={`flex items-center justify-center gap-1.5 rounded-xl bg-violet-50 py-2.5 font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100 hover:ring-violet-300 cursor-pointer ${ring}`}
              >
                <Users className="h-4 w-4" />
                ผู้สมัคร {regCount > 0 && <span className="tabular-nums text-violet-500">({regCount})</span>}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {lineFor && (
        <TrainingLineModal topicName={lineFor.topicName} group={lineFor.group} justRegistered onClose={() => setLineFor(null)} />
      )}
      {/* ===== ส่วนหัว ===== */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 2xl:max-w-[1600px]">
          <nav aria-label="breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-slate-500">
            <Link to="/" className="hover:text-blue-700 hover:underline">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-slate-700">กิจกรรมการอบรม</span>
          </nav>

          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">กิจกรรมการอบรม</h1>
              <p className="mt-2 max-w-2xl text-lg text-slate-600">
                หลักสูตรอบรมจากคณะวิทยาศาสตร์และเทคโนโลยี เปิดให้ครู นักเรียน และบุคคลทั่วไปสมัครเข้าร่วม
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate("/training/my")}
                className={`inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 cursor-pointer ${ring}`}
              >
                <Award className="h-5 w-5" />
                การสมัครของฉัน / เกียรติบัตร
                {mineCount > 0 && <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">{mineCount}</span>}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className={`inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 cursor-pointer ${ring}`}
              >
                <LogIn className="h-5 w-5" />
                เข้าสู่ระบบเพื่อสมัคร
              </button>
            )}
            </div>
          </div>

          {/* จุดเด่น */}
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: <Gift className="h-5 w-5" />, title: "เข้าร่วมฟรี", desc: "ไม่มีค่าใช้จ่ายทุกหลักสูตร", tone: "bg-emerald-100 text-emerald-700" },
              { icon: <BadgeCheck className="h-5 w-5" />, title: "มีเกียรติบัตร", desc: "ดาวน์โหลดได้หลังสมัคร", tone: "bg-amber-100 text-amber-700" },
              { icon: <Users className="h-5 w-5" />, title: "เปิดให้บุคคลภายนอก", desc: "สมัครด้วยบัญชีของเว็บไซต์นี้", tone: "bg-blue-100 text-blue-700" },
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

      {/* ===== เนื้อหา ===== */}
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8 2xl:max-w-[1600px] 2xl:grid-cols-[300px_1fr]">
        {/* ตัวกรอง: desktop = แถบข้าง, mobile = พับได้ */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={`flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-800 lg:hidden cursor-pointer ${ring}`}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-slate-500" />
              ค้นหาและตัวกรอง
              {hasFilter && <span className="h-2 w-2 rounded-full bg-blue-600" />}
            </span>
            <ChevronDown className={`h-5 w-5 text-slate-400 transition ${filtersOpen ? "rotate-180" : ""}`} />
          </button>
          <div className={`${filtersOpen ? "mt-3 block" : "hidden"} rounded-2xl border border-slate-200 bg-white p-5 lg:mt-0 lg:block`}>
            {filterPanel}
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-slate-600" aria-live="polite">
              {isLoading ? "กำลังโหลด..." : <>พบ <b className="text-slate-900">{visible.length}</b> หลักสูตร</>}
            </p>
            {hasFilter && (
              <button type="button" onClick={clearFilters} className={`text-sm font-semibold text-blue-700 hover:underline cursor-pointer ${ring}`}>
                ล้างตัวกรอง
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4" aria-busy="true">
              {Array.from({ length: 4 }, (_, i) => (
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
              <h2 className="mt-4 text-lg font-bold text-slate-900">โหลดหลักสูตรอบรมไม่สำเร็จ</h2>
              <p className="text-slate-500">กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต แล้วลองใหม่อีกครั้ง</p>
              <button
                type="button"
                onClick={() => refetch()}
                className={`mt-5 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 cursor-pointer ${ring}`}
              >
                ลองใหม่
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <BookOpen className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                {hasFilter ? "ไม่พบหลักสูตรที่ค้นหา" : view === "mine" ? "คุณยังไม่ได้สมัครหลักสูตรใด" : "ยังไม่มีหลักสูตรที่เปิดรับสมัคร"}
              </h2>
              <p className="text-slate-500">
                {hasFilter ? "ลองใช้คำอื่น หรือเลือกสาขาวิชาอื่น" : "ติดตามหลักสูตรใหม่ได้ที่หน้านี้"}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {hasFilter && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={`rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer ${ring}`}
                  >
                    ล้างตัวกรอง
                  </button>
                )}
                {view !== "all" && (
                  <button
                    type="button"
                    onClick={() => setView("all")}
                    className={`rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 cursor-pointer ${ring}`}
                  >
                    ดูทุกหลักสูตร
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {visible.map((r) => (
                <TopicRow key={r.topic.id} {...r} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ===== Modal: รายละเอียด ===== */}
      {viewingDetailsTopic &&
        (() => {
          const t = viewingDetailsTopic;
          const st = getRegistrationStatus(t);
          const c = branchColor(t.branch_id);
          return (
            <Modal
              title="รายละเอียดการอบรม"
              icon={<BookOpen className="h-5 w-5 text-blue-600" />}
              onClose={() => setViewingDetailsTopic(null)}
              size="max-w-4xl"
              footer={
                <>
                  <button
                    type="button"
                    onClick={() => setViewingDetailsTopic(null)}
                    className={`rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-100 cursor-pointer ${ring}`}
                  >
                    ปิด
                  </button>
                  {!st.disabled && !st.isRegistered && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewingDetailsTopic(null);
                        handleOpenRegisterModal(t);
                      }}
                      className={`inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white transition hover:bg-blue-700 cursor-pointer ${ring}`}
                    >
                      {isAuthenticated ? "สมัครเข้าร่วม" : "เข้าสู่ระบบเพื่อสมัคร"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </>
              }
            >
              <div className="space-y-5 text-base">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-bold ${c.text}`}>{t.branch?.name || "สาขาทั่วไป"}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLE[st.key]}`}>{st.label}</span>
                  </div>
                  <h4 className="mt-1 text-2xl font-bold leading-snug text-slate-900">{t.name}</h4>
                </div>

                <div className="grid gap-5 md:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <h5 className="text-sm font-bold text-slate-900">เกี่ยวกับหลักสูตร</h5>
                  <p className="whitespace-pre-line leading-relaxed text-slate-700">
                    {t.description || <span className="text-slate-400">ไม่มีคำอธิบายหลักสูตร</span>}
                  </p>
                  {t.trainingtopicsrequirements && (
                    <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-bold text-amber-800">สิ่งที่ต้องเตรียมมา</p>
                        <p className="whitespace-pre-line text-amber-900">{t.trainingtopicsrequirements}</p>
                      </div>
                    </div>
                  )}
                </div>

                <dl className="h-fit divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/60">
                  {[
                    { icon: <CalendarDays className="h-5 w-5 text-blue-500" />, label: "วันที่อบรม", value: t.trainingDate ? formatThaiDate(t.trainingDate) : "รอประกาศ" },
                    { icon: <MapPin className="h-5 w-5 text-rose-500" />, label: "สถานที่และเวลา", value: t.location },
                    { icon: <GraduationCap className="h-5 w-5 text-violet-500" />, label: "ผู้เข้าร่วม", value: t.audience },
                    { icon: <User className="h-5 w-5 text-amber-500" />, label: "วิทยากร", value: t.teacherName },
                    {
                      icon: <Users className="h-5 w-5 text-emerald-500" />,
                      label: "ผู้สมัคร",
                      value: `${registeredOf(t)}${t.maxParticipants > 0 ? ` / ${t.maxParticipants}` : ""} คน`,
                    },
                  ]
                    .filter((r) => r.value)
                    .map((r) => (
                      <div key={r.label} className="flex items-start gap-3 px-4 py-3">
                        <span className="mt-0.5">{r.icon}</span>
                        <div className="min-w-0">
                          <dt className="text-xs font-semibold text-slate-500">{r.label}</dt>
                          <dd className="whitespace-pre-line text-slate-800">{r.value}</dd>
                        </div>
                      </div>
                    ))}
                </dl>
                </div>
              </div>
            </Modal>
          );
        })()}

      <RegistrantsModal topic={viewingRegistrantsTopic} onClose={() => setViewingRegistrantsTopic(null)} />

      {/* ===== Modal: สมัคร ===== */}
      {registeringTopic && (
        <Modal title="สมัครเข้าร่วมอบรม" onClose={() => setRegisteringTopic(null)} size="max-w-3xl">
          <form onSubmit={handleRegisterSubmit} noValidate className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-lg font-bold leading-snug text-slate-900">{registeringTopic.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {registeringTopic.trainingDate ? formatThaiDate(registeringTopic.trainingDate) : "รอประกาศวันอบรม"}
                {registeringTopic.teacherName && ` · ${registeringTopic.teacherName}`}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-[170px_1fr_1fr]">
            <div>
              <label htmlFor="reg-prefix" className="mb-1.5 block text-sm font-semibold text-slate-700">
                คำนำหน้าชื่อ
              </label>
              <select id="reg-prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} className={inputClass}>
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
                <option value="เด็กชาย">เด็กชาย</option>
                <option value="เด็กหญิง">เด็กหญิง</option>
              </select>
            </div>
              {(
                [
                  { id: "reg-first", label: "ชื่อ", value: firstName, set: setFirstName, err: nameErrors.firstName },
                  { id: "reg-last", label: "นามสกุล", value: lastName, set: setLastName, err: nameErrors.lastName },
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

            {/* ตัวอย่างชื่อบนเกียรติบัตร */}
            <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 px-4 py-4 text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-800">
                <Award className="h-4 w-4" />
                ชื่อที่จะพิมพ์บนเกียรติบัตร
              </p>
              <p className="mt-1 min-h-[1.75rem] text-xl font-bold text-blue-800">
                {firstName.trim() || lastName.trim() ? `${prefix}${firstName.trim()} ${lastName.trim()}` : "—"}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRegisteringTopic(null)}
                className={`rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-100 cursor-pointer ${ring}`}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isRegistering}
                className={`inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer ${ring}`}
              >
                {isRegistering ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                {isRegistering ? "กำลังบันทึก..." : "ยืนยันการสมัคร"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// รายชื่อผู้สมัคร (ไม่รวมผู้ที่ยกเลิก)
const RegistrantsModal = ({ topic, onClose }: { topic: TrainingTopic | null; onClose: () => void }) => {
  const { data: registrations = [], isLoading } = useGetAllTrainingRegistrationsQuery(topic?.id || 0, { skip: !topic });

  if (!topic) return null;

  const validRegistrations = registrations.filter((r) => r.status !== "ยกเลิกแล้ว");

  return (
    <Modal title="รายชื่อผู้สมัคร" icon={<Users className="h-5 w-5 text-blue-600" />} onClose={onClose} size="max-w-3xl">
      <p className="text-xl font-bold leading-snug text-slate-900">{topic.name}</p>
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      ) : validRegistrations.length === 0 ? (
        <p className="py-10 text-center text-slate-500">ยังไม่มีผู้สมัครในหลักสูตรนี้</p>
      ) : (
        <>
          <p className="mb-3 mt-1 text-sm text-slate-500">ทั้งหมด {validRegistrations.length} คน</p>
          <ol className="grid gap-2 md:grid-cols-2">
            {validRegistrations.map((reg, index) => (
              <li key={reg.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-slate-800">
                <span className="w-6 text-right text-sm tabular-nums text-slate-400">{index + 1}.</span>
                {reg.prefix || ""}
                {reg.firstName} {reg.lastName}
              </li>
            ))}
          </ol>
        </>
      )}
    </Modal>
  );
};

export default TrainingTopicsListPage;
