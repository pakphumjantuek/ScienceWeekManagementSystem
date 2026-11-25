// src/features/UserAdmin/components/UserAdminList.tsx
import { useEffect, useMemo, useState } from "react";
import TablePagination from "@mui/material/TablePagination";
import { Ban, KeyRound, Loader2, RotateCcw, Search, ShieldCheck, UserCog, Users, X } from "lucide-react";
import { withAdminAuth } from "../../../HOC";
import { Loading } from "../../../components/Loading";
import { usePagination } from "../../../utils/usePagination";

import type { UserAdmin } from "../type";
import {
  useGetAllUserAdminQuery,
  useChangeUserRoleMutation,
  useGetAllRoleQuery,
  useGenerateResetLinkMutation,
  useSetUserSuspendedMutation,
} from "../userAdminApi";
import { showError } from "../../../utils/confirmDelete";
import Swal from "sweetalert2";
import { APP_BASE_URL } from "../../../config";

// ===== Role display =====
const roleKey = (role: string) => {
  const r = role.trim().toLowerCase();
  if (r === "admin") return "admin";
  if (r === "staff" || r === "เจ้าหน้าที่") return "staff";
  return r || "user";
};

const ROLE_STYLE: Record<string, { label: string; badge: string; avatar: string }> = {
  admin: { label: "ผู้ดูแลระบบ", badge: "bg-blue-100 text-blue-800 ring-blue-200", avatar: "bg-blue-600" },
  staff: { label: "เจ้าหน้าที่", badge: "bg-violet-100 text-violet-800 ring-violet-200", avatar: "bg-violet-600" },
  user: { label: "ผู้ใช้ทั่วไป", badge: "bg-slate-100 text-slate-700 ring-slate-200", avatar: "bg-slate-500" },
};
const roleStyle = (role: string) => ROLE_STYLE[roleKey(role)] ?? { label: role, badge: "bg-amber-100 text-amber-800 ring-amber-200", avatar: "bg-amber-500" };

const currentRoleOf = (u: UserAdmin) => (u.selectedRole ?? u.currentRoles ?? "").split(",")[0]?.trim() || "User";

const RoleBadge = ({ role }: { role: string }) => {
  const st = roleStyle(role);
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ${st.badge}`}>
      {st.label}
    </span>
  );
};

const Avatar = ({ u }: { u: UserAdmin }) => (
  <span
    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base font-bold uppercase text-white ${u.isSuspended ? "bg-slate-300" : roleStyle(currentRoleOf(u)).avatar}`}
    aria-hidden="true"
  >
    {(u.userName || "?").charAt(0)}
  </span>
);

const SuspendedBadge = () => (
  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-rose-100 px-2.5 py-0.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200">
    <Ban className="h-3.5 w-3.5" />
    ถูกระงับ
  </span>
);

function UserAdminList() {
  // ===== Query =====
  const { data: users, isLoading: isUsersLoading, isFetching: isUsersFetching } = useGetAllUserAdminQuery();
  const { data: roles, isLoading: isRolesLoading } = useGetAllRoleQuery();

  const [changeUserRole] = useChangeUserRoleMutation();
  const [genResetLink] = useGenerateResetLinkMutation();
  const [setUserSuspended] = useSetUserSuspendedMutation();

  // ===== Filter =====
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (users ?? []).forEach((u) => {
      const k = roleKey(currentRoleOf(u));
      counts[k] = (counts[k] ?? 0) + 1;
    });
    return counts;
  }, [users]);

  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (users ?? []).filter((u) => {
      if (roleFilter === "suspended") {
        if (!u.isSuspended) return false;
      } else if (roleFilter !== "all" && roleKey(currentRoleOf(u)) !== roleFilter) return false;
      if (!q) return true;
      return u.userName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });
  }, [users, searchTerm, roleFilter]);

  // ===== Pagination =====
  const { page, rowsPerPage, handleChangePage, handleChangeRowsPerPage, setPage } = usePagination();

  useEffect(() => {
    setPage(0);
  }, [searchTerm, roleFilter, setPage]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredData.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [filteredData.length, rowsPerPage, page, setPage]);

  const pagedUsers = useMemo(
    () => filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredData, page, rowsPerPage],
  );

  // busy state รายแถว (ตอนเปลี่ยนสิทธิ์ / สร้างลิงก์รีเซ็ต)
  const [busyChangingUser, setBusyChangingUser] = useState<string | null>(null);
  const [busyGeneratingUser, setBusyGeneratingUser] = useState<string | null>(null);
  const [busySuspendingUser, setBusySuspendingUser] = useState<string | null>(null);

  // ===== Handlers =====
  // เลือกสิทธิ์ใหม่แล้วถามยืนยันก่อนบันทึกทันที (ไม่ต้องกดปุ่มบันทึกแยก)
  const handleRoleChange = async (u: UserAdmin, newRole: string) => {
    const oldRole = currentRoleOf(u);
    if (!newRole || newRole === oldRole) return;
    const result = await Swal.fire({
      icon: "question",
      title: "เปลี่ยนสิทธิ์ผู้ใช้?",
      html: `<b>${u.userName.replace(/[<>&"]/g, "")}</b><br/>${roleStyle(oldRole).label} → <b>${roleStyle(newRole).label}</b>`,
      showCancelButton: true,
      confirmButtonText: "เปลี่ยนสิทธิ์",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#2563eb",
    });
    if (!result.isConfirmed) return;
    try {
      setBusyChangingUser(u.userName);
      await changeUserRole({ userName: u.userName, role: newRole }).unwrap();
    } catch (err: any) {
      showError(err?.data?.errorMessages?.[0] || "เปลี่ยนสิทธิ์ไม่สำเร็จ");
    } finally {
      setBusyChangingUser(null);
    }
  };

  const handleToggleSuspend = async (u: UserAdmin) => {
    const suspend = !u.isSuspended;
    const name = u.userName.replace(/[<>&"]/g, "");
    const result = await Swal.fire({
      icon: suspend ? "warning" : "question",
      title: suspend ? "ระงับบัญชีนี้?" : "เปิดใช้งานบัญชีนี้?",
      html: suspend
        ? `<b>${name}</b> จะเข้าสู่ระบบไม่ได้ และถูกออกจากระบบทันที<br/>ข้อมูลทีมและนักเรียนยังอยู่ครบ เปิดใช้งานคืนได้ภายหลัง`
        : `<b>${name}</b> จะกลับมาเข้าสู่ระบบได้ตามปกติ`,
      showCancelButton: true,
      confirmButtonText: suspend ? "ระงับบัญชี" : "เปิดใช้งาน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: suspend ? "#e11d48" : "#059669",
    });
    if (!result.isConfirmed) return;
    try {
      setBusySuspendingUser(u.userName);
      await setUserSuspended({ userName: u.userName, suspended: suspend }).unwrap();
    } catch (err: any) {
      showError(err?.data?.errorMessages?.[0] || (suspend ? "ระงับบัญชีไม่สำเร็จ" : "เปิดใช้งานไม่สำเร็จ"));
    } finally {
      setBusySuspendingUser(null);
    }
  };

  const handleGenerateLink = async (u: UserAdmin) => {
    try {
      setBusyGeneratingUser(u.userName);
      // ที่อยู่หน้าเว็บจริงตอนนี้ อ่านจาก URL ของหน้านี้ (…/admin/useradmin) จึงได้ทั้งโดเมนและ path ที่ deploy
      // เช่น https://xxx.ac.th/ScienceWeek/admin/useradmin → https://xxx.ac.th/ScienceWeek
      const { origin, pathname } = window.location;
      const adminAt = pathname.indexOf("/admin/");
      const basePath = adminAt >= 0 ? pathname.slice(0, adminAt) : APP_BASE_URL.replace(/\/$/, "");
      const clientBaseUrl = `${origin}${basePath}`;
      const data = await genResetLink({ userName: u.userName, clientBaseUrl }).unwrap();
      if (data?.resetUrl) {
        await showResetLink(u.userName, data.resetUrl);
      } else {
        showError("สร้างลิงก์ไม่สำเร็จ");
      }
    } catch (err: any) {
      showError(err?.data?.errorMessages?.[0] || "สร้างลิงก์ไม่สำเร็จ");
    } finally {
      setBusyGeneratingUser(null);
    }
  };

  if (isUsersLoading || isRolesLoading) return <Loading />;

  const total = users?.length ?? 0;
  const suspendedCount = (users ?? []).filter((u) => u.isSuspended).length;
  const filterTabs = [
    { key: "all", label: "ทั้งหมด", count: total },
    ...Object.keys(roleCounts)
      .sort((a, b) => (a === "admin" ? -1 : b === "admin" ? 1 : a === "staff" ? -1 : b === "staff" ? 1 : a.localeCompare(b)))
      .map((k) => ({ key: k, label: ROLE_STYLE[k]?.label ?? k, count: roleCounts[k] })),
    ...(suspendedCount > 0 ? [{ key: "suspended", label: "ถูกระงับ", count: suspendedCount }] : []),
  ];

  const roleSelect = (u: UserAdmin) => {
    const current = currentRoleOf(u);
    const busy = busyChangingUser === u.userName;
    return (
      <div className="relative">
        <select
          aria-label={`สิทธิ์ของ ${u.userName}`}
          value={roles?.some((r) => r.name === current) ? current : ""}
          disabled={busy || !roles?.length}
          onChange={(e) => handleRoleChange(u, e.target.value)}
          className="w-full min-w-[160px] cursor-pointer rounded-xl border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-wait disabled:opacity-60"
        >
          <option value="" disabled>
            เลือกสิทธิ์
          </option>
          {(roles ?? []).map((r) => (
            <option key={r.name} value={r.name}>
              {roleStyle(r.name).label}
            </option>
          ))}
        </select>
        {busy && <Loader2 className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-600" />}
      </div>
    );
  };

  const resetButton = (u: UserAdmin, full = false) => {
    const busy = busyGeneratingUser === u.userName;
    return (
      <button
        type="button"
        onClick={() => handleGenerateLink(u)}
        disabled={busy}
        title="สร้างลิงก์ให้ผู้ใช้ตั้งรหัสผ่านใหม่"
        className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60 cursor-pointer ${full ? "w-full" : ""}`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        {busy ? "กำลังสร้าง..." : "ลิงก์รีเซ็ตรหัสผ่าน"}
      </button>
    );
  };

  const suspendButton = (u: UserAdmin, full = false) => {
    const busy = busySuspendingUser === u.userName;
    const Icon = busy ? Loader2 : u.isSuspended ? RotateCcw : Ban;
    return (
      <button
        type="button"
        onClick={() => handleToggleSuspend(u)}
        disabled={busy}
        title={u.isSuspended ? "เปิดให้บัญชีนี้ใช้งานได้อีกครั้ง" : "ระงับไม่ให้บัญชีนี้เข้าสู่ระบบ"}
        className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-60 cursor-pointer ${
          u.isSuspended
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
        } ${full ? "w-full" : ""}`}
      >
        <Icon className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
        {u.isSuspended ? "เปิดใช้งาน" : "ระงับ"}
      </button>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <UserCog className="h-6 w-6" />
          </span>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              ผู้ใช้งานและสิทธิ์
              {isUsersFetching && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
            </h1>
            <p className="text-sm text-slate-500">เปลี่ยนสิทธิ์ ช่วยผู้ใช้ที่ลืมรหัสผ่าน และระงับบัญชี</p>
          </div>
        </div>
      </div>

      {/* How-to */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <p className="text-sm text-blue-900">
            <b>เปลี่ยนสิทธิ์:</b> เลือกสิทธิ์ใหม่จากช่อง "สิทธิ์" ระบบจะถามยืนยันแล้วบันทึกทันที
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
          <KeyRound className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            <b>ลืมรหัสผ่าน:</b> กด "ลิงก์รีเซ็ตรหัสผ่าน" แล้วส่งลิงก์ให้ผู้ใช้ ลิงก์ใช้ได้ 2 ชั่วโมง ครั้งเดียว
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
          <Ban className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
          <p className="text-sm text-rose-900">
            <b>ระงับบัญชี:</b> บัญชีจะเข้าระบบไม่ได้ทันที แต่ข้อมูลยังอยู่ครบ กด "เปิดใช้งาน" เพื่อคืนสิทธิ์
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label="กรองตามสิทธิ์">
            {filterTabs.map((t) => {
              const active = roleFilter === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRoleFilter(t.key)}
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
              placeholder="ค้นหาชื่อผู้ใช้ หรืออีเมล"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-base text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="ล้างคำค้นหา"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-base text-slate-500">
              {total === 0 ? "ยังไม่มีผู้ใช้งานในระบบ" : "ไม่พบผู้ใช้ที่ตรงกับการค้นหา"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-base">
                <thead className="border-b border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">
                  <tr>
                    <th className="px-5 py-3">ผู้ใช้</th>
                    <th className="px-5 py-3">สิทธิ์ปัจจุบัน</th>
                    <th className="px-5 py-3">เปลี่ยนสิทธิ์</th>
                    <th className="px-5 py-3 text-right">จัดการบัญชี</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedUsers.map((u) => (
                    <tr key={u.userName} className={`transition-colors ${u.isSuspended ? "bg-rose-50/40" : "hover:bg-slate-50"}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar u={u} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{u.userName}</p>
                            <p className="truncate text-sm text-slate-500">{u.email || "ไม่มีอีเมล"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <RoleBadge role={currentRoleOf(u)} />
                          {u.isSuspended && <SuspendedBadge />}
                        </div>
                      </td>
                      <td className="w-56 px-5 py-3">
                        {roleSelect(u)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          {resetButton(u)}
                          {suspendButton(u)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {pagedUsers.map((u) => (
                <li key={u.userName} className={`space-y-3 p-4 ${u.isSuspended ? "bg-rose-50/40" : ""}`}>
                  <div className="flex items-center gap-3">
                    <Avatar u={u} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{u.userName}</p>
                      <p className="truncate text-sm text-slate-500">{u.email || "ไม่มีอีเมล"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <RoleBadge role={currentRoleOf(u)} />
                      {u.isSuspended && <SuspendedBadge />}
                    </div>
                  </div>
                  {roleSelect(u)}
                  <div className="grid grid-cols-2 gap-2">
                    {resetButton(u, true)}
                    {suspendButton(u, true)}
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
            count={filteredData.length}
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
    </div>
  );
}

// คัดลอกได้ทั้งบน https และ http (navigator.clipboard ใช้ได้เฉพาะ https/localhost)
const copyText = async (text: string) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ตกไปใช้วิธีสำรอง
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  return ok;
};

// แสดงลิงก์ให้เห็นเสมอ ถ้าคัดลอกอัตโนมัติไม่ได้ก็ยังเลือกคัดลอกเองได้
const showResetLink = async (userName: string, url: string) => {
  const copied = await copyText(url);
  await Swal.fire({
    icon: "success",
    title: "สร้างลิงก์รีเซ็ตรหัสผ่านแล้ว",
    html: `
      <p style="margin-bottom:8px">ส่งลิงก์นี้ให้ <b>${userName.replace(/[<>&"]/g, "")}</b> (ใช้ได้ 2 ชั่วโมง)</p>
      <input id="reset-link-input" readonly value="${url.replace(/"/g, "&quot;")}" class="swal2-input" style="width:100%;margin:0;font-size:14px" onclick="this.select()" />
      <p style="margin-top:8px;font-size:14px;color:${copied ? "#059669" : "#64748b"}">
        ${copied ? "✓ คัดลอกไปยังคลิปบอร์ดแล้ว" : "คลิกที่ลิงก์แล้วกด Ctrl+C เพื่อคัดลอก"}
      </p>`,
    showCancelButton: true,
    confirmButtonText: "คัดลอกอีกครั้ง",
    cancelButtonText: "ปิด",
    preConfirm: async () => {
      await copyText(url);
      return false; // ไม่ปิดหน้าต่าง
    },
    didOpen: () => (document.getElementById("reset-link-input") as HTMLInputElement | null)?.select(),
  });
};

export default withAdminAuth(UserAdminList);
