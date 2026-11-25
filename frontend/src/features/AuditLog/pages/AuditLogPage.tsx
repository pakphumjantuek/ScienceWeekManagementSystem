import { useEffect, useState } from "react";
import TablePagination from "@mui/material/TablePagination";
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  Loader2,
  LogIn,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  UserCog,
  X,
  XCircle,
} from "lucide-react";
import { withAdminAuth } from "../../../HOC";
import { useGetAuditLogsQuery, type AuditLogItem } from "../auditLogApi";

type Meta = { label: string; icon: React.ComponentType<{ className?: string }>; tone: string };

// ชื่อภาษาไทย + สีของแต่ละ action (ต้องตรงกับ AuditActions ฝั่ง backend)
const ACTIONS: Record<string, Meta> = {
  "Auth.LoginSuccess": { label: "เข้าสู่ระบบสำเร็จ", icon: LogIn, tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  "Auth.LoginFailed": { label: "เข้าสู่ระบบไม่สำเร็จ", icon: XCircle, tone: "bg-amber-50 text-amber-700 ring-amber-200" },
  "Auth.LoginBlockedSuspended": { label: "บัญชีถูกระงับพยายามเข้าระบบ", icon: ShieldAlert, tone: "bg-rose-50 text-rose-700 ring-rose-200" },
  "Auth.AccountLockedOut": { label: "ล็อกชั่วคราว (รหัสผิดหลายครั้ง)", icon: ShieldAlert, tone: "bg-orange-50 text-orange-700 ring-orange-200" },
  "Auth.LoginBlockedLockedOut": { label: "พยายามเข้าระหว่างถูกล็อก", icon: ShieldAlert, tone: "bg-orange-50 text-orange-700 ring-orange-200" },
  "Auth.PasswordResetCompleted": { label: "ตั้งรหัสผ่านใหม่สำเร็จ", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  "Auth.PasswordResetFailed": { label: "ตั้งรหัสผ่านใหม่ไม่สำเร็จ", icon: XCircle, tone: "bg-amber-50 text-amber-700 ring-amber-200" },
  "User.RoleChanged": { label: "เปลี่ยนสิทธิ์", icon: UserCog, tone: "bg-blue-50 text-blue-700 ring-blue-200" },
  "User.Suspended": { label: "ระงับบัญชี", icon: Ban, tone: "bg-rose-50 text-rose-700 ring-rose-200" },
  "User.Unsuspended": { label: "เปิดใช้งานบัญชี", icon: RotateCcw, tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  "User.ResetLinkCreated": { label: "สร้างลิงก์รีเซ็ตรหัสผ่าน", icon: KeyRound, tone: "bg-violet-50 text-violet-700 ring-violet-200" },
};
const metaOf = (action: string): Meta =>
  ACTIONS[action] ?? { label: action, icon: ClipboardList, tone: "bg-slate-100 text-slate-700 ring-slate-200" };

const FILTERS = [
  { value: "", label: "ทุกรายการ" },
  { value: "User.", label: "การจัดการบัญชี (ทั้งหมด)" },
  { value: "User.RoleChanged", label: "— เปลี่ยนสิทธิ์" },
  { value: "User.Suspended", label: "— ระงับบัญชี" },
  { value: "User.Unsuspended", label: "— เปิดใช้งานบัญชี" },
  { value: "User.ResetLinkCreated", label: "— สร้างลิงก์รีเซ็ตรหัสผ่าน" },
  { value: "Auth.", label: "การเข้าสู่ระบบ (ทั้งหมด)" },
  { value: "Auth.LoginFailed", label: "— เข้าสู่ระบบไม่สำเร็จ" },
  { value: "Auth.LoginBlockedSuspended", label: "— บัญชีถูกระงับพยายามเข้าระบบ" },
  { value: "Auth.AccountLockedOut", label: "— ล็อกชั่วคราว (รหัสผิดหลายครั้ง)" },
  { value: "Auth.PasswordResetCompleted", label: "— ตั้งรหัสผ่านใหม่สำเร็จ" },
];

const ROLE_TH: Record<string, string> = { admin: "ผู้ดูแลระบบ", staff: "เจ้าหน้าที่", user: "ผู้ใช้ทั่วไป" };
const roleTh = (r: string) => r.split(",").map((x) => ROLE_TH[x.trim().toLowerCase()] ?? x.trim()).join(", ");

// แปลง details (JSON) เป็นข้อความอ่านง่าย
const describe = (log: AuditLogItem) => {
  if (!log.details) return null;
  try {
    const d = JSON.parse(log.details);
    if (log.action === "User.RoleChanged") return `${roleTh(d.from || "-")} → ${roleTh(d.to || "-")}`;
    if (log.action === "Auth.LoginSuccess" && d.role) return `สิทธิ์: ${roleTh(d.role)}`;
    if (log.action === "Auth.PasswordResetFailed") return /InvalidToken/i.test(d.reason) ? "ลิงก์หมดอายุหรือถูกใช้แล้ว" : d.reason;
    return Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(" · ");
  } catch {
    return log.details;
  }
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }),
    time: d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
};

const ActionBadge = ({ action }: { action: string }) => {
  const m = metaOf(action);
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-medium ring-1 ${m.tone}`}>
      <Icon className="h-4 w-4" />
      {m.label}
    </span>
  );
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function AuditLogPage() {
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // หน่วงการค้นหาเล็กน้อย ไม่ยิง API ทุกตัวอักษร
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(0), [action, from, to, q, pageSize]);

  const { data, isLoading, isFetching, error, refetch } = useGetAuditLogsQuery(
    {
      action: action || undefined,
      from: from || undefined,
      to: to || undefined,
      q: q || undefined,
      page: page + 1,
      pageSize,
    },
    // โหลดใหม่ทุกครั้งที่เปิดหน้า ไม่ใช้ผลเก่า (รวมถึง error เก่า) ที่ค้างอยู่
    { refetchOnMountOrArgChange: true },
  );

  // ลองใหม่อัตโนมัติ 1 ครั้งเมื่อโหลดไม่สำเร็จ (เช่น backend เพิ่ง restart)
  const [autoRetried, setAutoRetried] = useState(false);
  useEffect(() => {
    if (error && !autoRetried) {
      setAutoRetried(true);
      const t = setTimeout(() => refetch(), 1000);
      return () => clearTimeout(t);
    }
    if (!error && autoRetried) setAutoRetried(false);
  }, [error, autoRetried, refetch]);

  // PARSING_ERROR = server ตอบกลับมาแต่ไม่ใช่ JSON ให้ใช้รหัส HTTP จริง (originalStatus) แทน
  const errorStatus =
    (error as { originalStatus?: number } | undefined)?.originalStatus ??
    (error as { status?: number | string } | undefined)?.status;

  const items = data?.items ?? [];
  const hasFilter = !!(action || from || to || search);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-white">
            <ClipboardList className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">บันทึกการใช้งาน</h1>
            <p className="text-sm text-slate-500">ใครทำอะไร เมื่อไร · ดูได้อย่างเดียว แก้ไขหรือลบไม่ได้</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          โหลดล่าสุด
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Filters */}
        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_170px_170px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาผู้กระทำ ผู้ถูกกระทำ หรือ IP"
              className={`${inputClass} pl-9`}
            />
          </div>
          <select value={action} onChange={(e) => setAction(e.target.value)} className={inputClass} aria-label="ประเภท">
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <span className="whitespace-nowrap">ตั้งแต่</span>
            <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <span className="whitespace-nowrap">ถึง</span>
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputClass} />
          </label>
          {hasFilter ? (
            <button
              type="button"
              onClick={() => {
                setAction("");
                setFrom("");
                setTo("");
                setSearch("");
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" /> ล้างตัวกรอง
            </button>
          ) : (
            <span className="hidden xl:block" />
          )}
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error && !data ? (
          <div className="px-4 py-16 text-center">
            <p className="text-slate-600">โหลดบันทึกไม่สำเร็จ</p>
            <p className="mt-1 text-sm text-slate-400">
              {errorStatus === 401 || errorStatus === 403
                ? "สิทธิ์ไม่พอหรือหมดเวลาเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่"
                : errorStatus === 500
                  ? "server ผิดพลาด (ตรวจว่ารัน migration AddAuditLogs แล้ว)"
                  : `รหัสข้อผิดพลาด: ${errorStatus ?? "เชื่อมต่อ server ไม่ได้"}`}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" /> ลองอีกครั้ง
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">{hasFilter ? "ไม่พบรายการที่ตรงกับตัวกรอง" : "ยังไม่มีบันทึก"}</p>
          </div>
        ) : (
          <div className={`transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            {/* Desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="px-5 py-3">เวลา</th>
                    <th className="px-5 py-3">ผู้กระทำ</th>
                    <th className="px-5 py-3">การกระทำ</th>
                    <th className="px-5 py-3">ผู้ถูกกระทำ</th>
                    <th className="px-5 py-3">รายละเอียด</th>
                    <th className="px-5 py-3">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.map((log) => {
                    const t = fmtTime(log.createdAt);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-3">
                          <p className="font-medium text-slate-900">{t.time}</p>
                          <p className="text-xs text-slate-500">{t.date}</p>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-900">{log.actor || "-"}</td>
                        <td className="px-5 py-3"><ActionBadge action={log.action} /></td>
                        <td className="px-5 py-3">{log.target || "-"}</td>
                        <td className="px-5 py-3 text-slate-600">{describe(log) || "-"}</td>
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-500">{log.ipAddress || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {items.map((log) => {
                const t = fmtTime(log.createdAt);
                const detail = describe(log);
                return (
                  <li key={log.id} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <ActionBadge action={log.action} />
                      <span className="whitespace-nowrap text-right text-xs text-slate-500">
                        {t.date}
                        <br />
                        {t.time}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      <b className="text-slate-900">{log.actor || "-"}</b>
                      {log.target && log.target !== log.actor && <> → {log.target}</>}
                    </p>
                    {detail && <p className="text-sm text-slate-500">{detail}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="border-t border-slate-200">
          <TablePagination
            component="div"
            sx={{ color: "#334155", fontFamily: "inherit", ".MuiTablePagination-toolbar": { flexWrap: "wrap" } }}
            count={data?.total ?? 0}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => setPageSize(Number(e.target.value))}
            rowsPerPageOptions={[25, 50, 100, 200]}
            labelRowsPerPage="แถวต่อหน้า:"
            labelDisplayedRows={({ from: a, to: b, count }) => `${a}-${b} จาก ${count}`}
          />
        </div>
      </section>
    </div>
  );
}

export default withAdminAuth(AuditLogPage);
