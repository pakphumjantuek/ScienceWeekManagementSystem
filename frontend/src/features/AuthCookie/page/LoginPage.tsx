import { useState } from "react";
import { useLoginMutation, useGetCsrfQuery } from "../authCookiesApi";
import { useAppSelector } from "../hooks";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setE] = useState("");
  const [password, setP] = useState("");

  // ดึง CSRF ตั้งแต่โหลดหน้า
  const { isFetching: isGettingCsrf, refetch: refetchCsrf } = useGetCsrfQuery();

  const csrf = useAppSelector((s) => s.authCookies.csrfToken);
  const [login, { isLoading, error, data }] = useLoginMutation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // กันกรณี token หล่น ให้ลองดึงใหม่สั้น ๆ
    if (!csrf)
      await refetchCsrf()
        .unwrap()
        .catch(() => {});
    await login({ email, password }).unwrap();
    navigate("/secures");
  };

  const disabled = isLoading || isGettingCsrf || !csrf || !email || !password;

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Login
      </h2>

      <form onSubmit={submit} className="space-y-4">
        <input
          value={email}
          onChange={(e) => setE(e.target.value)}
          placeholder="Email"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setP(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={disabled}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {isGettingCsrf ? "Preparing..." : isLoading ? "Loading..." : "Login"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-center text-red-600">Login failed</p>
      )}
      {data && <p className="mt-4 text-sm text-center text-green-600">OK</p>}
    </div>
  );
}
