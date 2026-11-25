import { useEffect, useMemo, useState } from "react";
import { useGetTrainingTopicsQuery, useDeleteTrainingTopicMutation, useUpdateTrainingTopicMutation, useCopyTrainingYearMutation } from "../trainingApi";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  CalendarDays,
  Clock,
  Copy,
  Edit2,
  FileText,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetAllYearQuery } from "../../Year/YearApi";
import TablePagination from "@mui/material/TablePagination";
import { showSuccessOk, showError } from "../../../utils/confirmDelete";
import Swal from "sweetalert2";
import type { TrainingTopic } from "../type";
import PdfPreviewModal from "../../../components/PdfPreviewModal";
import { fetchExportBlob } from "../../../Apis/Export";
import { usePagination } from "../../../utils/usePagination";
import { formatThaiDate } from "../../../utils/dateUtils";
import { useGetSystemSettingsQuery } from "../../setting/systemSettingsApi";

type StatusFilter = "all" | "open" | "closed";

const registeredOf = (t: TrainingTopic) => (t as TrainingTopic & { registeredCount?: number }).registeredCount ?? 0;

const timeText = (t: TrainingTopic) =>
  t.startTime ? `${t.startTime.substring(0, 5)}${t.endTime ? ` - ${t.endTime.substring(0, 5)}` : ""} น.` : null;

// จำนวนผู้สมัคร + แถบความเต็ม
const Seats = ({ topic }: { topic: TrainingTopic }) => {
  const count = registeredOf(topic);
  const max = topic.maxParticipants;
  if (!max || max <= 0)
    return (
      <div className="text-sm">
        <span className="font-bold text-slate-900">{count}</span>
        <span className="text-slate-500"> คน · ไม่จำกัด</span>
      </div>
    );
  const pct = Math.min(100, Math.round((count / max) * 100));
  const full = count >= max;
  return (
    <div className="w-36">
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span>
          <span className="font-bold text-slate-900">{count}</span>
          <span className="text-slate-500"> / {max} คน</span>
        </span>
        {full && <span className="text-xs font-semibold text-rose-600">เต็ม</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${full ? "bg-rose-500" : pct >= 80 ? "bg-amber-400" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// วันเวลาจาก server เป็น UTC (บางครั้งไม่มี Z)
const parseUtc = (iso?: string) => (iso ? new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`) : null);

// สวิตช์เปิด/ปิดรับสมัคร กดได้จากรายการเลย
const OpenSwitch = ({ topic, busy, onToggle }: { topic: TrainingTopic; busy: boolean; onToggle: () => void }) => {
  const open = topic.isOpenRegister;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={open}
      aria-label={`${open ? "ปิด" : "เปิด"}รับสมัคร ${topic.name}`}
      title={open ? "กดเพื่อปิดรับสมัคร" : "กดเพื่อเปิดรับสมัคร"}
      onClick={onToggle}
      disabled={busy}
      className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full py-1 pl-1 pr-3 text-xs font-semibold transition cursor-pointer disabled:cursor-wait disabled:opacity-60 hover:bg-slate-100"
    >
      <span className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${open ? "bg-emerald-500" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${open ? "left-[22px]" : "left-0.5"}`} />
      </span>
      <span className={open ? "text-emerald-700" : "text-slate-500"}>{busy ? "กำลังบันทึก..." : open ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}</span>
    </button>
  );
};

type YearGroup = { key: string; label: string; topics: TrainingTopic[] };

// ป้าย "กำลังใช้งาน" = ปีที่ตั้งค่าให้แสดงบนหน้าเว็บ (ตั้งค่าระบบ)
const LiveBadge = () => (
  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 align-middle text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
    กำลังใช้งานบนหน้าเว็บ
  </span>
);

// หน้าแรก: ตารางปีการจัดงาน กดแถวเพื่อดูหลักสูตรของปีนั้น
const YearOverview = ({
  groups,
  onOpen,
  onAdd,
  onCopy,
  liveKey,
}: {
  liveKey?: string;
  groups: YearGroup[];
  onOpen: (key: string) => void;
  onAdd: () => void;
  onCopy: (g: YearGroup) => void;
}) => (
  <div className="mx-auto w-full max-w-[1600px] space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <BookOpen className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">หลักสูตรอบรม</h1>
          <p className="text-sm text-slate-500">เลือกปีการจัดงานเพื่อดูและจัดการหลักสูตรของปีนั้น</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        เพิ่มหลักสูตรใหม่
      </button>
    </div>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {groups.length === 0 ? (
        <p className="px-4 py-16 text-center text-slate-500">ยังไม่มีปีการจัดงาน กรุณาเพิ่มปีในเมนูจัดการปีก่อน</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-sm font-semibold">
              <tr>
                <th className="px-5 py-3 text-slate-600">ปีการจัดงาน</th>
                <th className="px-5 py-3 text-center text-blue-700">
                  <span className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4" />หลักสูตร</span>
                </th>
                <th className="px-5 py-3 text-center text-emerald-700">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />เปิดรับสมัครอยู่</span>
                </th>
                <th className="px-5 py-3 text-center text-violet-700">
                  <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />ผู้สมัครรวม</span>
                </th>
                <th className="w-80 px-5 py-3">
                  <span className="sr-only">ดูหลักสูตร</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((g) => {
                const open = g.topics.filter((t) => t.isOpenRegister).length;
                const registered = g.topics.reduce((sum, t) => sum + registeredOf(t), 0);
                const none = g.key === "none";
                return (
                  <tr
                    key={g.key}
                    onClick={() => onOpen(g.key)}
                    className={`cursor-pointer border-l-4 transition-colors hover:bg-slate-50 ${none ? "border-l-amber-400 bg-amber-50/50" : g.key === liveKey ? "border-l-emerald-500" : "border-l-transparent"}`}
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-3">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${none ? "bg-amber-100 text-amber-700" : g.key === liveKey ? "bg-emerald-600 text-white" : "bg-blue-50 text-blue-700"}`}>
                          <CalendarDays className="h-5 w-5" />
                        </span>
                        <span className={`text-xl font-bold ${none ? "text-amber-700" : "text-slate-900"}`}>{g.label}</span>
                      </span>
                      {g.key === liveKey && <LiveBadge />}
                      {none && <p className="text-sm text-amber-700">ยังไม่ได้เลือกปี กดเข้าไปแก้ไขแต่ละหลักสูตร</p>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex min-w-12 justify-center rounded-xl bg-blue-50 px-3 py-1.5 text-lg font-bold tabular-nums text-blue-700">{g.topics.length}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex min-w-12 justify-center rounded-xl px-3 py-1.5 text-lg font-bold tabular-nums ${open > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{open}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex min-w-12 justify-center rounded-xl bg-violet-50 px-3 py-1.5 text-lg font-bold tabular-nums text-violet-700">{registered}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                      {!none && g.topics.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopy(g);
                          }}
                          title="คัดลอกหลักสูตรทั้งหมดของปีนี้ไปปีอื่น"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100 cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                          คัดลอกไปปีอื่น
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpen(g.key);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
                      >
                        ดูหลักสูตร
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </div>
);

const AdminTrainingTopicsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const yearParam = searchParams.get("year");
  const { data: allTopics = [], isLoading, isFetching, refetch } = useGetTrainingTopicsQuery();
  const { data: years = [], isLoading: yearsLoading } = useGetAllYearQuery();
  const { data: settings } = useGetSystemSettingsQuery();
  const liveKey = settings?.homeDisplayYearId ? String(settings.homeDisplayYearId) : undefined;

  // จัดกลุ่มหลักสูตรตามปี (ปีใหม่ก่อน) และกลุ่ม "ไม่ระบุปี" ถ้ามี
  const yearGroups = useMemo<YearGroup[]>(() => {
    const groups: YearGroup[] = [...years]
      .sort((a, b) => b.yearNumber - a.yearNumber)
      .map((y) => ({
        key: String(y.yearID),
        label: y.yearName || `ปี ${y.yearNumber}`,
        topics: allTopics.filter((t) => t.yearID === y.yearID),
      }));
    const known = new Set(years.map((y) => y.yearID));
    const orphan = allTopics.filter((t) => !t.yearID || !known.has(t.yearID));
    if (orphan.length > 0) groups.push({ key: "none", label: "ไม่ระบุปี", topics: orphan });
    return groups;
  }, [years, allTopics]);

  const currentGroup = yearGroups.find((g) => g.key === yearParam);
  const topics = useMemo(() => currentGroup?.topics ?? [], [currentGroup]);
  const newUrl = yearParam && yearParam !== "none" ? `/admin/trainingtopics/new?year=${yearParam}` : "/admin/trainingtopics/new";
  const [deleteTopic] = useDeleteTrainingTopicMutation();
  const [updateTopic] = useUpdateTrainingTopicMutation();
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [copyYear] = useCopyTrainingYearMutation();
  const handleCopyYear = async (from: YearGroup) => {
    const targets = yearGroups.filter((g) => g.key !== "none" && g.key !== from.key);
    if (targets.length === 0) {
      showError("ยังไม่มีปีอื่นให้คัดลอกไป กรุณาเพิ่มปีในเมนูจัดการปีก่อน");
      return;
    }
    const { value: toKey } = await Swal.fire({
      title: `คัดลอกหลักสูตรปี ${from.label}`,
      html:
        `คัดลอก <b>${from.topics.length} หลักสูตร</b> ไปยังปีที่เลือก<br/>` +
        `<small>วันที่จะเลื่อนตามจำนวนปี · ตั้งเป็น "ปิดรับสมัคร" ไว้ก่อน · ไม่คัดลอกผู้สมัคร · ชื่อที่มีอยู่แล้วจะข้าม</small>`,
      input: "select",
      // ใช้ Map เพื่อคงลำดับปีล่าสุดก่อน (object ที่ key เป็นตัวเลขจะถูกเรียงจากน้อยไปมาก)
      inputOptions: new Map(targets.map((g) => [g.key, `ปี ${g.label} (มีอยู่ ${g.topics.length} หลักสูตร)`])),
      inputPlaceholder: "— เลือกปีปลายทาง —",
      inputValidator: (v) => (!v ? "กรุณาเลือกปีปลายทาง" : undefined),
      showCancelButton: true,
      confirmButtonText: "คัดลอก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#2563eb",
      width: 720,
    });
    if (!toKey) return;
    try {
      const r = await copyYear({ fromYearId: Number(from.key), toYearId: Number(toKey) }).unwrap();
      const to = targets.find((g) => g.key === toKey)?.label;
      await Swal.fire({
        icon: "success",
        title: `คัดลอกไปปี ${to} แล้ว`,
        html: `เพิ่ม <b>${r.copied}</b> หลักสูตร${r.skipped ? ` · ข้าม ${r.skipped} หลักสูตรที่มีชื่อซ้ำ` : ""}<br/><small>ตรวจวันที่แล้วเปิดรับสมัครได้ที่หน้าของปีนั้น</small>`,
        confirmButtonText: `ไปที่ปี ${to}`,
        showCancelButton: true,
        cancelButtonText: "ปิด",
        width: 640,
      }).then((res) => res.isConfirmed && setSearchParams({ year: toKey }));
      refetch();
    } catch (err: any) {
      showError(err?.data?.errorMessages?.[0] || "คัดลอกไม่สำเร็จ");
    }
  };

  const handleToggleOpen = async (topic: TrainingTopic) => {
    const opening = !topic.isOpenRegister;
    const end = parseUtc(topic.registerEndDate);
    if (opening && end && end < new Date()) {
      const r = await Swal.fire({
        title: "เลยวันปิดรับสมัครแล้ว",
        text: "ถ้าจะเปิดรับต่อ ต้องเลื่อนวันปิดรับสมัครก่อน ไปหน้าแก้ไขเลยไหม",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "ไปแก้ไขวันปิดรับ",
        cancelButtonText: "ไม่ใช่ตอนนี้",
      });
      if (r.isConfirmed) navigate(`/admin/trainingtopics/${topic.id}/edit`);
      return;
    }
    setTogglingId(topic.id);
    try {
      await updateTopic({ id: topic.id, body: { ...topic, isOpenRegister: opening } }).unwrap();
      refetch();
    } catch (err: any) {
      showError(err?.data?.errorMessages?.[0] || "บันทึกสถานะไม่สำเร็จ");
    } finally {
      setTogglingId(null);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [showPdf, setShowPdf] = useState(false);
  const hasRegistrations = topics.some((t) => registeredOf(t) > 0);
  const [branchId, setBranchId] = useState<number | "all">("all");
  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage, setPage } = usePagination();

  const branches = useMemo(() => {
    const map = new Map<number, string>();
    topics.forEach((t) => t.branch && map.set(t.branch.id, t.branch.name));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "th"));
  }, [topics]);

  const counts = useMemo(
    () => ({
      all: topics.length,
      open: topics.filter((t) => t.isOpenRegister).length,
      closed: topics.filter((t) => !t.isOpenRegister).length,
    }),
    [topics],
  );

  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return topics
      .filter((t) => (status === "all" ? true : status === "open" ? t.isOpenRegister : !t.isOpenRegister))
      .filter((t) => branchId === "all" || t.branch?.id === branchId)
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.teacherName?.toLowerCase().includes(q) ||
          t.location?.toLowerCase().includes(q),
      )
      // วันอบรมล่าสุดก่อน ไม่มีวันอยู่ท้าย
      .sort((a, b) => (b.trainingDate ?? "").localeCompare(a.trainingDate ?? ""));
  }, [topics, searchQuery, status, branchId]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, status, branchId, setPage]);

  const pagedTopics = filteredTopics.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleDelete = async (topic: TrainingTopic) => {
    const result = await Swal.fire({
      title: "ลบหลักสูตรนี้?",
      html: `<b>${topic.name.replace(/[<>&"]/g, "")}</b><br/>รายชื่อผู้ลงทะเบียน ${registeredOf(topic)} คนในหลักสูตรนี้จะถูกลบด้วย`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      confirmButtonText: "ลบหลักสูตร",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteTopic(topic.id).unwrap();
      showSuccessOk("ลบหลักสูตรอบรมสำเร็จ");
      refetch();
    } catch (err: any) {
      showError(err?.data?.errorMessages?.[0] || "ไม่สามารถลบข้อมูลได้ในขณะนี้");
    }
  };

  const actions = (topic: TrainingTopic, full = false) => (
    <div className={`flex items-center gap-1.5 ${full ? "" : "justify-end"}`}>
      <button
        type="button"
        onClick={() => navigate(`/admin/trainingtopics/${topic.id}/registrations`)}
        className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer ${full ? "flex-1" : ""}`}
      >
        <Users className="h-4 w-4" />
        รายชื่อผู้สมัคร
      </button>
      <button
        type="button"
        onClick={() => navigate(`/admin/trainingtopics/${topic.id}/edit`)}
        title="แก้ไขหลักสูตร"
        aria-label={`แก้ไข ${topic.name}`}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100 cursor-pointer"
      >
        <Edit2 className="h-4 w-4" />
        <span className={full ? "" : "hidden xl:inline"}>แก้ไข</span>
      </button>
      <button
        type="button"
        onClick={() => navigate(`/admin/trainingtopics/new?copy=${topic.id}${topic.yearID ? `&year=${topic.yearID}` : ""}`)}
        title="คัดลอกเป็นหลักสูตรใหม่"
        aria-label={`คัดลอก ${topic.name}`}
        className="inline-flex items-center justify-center rounded-xl bg-sky-50 p-2 text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100 cursor-pointer"
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => handleDelete(topic)}
        title="ลบหลักสูตร"
        aria-label={`ลบ ${topic.name}`}
        className="inline-flex items-center justify-center rounded-xl bg-rose-50 p-2 text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-100 cursor-pointer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  if (isLoading || yearsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <YearOverview
        groups={yearGroups}
        onOpen={(key) => setSearchParams({ year: key })}
        onAdd={() => navigate(newUrl)}
        onCopy={handleCopyYear}
        liveKey={liveKey}
      />
    );
  }

  const hasFilter = !!searchQuery || status !== "all" || branchId !== "all";
  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "open", label: "เปิดรับสมัคร" },
    { key: "closed", label: "ปิดรับสมัคร" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            aria-label="กลับไปเลือกปี"
            title="กลับไปเลือกปี"
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-sm text-slate-500">
              <button type="button" onClick={() => setSearchParams({})} className="hover:text-blue-600 hover:underline cursor-pointer">
                หลักสูตรอบรม
              </button>
              <span className="mx-1.5">/</span>
              {currentGroup.label}
            </p>
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900">
              {currentGroup.key === "none" ? "หลักสูตรที่ยังไม่ระบุปี" : currentGroup.label}
              {currentGroup.key === liveKey && <LiveBadge />}
              {isFetching && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
            </h1>
            {currentGroup.key === "none" && (
              <p className="text-sm text-amber-700">หลักสูตรเหล่านี้ยังไม่ได้ระบุปี กดแก้ไขแล้วเลือกปีการจัดงาน</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentGroup.key !== "none" && (
            <button
              type="button"
              onClick={() => setShowPdf(true)}
              disabled={!hasRegistrations}
              title={hasRegistrations ? "ทุกหลักสูตรในไฟล์เดียว แต่ละหลักสูตรขึ้นหน้าใหม่" : "ยังไม่มีผู้ลงทะเบียนในปีนี้"}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <FileText className="h-4 w-4 text-blue-600" />
              ใบลงชื่อทุกหลักสูตร (PDF)
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(newUrl)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            เพิ่มหลักสูตรใหม่
          </button>
        </div>
      </div>

      {showPdf && (
        <PdfPreviewModal
          title={`ใบลงชื่อผู้เข้าอบรม ${currentGroup.label}`}
          fileName={`ใบลงชื่อผู้เข้าอบรม-${currentGroup.label}.pdf`}
          load={() => fetchExportBlob(`trainingSignInSheet/year/${currentGroup.key}`)}
          onClose={() => setShowPdf(false)}
        />
      )}

      {/* สรุปของปี */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "หลักสูตรทั้งหมด", value: topics.length, tone: "bg-blue-50 text-blue-700", icon: <BookOpen className="h-5 w-5" /> },
          { label: "เปิดรับสมัครอยู่", value: counts.open, tone: "bg-emerald-50 text-emerald-700", icon: <CalendarDays className="h-5 w-5" /> },
          { label: "ผู้สมัครรวม", value: topics.reduce((s, t) => s + registeredOf(t), 0), tone: "bg-violet-50 text-violet-700", icon: <Users className="h-5 w-5" /> },
          {
            label: "หลักสูตรที่เต็มแล้ว",
            value: topics.filter((t) => t.maxParticipants > 0 && registeredOf(t) >= t.maxParticipants).length,
            tone: "bg-amber-50 text-amber-700",
            icon: <User className="h-5 w-5" />,
          },
        ].map((k) => (
          <div key={k.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${k.tone}`}>{k.icon}</span>
            <div>
              <p className="text-2xl font-bold tabular-nums text-slate-900">{k.value}</p>
              <p className="text-sm text-slate-500">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label="สถานะรับสมัคร">
            {tabs.map((t) => {
              const active = status === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatus(t.key)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition cursor-pointer ${
                    active ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t.label}
                  <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${active ? "bg-white/20" : "bg-white text-slate-500"}`}>
                    {counts[t.key]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {branches.length > 0 && (
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value === "all" ? "all" : Number(e.target.value))}
                aria-label="สาขาวิชา"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="all">ทุกสาขาวิชา</option>
                {branches.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            )}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อหลักสูตร วิทยากร สถานที่"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredTopics.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">{hasFilter ? "ไม่พบหลักสูตรที่ตรงกับการค้นหา" : "ยังไม่มีหลักสูตรอบรม"}</p>
            {!hasFilter && (
              <button
                type="button"
                onClick={() => navigate(newUrl)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> เพิ่มหลักสูตรแรก
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="px-5 py-3 text-blue-700">
                      <span className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4" />หลักสูตร</span>
                    </th>
                    <th className="px-5 py-3 text-sky-700">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />วันอบรม</span>
                    </th>
                    <th className="px-5 py-3 text-amber-700">
                      <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" />วิทยากร / สถานที่</span>
                    </th>
                    <th className="px-5 py-3 text-violet-700">
                      <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />ผู้สมัคร</span>
                    </th>
                    <th className="px-5 py-3 text-emerald-700">สถานะ</th>
                    <th className="px-5 py-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pagedTopics.map((topic) => (
                    <tr key={topic.id} className={`border-l-4 align-top transition-colors hover:bg-blue-50/40 ${topic.isOpenRegister ? "border-l-emerald-500" : "border-l-slate-200"}`}>
                      <td className="max-w-sm px-5 py-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/trainingtopics/${topic.id}/registrations`)}
                          className="text-left text-base font-semibold leading-snug text-slate-900 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          {topic.name}
                        </button>
                        <span className="mt-1 inline-block rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                          {topic.branch?.name || "สาขาทั่วไป"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {topic.trainingDate ? (
                          <>
                            <p className="flex items-center gap-1.5 font-medium text-slate-800">
                              <CalendarDays className="h-4 w-4 text-sky-500" />
                              {formatThaiDate(topic.trainingDate)}
                            </p>
                            {timeText(topic) && (
                              <p className="mt-1 flex items-center gap-1.5 text-slate-500">
                                <Clock className="h-4 w-4 text-sky-500" />
                                {timeText(topic)}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">ยังไม่กำหนด</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="flex items-center gap-1.5">
                          <User className="h-4 w-4 flex-shrink-0 text-amber-500" />
                          {topic.teacherName || <span className="text-slate-400">ไม่ระบุ</span>}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-slate-500">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-rose-500" />
                          {topic.location || <span className="text-slate-400">ไม่ระบุ</span>}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Seats topic={topic} />
                      </td>
                      <td className="px-5 py-4">
                        <OpenSwitch topic={topic} busy={togglingId === topic.id} onToggle={() => handleToggleOpen(topic)} />
                      </td>
                      <td className="px-5 py-4">{actions(topic)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {pagedTopics.map((topic) => (
                <li key={topic.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{topic.name}</p>
                      <span className="mt-1 inline-block rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                        {topic.branch?.name || "สาขาทั่วไป"}
                      </span>
                    </div>
                    <OpenSwitch topic={topic} busy={togglingId === topic.id} onToggle={() => handleToggleOpen(topic)} />
                  </div>
                  <div className="grid gap-1.5 text-sm text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-sky-500" />
                      {topic.trainingDate ? formatThaiDate(topic.trainingDate) : "ยังไม่กำหนดวัน"}
                      {timeText(topic) && <span className="text-slate-400">· {timeText(topic)}</span>}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-amber-500" />
                      {topic.teacherName || "ไม่ระบุวิทยากร"}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-rose-500" />
                      {topic.location || "ไม่ระบุสถานที่"}
                    </p>
                  </div>
                  <Seats topic={topic} />
                  {actions(topic, true)}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="border-t border-slate-200">
          <TablePagination
            component="div"
            sx={{ color: "#334155", fontFamily: "inherit", ".MuiTablePagination-toolbar": { flexWrap: "wrap" } }}
            count={filteredTopics.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="แถวต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
          />
        </div>
      </section>
    </div>
  );
};

export default AdminTrainingTopicsPage;
