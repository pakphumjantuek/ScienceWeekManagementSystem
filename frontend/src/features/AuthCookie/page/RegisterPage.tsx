import { useState } from "react";
import { useRegisterMutation, useGetCsrfQuery } from "../authCookiesApi";
import { useAppSelector } from "../hooks";
import { useNavigate } from "react-router-dom";
export default function RegisterPage() {
  const [email, setE] = useState("");
  const [password, setP] = useState("");
  const navigate = useNavigate();
  // โหลด CSRF ตั้งแต่เข้าเพจ
  const { isFetching: isGettingCsrf, refetch: refetchCsrf } = useGetCsrfQuery();

  const csrf = useAppSelector((s) => s.authCookies.csrfToken);
  const [register, { isLoading, error, data }] = useRegisterMutation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // กันกรณี token หล่น: ลองดึงใหม่สั้น ๆ
    if (!csrf) {
      try {
        await refetchCsrf().unwrap();
      } catch {}
    }
    await register({ email, password }).unwrap();
    navigate("/logins");
  };

  const disabled = isLoading || isGettingCsrf || !email || !password;

  // แปลง error เป็นข้อความสั้น ๆ (ถ้ามี)
  const errMsg =
    (error as any)?.data?.message ||
    (error as any)?.error ||
    (error ? "Register failed" : "");

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Register
      </h2>

      <form onSubmit={submit} className="space-y-4">
        <input
          value={email}
          onChange={(e) => setE(e.target.value)}
          placeholder="Email"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setP(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          required
        />

        <button
          type="submit"
          disabled={disabled}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {isGettingCsrf
            ? "Preparing..."
            : isLoading
            ? "Creating..."
            : "Create"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-center text-red-600">{errMsg}</p>
      )}
      {data && <p className="mt-4 text-sm text-center text-green-600">OK</p>}
    </div>
  );
}
