import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetAllTrainingRegistrationsQuery, useGetTrainingTopicByIdQuery } from "../trainingApi";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  MapPin,
  Search,
  User,
  UserCheck,
  Users,
  UserX,
  X,
  XCircle,
} from "lucide-react";
import TablePagination from "@mui/material/TablePagination";
import type { TrainingRegistration } from "../type";
import PdfPreviewModal from "../../../components/PdfPreviewModal";
import { fetchExportBlob } from "../../../Apis/Export";
import { usePagination } from "../../../utils/usePagination";
import { formatThaiDate, formatThaiDateTime } from "../../../utils/dateUtils";

type StatusFilter = "all" | "active" | "cancelled";

const CANCELLED = "ยกเลิกแล้ว";
const isCancelled = (r: TrainingRegistration) => r.status === CANCELLED;
const emailOf = (r: TrainingRegistration) => (r as TrainingRegistration & { user?: { email?: string } }).user?.email;
const fullName = (r: TrainingRegistration) => `${r.prefix ?? ""}${r.firstName} ${r.lastName}`.trim();

const safeName = (s: string) => s.replace(/[/\\?%*:|"<>]/g, "-");
const certButtonClass =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 cursor-pointer";

const StatusBadge = ({ reg }: { reg: TrainingRegistration }) =>
  isCancelled(reg) ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
      <XCircle className="h-3.5 w-3.5" />
      ยกเลิกแล้ว
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <CheckCircle2 className="h-3.5 w-3.5" />
      ลงทะเบียนแล้ว
    </span>
  );

const AdminTrainingRegistrationsPage = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const id = Number(topicId);

  const { data: topic, isLoading: isLoadingTopic } = useGetTrainingTopicByIdQuery(id);
  const { data: registrations = [], isLoading: isLoadingRegs, isFetching } = useGetAllTrainingRegistrationsQuery(id);

  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  // PDF ที่กำลังดูตัวอย่าง (ใบลงชื่อ / เกียรติบัตร)
  const [pdf, setPdf] = useState<{ title: string; fileName: string; path: string } | null>(null);
  const openCertificate = (reg: TrainingRegistration) =>
    setPdf({
      title: `เกียรติบัตร: ${fullName(reg)}`,
      fileName: `เกียรติบัตร-${safeName(fullName(reg))}.pdf`,
      path: `trainingCertificate/${reg.id}`,
    });
  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage, setPage } = usePagination();

  const activeCount = registrations.filter((r) => !isCancelled(r)).length;
  const cancelledCount = registrations.length - activeCount;
  const max = topic?.maxParticipants ?? 0;
  const pct = max > 0 ? Math.min(100, Math.round((activeCount / max) * 100)) : 0;

  const filteredRegs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return registrations
      .filter((r) => (status === "all" ? true : status === "active" ? !isCancelled(r) : isCancelled(r)))
      .filter((r) => !q || fullName(r).toLowerCase().includes(q) || emailOf(r)?.toLowerCase().includes(q));
  }, [registrations, searchQuery, status]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, status, setPage]);

  const pagedRegs = filteredRegs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (isLoadingRegs || isLoadingTopic) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        กำลังโหลดรายชื่อผู้สมัคร...
      </div>
    );
  }

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "ทั้งหมด", count: registrations.length },
    { key: "active", label: "ลงทะเบียนแล้ว", count: activeCount },
    { key: "cancelled", label: "ยกเลิกแล้ว", count: cancelledCount },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="ย้อนกลับ"
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">รายชื่อผู้สมัครอบรม</p>
            <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight text-slate-900">
              <span className="truncate">{topic?.name ?? "ไม่พบหลักสูตร"}</span>
              {isFetching && <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-slate-400" />}
            </h1>
          </div>
        </div>
        {topic && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setPdf({
                  title: `เกียรติบัตรผู้เข้าอบรม: ${topic.name}`,
                  fileName: `เกียรติบัตร-${safeName(topic.name)}.pdf`,
                  path: `trainingCertificates/${topic.id}`,
                })
              }
              disabled={activeCount === 0}
              title={activeCount === 0 ? "ยังไม่มีผู้ลงทะเบียน" : "ทุกคนในไฟล์เดียว คนละหน้า"}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <Award className="h-4 w-4 text-amber-600" />
              เกียรติบัตรทั้งหมด (PDF)
            </button>
            <button
              type="button"
              onClick={() =>
                setPdf({
                  title: `ใบลงชื่อผู้เข้าอบรม: ${topic.name}`,
                  fileName: `ใบลงชื่อ-${safeName(topic.name)}.pdf`,
                  path: `trainingSignInSheet/${topic.id}`,
                })
              }
              disabled={activeCount === 0}
              title={activeCount === 0 ? "ยังไม่มีผู้ลงทะเบียน" : undefined}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              ใบลงชื่อผู้เข้าอบรม (PDF)
            </button>
          </div>
        )}
      </div>

      {topic && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* ข้อมูลหลักสูตร */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                {topic.branch?.name || "สาขาทั่วไป"}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                  topic.isOpenRegister ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${topic.isOpenRegister ? "bg-emerald-500" : "bg-slate-400"}`} />
                {topic.isOpenRegister ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
              </span>
            </div>
            <dl className="grid gap-2 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                <dt className="sr-only">วันที่อบรม</dt>
                <dd>{topic.trainingDate ? formatThaiDate(topic.trainingDate) : "ยังไม่กำหนดวันอบรม"}</dd>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                <dt className="sr-only">สถานที่และเวลา</dt>
                <dd className="whitespace-pre-line">{topic.location || "ไม่ระบุสถานที่"}</dd>
              </div>
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                <dt className="sr-only">วิทยากร</dt>
                <dd>{topic.teacherName || "ไม่ระบุวิทยากร"}</dd>
              </div>
              {topic.audience && (
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                  <dt className="sr-only">ผู้เข้าร่วม</dt>
                  <dd>{topic.audience}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* ผู้สมัคร / ที่นั่ง */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-blue-800">
              <UserCheck className="h-4 w-4" />
              ลงทะเบียนแล้ว
            </p>
            <p className="mt-2 text-4xl font-bold tabular-nums text-slate-900">
              {activeCount}
              <span className="ml-1 text-lg font-medium text-slate-500">{max > 0 ? `/ ${max} คน` : "คน"}</span>
            </p>
            {max > 0 ? (
              <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full ${pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-400" : "bg-blue-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {activeCount >= max ? "ที่นั่งเต็มแล้ว" : `เหลือ ${max - activeCount} ที่นั่ง`}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-600">ไม่จำกัดจำนวนที่นั่ง</p>
            )}
          </section>

          {/* ยกเลิก */}
          <section className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-rose-800">
              <UserX className="h-4 w-4" />
              ยกเลิกการสมัคร
            </p>
            <p className="mt-2 text-4xl font-bold tabular-nums text-slate-900">
              {cancelledCount}
              <span className="ml-1 text-lg font-medium text-slate-500">คน</span>
            </p>
            <p className="mt-2 text-sm text-slate-600">จากผู้สมัครทั้งหมด {registrations.length} คน</p>
          </section>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label="สถานะการสมัคร">
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
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ นามสกุล หรืออีเมล"
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

        {filteredRegs.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">
              {registrations.length === 0 ? "ยังไม่มีผู้สมัครหลักสูตรนี้" : "ไม่พบรายชื่อที่ตรงกับการค้นหา"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="w-16 px-5 py-3 text-center">ลำดับ</th>
                    <th className="px-5 py-3">ชื่อ - นามสกุล</th>
                    <th className="px-5 py-3">อีเมลบัญชีผู้ใช้</th>
                    <th className="px-5 py-3">วันเวลาลงทะเบียน</th>
                    <th className="px-5 py-3">สถานะ</th>
                    <th className="px-5 py-3 text-right">เกียรติบัตร</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pagedRegs.map((reg, i) => (
                    <tr key={reg.id} className={`transition-colors hover:bg-slate-50 ${isCancelled(reg) ? "text-slate-400" : ""}`}>
                      <td className="px-5 py-3.5 text-center tabular-nums text-slate-500">{page * rowsPerPage + i + 1}</td>
                      <td className={`px-5 py-3.5 text-base font-semibold ${isCancelled(reg) ? "text-slate-400 line-through" : "text-slate-900"}`}>
                        {fullName(reg)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{emailOf(reg) || "—"}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{formatThaiDateTime(reg.registeredAt)}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge reg={reg} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {!isCancelled(reg) && (
                          <button type="button" onClick={() => openCertificate(reg)} className={certButtonClass}>
                            <Award className="h-4 w-4" />
                            เกียรติบัตร
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {pagedRegs.map((reg, i) => (
                <li key={reg.id} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className={`font-semibold ${isCancelled(reg) ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      <span className="mr-1.5 text-sm font-normal text-slate-400">{page * rowsPerPage + i + 1}.</span>
                      {fullName(reg)}
                    </p>
                    {emailOf(reg) && <p className="truncate text-sm text-slate-500">{emailOf(reg)}</p>}
                    <p className="text-xs text-slate-400">{formatThaiDateTime(reg.registeredAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge reg={reg} />
                    {!isCancelled(reg) && (
                      <button type="button" onClick={() => openCertificate(reg)} className={certButtonClass}>
                        <Award className="h-4 w-4" />
                        เกียรติบัตร
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="border-t border-slate-200">
          <TablePagination
            component="div"
            sx={{ color: "#334155", fontFamily: "inherit", ".MuiTablePagination-toolbar": { flexWrap: "wrap" } }}
            count={filteredRegs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="แถวต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
          />
        </div>
      </section>

      {pdf && (
        <PdfPreviewModal
          title={pdf.title}
          fileName={pdf.fileName}
          load={() => fetchExportBlob(pdf.path)}
          onClose={() => setPdf(null)}
        />
      )}
    </div>
  );
};

export default AdminTrainingRegistrationsPage;
