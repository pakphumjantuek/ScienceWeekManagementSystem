import { useEffect, useMemo, useRef, useState } from "react";
import type userModel from "../type";
import { useLoginUserMutation } from "../authApi";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { setLoggedInUser } from "../../../Redux/userAuthSlice";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { showSuccessOk } from "../../../utils/confirmDelete";
import { Eye, EyeOff, Loader2, User as UserIcon, KeyRound } from "lucide-react";

// =============================
// Types
// =============================
export type FromLocation =
  | { pathname?: string; search?: string; hash?: string }
  | string;

// =============================
// Helpers
// =============================
const computeRedirectTo = (from: FromLocation): string => {
  if (typeof from === "string") return from || "/";
  return `${from?.pathname ?? "/"}${from?.search ?? ""}${from?.hash ?? ""}`;
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const dispatch = useDispatch();

  // ====== Restore redirect cache if page was refreshed ======
  const cachedStr = sessionStorage.getItem("postLoginRedirect");
  const cached = cachedStr ? JSON.parse(cachedStr) : undefined;
  const from: FromLocation = location?.state?.from ?? cached?.from ?? "/";
  const prevState =
    location?.state?.prevState ?? cached?.prevState ?? undefined;

  useEffect(() => {
    if (location?.state?.from) {
      sessionStorage.setItem(
        "postLoginRedirect",
        JSON.stringify({
          from: location.state.from,
          prevState: location.state.prevState,
        }),
      );
    }
  }, [location?.state?.from, location?.state?.prevState]);

  // =============================
  // Local state
  // =============================
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return localStorage.getItem("rememberMe") === "1";
  });
  const [userInput, setUserInput] = useState({
    userName: localStorage.getItem("rememberUserName") ?? "",
    password: "",
  });

  const [loginUser, { isLoading }] = useLoginUserMutation();

  // ARIA: focus error when present
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    if (error && errorRef.current) errorRef.current.focus();
  }, [error]);

  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    if (name === "rememberMe" && type === "checkbox") {
      setRememberMe(checked);
      localStorage.setItem("rememberMe", checked ? "1" : "0");
      if (!checked) localStorage.removeItem("rememberUserName");
      return;
    }
    setUserInput((prev) => ({ ...prev, [name]: value }));
  };

  const canSubmit = useMemo(
    () => userInput.userName.trim() && userInput.password.trim(),
    [userInput],
  );

  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // แจ้งเตือน CapsLock
    setCapsOn((e as any).getModifierState?.("CapsLock") ?? false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;
    setError("");

    try {
      const response = await loginUser({
        userName: userInput.userName.trim(),
        password: userInput.password,
      }).unwrap();

      const { token } = response.result;
      localStorage.setItem("token", token);

      const { id, email, role }: userModel = jwtDecode(token);
      dispatch(setLoggedInUser({ id, email, role }));

      if (rememberMe) {
        localStorage.setItem("rememberUserName", userInput.userName.trim());
      }

      await showSuccessOk("เข้าสู่ระบบสำเร็จ");

      sessionStorage.removeItem("postLoginRedirect");

      const roleLower = (role || "").toLowerCase();
      const isAdmin = roleLower === "admin";
      const isStaff = roleLower === "staff" || roleLower === "เจ้าหน้าที่";

      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else if (isStaff) {
        navigate("/staff/year", { replace: true });
      } else {
        navigate(computeRedirectTo(from), { state: prevState, replace: true });
      }
    } catch (err: any) {
      if (err?.data?.errorMessages?.length) {
        setError(err.data.errorMessages[0]);
      } else {
        setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sky-50 font-sans">
      {/* พื้นหลังนุ่มตา ไม่ขาวล้วน */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-100 to-cyan-100" />
        <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-blue-300/35 blur-3xl" />
        <div className="absolute -bottom-20 -right-12 h-[26rem] w-[26rem] rounded-full bg-cyan-300/35 blur-3xl" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.08]"
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
                className="text-[#16708a]"
                fill="currentColor"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10 lg:max-w-3xl">
        <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-2xl shadow-blue-900/10 backdrop-blur">
          <div>
            {/* Header */}
            <div className="border-b border-slate-100 px-6 pb-4 pt-7 sm:px-10 sm:pt-10 lg:px-14">
              <h1 className="mt-1 text-2xl text-center font-bold tracking-tight text-slate-900 sm:text-3xl">
                เข้าสู่ระบบ
              </h1>
              <p className="mt-2 text-sm  text-center leading-6 text-slate-500">
                กรุณากรอกข้อมูลให้ครบถ้วนเพื่อเข้าใช้งานระบบ
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 px-6 py-6 sm:px-10 sm:py-8 lg:px-14"
              aria-describedby={error ? "form-error" : undefined}
            >
              {/* Username */}
              <div>
                <label
                  htmlFor="userName"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <input
                    id="userName"
                    name="userName"
                    type="text"
                    inputMode="text"
                    autoComplete="username"
                    value={userInput.userName}
                    onChange={handleUserInput}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-[#16708a] focus:ring-4 focus:ring-cyan-600/15"
                    placeholder="เช่น student@email.com"
                    aria-invalid={!!error}
                  />
                  <UserIcon
                    className="absolute left-3.5 top-3 h-5 w-5 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    รหัสผ่าน (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                    aria-controls="password"
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {showPassword ? "ซ่อน" : "แสดง"}
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={userInput.password}
                    onChange={handleUserInput}
                    onKeyUp={handlePasswordKey}
                    onKeyDown={handlePasswordKey}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-10 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-[#16708a] focus:ring-4 focus:ring-cyan-600/15"
                    placeholder="••••••••"
                    aria-invalid={!!error}
                  />
                  <KeyRound
                    className="absolute left-3.5 top-3 h-5 w-5 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    รหัสผ่านตัวพิมพ์เล็ก/ใหญ่มีผล
                  </p>
                  {capsOn && (
                    <p className="text-xs font-medium text-amber-700">
                      ⚠️ เปิด Caps Lock อยู่
                    </p>
                  )}
                </div>
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
                disabled={!canSubmit || isLoading}
                aria-disabled={!canSubmit || isLoading}
                aria-busy={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-[#123568]/20 transition hover:bg-[#0c2852] focus:outline-none focus:ring-4 focus:ring-[#123568]/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading && (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {isLoading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
              </button>

              {/* Secondary action */}
              <div className="pt-1 text-center text-sm text-slate-600">
                ยังไม่มีบัญชี?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[#16708a] hover:text-[#0c5367] focus:outline-none focus:ring-2 focus:ring-cyan-600/30 rounded"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            </form>

            {/* Footer Note */}
            <div className="border-t border-slate-100 px-6 py-5 text-center text-xs leading-5 text-slate-500 sm:px-10 lg:px-14">
              ใช้สำหรับผู้เข้าร่วมกิจกรรมและเจ้าหน้าที่ในงาน
              หากมีปัญหาในการเข้าสู่ระบบ กรุณาติดต่อจุดลงทะเบียน.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
