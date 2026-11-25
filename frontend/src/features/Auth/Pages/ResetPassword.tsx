// src/pages/ResetPassword.tsx
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, Check, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { useResetPasswordMutation } from "../authApi";

const MIN_LENGTH = 6;

// แปลงข้อความ error จาก ASP.NET Identity เป็นภาษาไทยที่เข้าใจง่าย
const toThaiError = (messages: string[]) => {
  const text = messages.join(" ");
  if (/invalid token/i.test(text)) return "ลิงก์นี้หมดอายุหรือถูกใช้ไปแล้ว กรุณาติดต่อผู้ดูแลระบบเพื่อขอลิงก์ใหม่";
  if (/ไม่พบผู้ใช้/.test(text)) return "ไม่พบบัญชีผู้ใช้ของลิงก์นี้ กรุณาติดต่อผู้ดูแลระบบ";
  return messages[0] || "ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
};

const PasswordInput = ({
  id,
  label,
  value,
  onChange,
  autoFocus,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  invalid?: boolean;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          autoComplete="new-password"
          aria-invalid={invalid || undefined}
          className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-base text-slate-900 outline-none transition focus:ring-4 ${
            invalid
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
              : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/10"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

const Rule = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
  <li className={`flex items-center gap-2 text-sm ${ok ? "text-emerald-700" : "text-slate-500"}`}>
    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${ok ? "bg-emerald-100" : "bg-slate-100"}`}>
      {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3 w-3 text-slate-400" />}
    </span>
    {children}
  </li>
);

// ระดับความปลอดภัยแบบง่าย: ความยาว + ความหลากหลายของตัวอักษร
const strengthOf = (pw: string) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= MIN_LENGTH) score++;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(3, Math.ceil((score / 5) * 3));
};
const STRENGTH = [
  { label: "", bar: "bg-slate-200", text: "" },
  { label: "ง่ายเกินไป", bar: "bg-rose-500", text: "text-rose-600" },
  { label: "พอใช้", bar: "bg-amber-400", text: "text-amber-600" },
  { label: "ปลอดภัยดี", bar: "bg-emerald-500", text: "text-emerald-600" },
];

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-1.5">
        <div className="flex-1 bg-blue-600" />
        <div className="flex-1 bg-emerald-500" />
        <div className="flex-1 bg-amber-400" />
        <div className="flex-1 bg-rose-500" />
      </div>
      <div className="px-6 py-8 sm:px-8">{children}</div>
    </div>
  </div>
);

function ResetPassword() {
  const [params] = useSearchParams();
  const uid = useMemo(() => params.get("uid") ?? "", [params]);
  const token = useMemo(() => params.get("token") ?? "", [params]);

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const longEnough = newPassword.length >= MIN_LENGTH;
  const matches = confirm.length > 0 && newPassword === confirm;
  const canSubmit = longEnough && matches && !isLoading;
  const strength = strengthOf(newPassword);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    try {
      await resetPassword({ userId: uid, token, newPassword }).unwrap();
      setDone(true);
    } catch (err: any) {
      setError(toThaiError(err?.data?.errorMessages ?? []));
    }
  };

  // ลิงก์ไม่ครบ (คัดลอกมาไม่หมด)
  if (!uid || !token) {
    return (
      <Shell>
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">ลิงก์ไม่ถูกต้อง</h1>
          <p className="mt-2 text-base text-slate-600">
            ลิงก์อาจถูกคัดลอกมาไม่ครบ กรุณาเปิดจากลิงก์ที่ได้รับอีกครั้ง หรือติดต่อผู้ดูแลระบบเพื่อขอลิงก์ใหม่
          </p>
          <Link to="/login" className="mt-6 inline-flex w-full justify-center rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">ตั้งรหัสผ่านใหม่เรียบร้อย</h1>
          <p className="mt-2 text-base text-slate-600">ใช้รหัสผ่านใหม่เพื่อเข้าสู่ระบบได้ทันที</p>
          <Link to="/login" replace className="mt-6 inline-flex w-full justify-center rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
            เข้าสู่ระบบ
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          <KeyRound className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-sm text-slate-500">กรอกรหัสผ่านใหม่ 2 ครั้งให้ตรงกัน</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <PasswordInput id="new-password" label="รหัสผ่านใหม่" value={newPassword} onChange={setNewPassword} autoFocus />
          {newPassword && (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength ? STRENGTH[strength].bar : "bg-slate-200"}`} />
                ))}
              </div>
              <span className={`w-20 text-right text-xs font-semibold ${STRENGTH[strength].text}`}>{STRENGTH[strength].label}</span>
            </div>
          )}
        </div>

        <PasswordInput
          id="confirm-password"
          label="ยืนยันรหัสผ่านใหม่"
          value={confirm}
          onChange={setConfirm}
          invalid={confirm.length > 0 && !matches}
        />

        <ul className="space-y-1.5 rounded-xl bg-slate-50 px-4 py-3">
          <Rule ok={longEnough}>ยาวอย่างน้อย {MIN_LENGTH} ตัวอักษร</Rule>
          <Rule ok={matches}>รหัสผ่านทั้ง 2 ช่องตรงกัน</Rule>
        </ul>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 cursor-pointer"
        >
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          {isLoading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
        </button>
      </form>

      <p className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
        ลิงก์นี้ใช้ได้ 2 ชั่วโมงและใช้ได้ครั้งเดียว
        <br />
        หากหมดอายุ กรุณาติดต่อผู้ดูแลระบบเพื่อขอลิงก์ใหม่
      </p>
    </Shell>
  );
}

// ไม่ครอบ withAuth: คนที่ลืมรหัสผ่านยังไม่ได้ล็อกอิน ต้องเปิดหน้านี้ได้
export default ResetPassword;
