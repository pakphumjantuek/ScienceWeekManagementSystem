import { useEffect, useMemo, useRef, useState } from "react";
import { SD_Roles } from "../../../Common/SD";
import { useRegisterUserMutation } from "../authApi";
import { useNavigate, Link } from "react-router-dom";
import { showSuccessOk } from "../../../utils/confirmDelete";
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Info,
} from "lucide-react";

function Register() {
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterUserMutation();

  // ---------------- State ----------------
  const [error, setError] = useState("");
  const [capsOn, setCapsOn] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [userInput, setUserInput] = useState({
    userName: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  // ---------------- Derived ----------------
  const passwordOk = useMemo(
    () => userInput.password.trim().length >= 8,
    [userInput.password],
  );
  const confirmOk = useMemo(
    () =>
      userInput.password === userInput.confirmPassword &&
      userInput.confirmPassword.length > 0,
    [userInput.password, userInput.confirmPassword],
  );
  const canSubmit = useMemo(
    () => userInput.userName.trim() && passwordOk && confirmOk && !isLoading,
    [userInput.userName, passwordOk, confirmOk, isLoading],
  );

  // simple strength: 0-3
  const strength = useMemo(() => {
    const p = userInput.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p) || /[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }, [userInput.password]);

  const errorRef = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    if (error && errorRef.current) errorRef.current.focus();
  }, [error]);

  const onPwKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsOn((e as any).getModifierState?.("CapsLock") ?? false);
  };

  // ---------------- Submit ----------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!passwordOk) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (!confirmOk) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      const payload = {
        userName: userInput.userName.trim(),
        password: userInput.password,
        role: SD_Roles.User,
      };

      const response = await registerUser(payload).unwrap();

      if (response.isSuccess) {
        await showSuccessOk("สมัครสมาชิกสำเร็จ");
        navigate("/login");
      } else {
        setError(
          response.errorMessages?.[0] || "เกิดข้อผิดพลาดในการสมัครสมาชิก",
        );
      }
    } catch (err: any) {
      if (err?.data?.errorMessages?.length) {
        setError(err.data.errorMessages[0]);
      } else {
        setError("เกิดข้อผิดพลาดในการสมัครสมาชิก");
      }
    }
  };

  // สีแถบความแข็งแรงรหัสผ่าน
  const strengthLabel = ["อ่อน", "พอใช้", "ดี", "แข็งแรง"][strength];
  const strengthClass = [
    "bg-rose-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-emerald-600",
  ][strength];

  const hasPw = !!userInput.password;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* พื้นหลังนุ่มตา */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50" />
        <div className="absolute -top-24 -left-16 w-[28rem] h-[28rem] rounded-full bg-indigo-200/35 blur-3xl" />
        <div className="absolute bottom-[-4rem] right-[-4rem] w-[24rem] h-[24rem] rounded-full bg-sky-200/35 blur-3xl" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.06]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="dot-grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="1"
                cy="1"
                r="1"
                className="text-slate-300"
                fill="currentColor"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* ด้านซ้าย: คำแนะนำ */}
          <aside className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-slate-200 p-6">
            <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
              <Info className="h-5 w-5" />
              แนวทางตั้งรหัสผ่านที่ดี
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                ใช้ความยาวอย่างน้อย 8 ตัวอักษร
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                ผสมอักษรตัวใหญ่/ตัวเล็ก ตัวเลข หรืออักขระพิเศษ
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                หลีกเลี่ยงข้อมูลส่วนตัวที่เดาทางได้ง่าย
              </li>
            </ul>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-medium text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                ข้อควรระวัง
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                กรุณาเก็บรักษารหัสผ่านเป็นความลับ และออกจากระบบเมื่อใช้งานเสร็จ
                โดยเฉพาะเมื่อใช้คอมพิวเตอร์สาธารณะ
              </p>
            </div>
          </aside>

          {/* ด้านขวา: ฟอร์ม */}
          <div className="rounded-2xl bg-white/90 backdrop-blur shadow-xl ring-1 ring-slate-200 overflow-hidden">
            <div className="px-6 pt-6 pb-3 border-b border-slate-100">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                สมัครสมาชิก
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                กรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชีใหม่
              </p>
            </div>

            <form
              className="px-6 py-6 space-y-4"
              onSubmit={handleSubmit}
              aria-describedby={error ? "form-error" : undefined}
            >
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  อีเมล (Email)
                </label>
                <input
                  type="email"
                  name="userName"
                  value={userInput.userName}
                  required
                  placeholder="เช่น student@email.com"
                  onChange={(e) =>
                    setUserInput({ ...userInput, userName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
                <p className="mt-1 text-xs text-slate-500">
                  ใช้อีเมลสำหรับเข้าสู่ระบบ
                </p>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">
                    รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="text-xs text-slate-600 hover:text-slate-900"
                  >
                    {showPw ? "ซ่อน" : "แสดง"}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    name="password"
                    value={userInput.password}
                    required
                    placeholder="••••••••"
                    onKeyUp={onPwKey}
                    onKeyDown={onPwKey}
                    onChange={(e) =>
                      setUserInput({ ...userInput, password: e.target.value })
                    }
                    className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                  />
                  {showPw ? (
                    <EyeOff className="h-4 w-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  ) : (
                    <Eye className="h-4 w-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  )}
                </div>

                {/* แสดงแถบความแข็งแรงเฉพาะเมื่อมีการพิมพ์ */}
                {hasPw && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full bg-slate-200 rounded">
                      <div
                        className={`h-1.5 rounded ${strengthClass}`}
                        style={{ width: `${((strength + 1) / 4) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        ความแข็งแรงรหัสผ่าน: {strengthLabel}
                      </span>
                      {capsOn && (
                        <span className="text-amber-700 font-medium">
                          ⚠️ เปิด Caps Lock อยู่
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">
                    ยืนยันรหัสผ่าน
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPw2((s) => !s)}
                    className="text-xs text-slate-600 hover:text-slate-900"
                  >
                    {showPw2 ? "ซ่อน" : "แสดง"}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPw2 ? "text" : "password"}
                    name="confirmPassword"
                    value={userInput.confirmPassword}
                    required
                    placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                    onChange={(e) =>
                      setUserInput({
                        ...userInput,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2.5 pr-10 border rounded-lg bg-white text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/30
                      ${
                        !userInput.confirmPassword
                          ? "border-slate-300 focus:border-indigo-500"
                          : confirmOk
                            ? "border-emerald-400 focus:border-emerald-500"
                            : "border-rose-300 focus:border-rose-500"
                      }`}
                  />
                  {showPw2 ? (
                    <EyeOff className="h-4 w-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  ) : (
                    <Eye className="h-4 w-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  )}
                </div>
                {!!userInput.confirmPassword && !confirmOk && (
                  <p className="mt-1 text-xs text-rose-600">
                    รหัสผ่านไม่ตรงกัน
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <p
                  id="form-error"
                  ref={errorRef}
                  tabIndex={-1}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading && (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {isLoading ? "กำลังสมัครสมาชิก…" : "สมัครสมาชิก"}
              </button>

              <div className="pt-1 text-center text-sm text-slate-600">
                มีบัญชีแล้ว?{" "}
                <Link
                  to="/login"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  เข้าสู่ระบบ
                </Link>
              </div>
            </form>

            <div className="px-6 pb-6 text-center text-xs text-slate-500">
              การสมัครสมาชิกนี้สำหรับผู้ใช้งานทั่วไป หากต้องการสิทธิ์เจ้าหน้าที่
              โปรดติดต่อผู้ดูแลระบบ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
