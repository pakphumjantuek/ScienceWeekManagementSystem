import { useState } from "react";
import {
  useMeQuery,
  useLogoutMutation,
  useGetCsrfQuery,
} from "../authCookiesApi"; // ⬅️ เพิ่ม useGetCsrfQuery

export default function Secure() {
  // ⬇️ ดึง CSRF ทันทีที่เข้าเพจ (กันยิง logout โดยไม่มี token)
  useGetCsrfQuery(undefined, { refetchOnMountOrArgChange: true });

  const { data, isFetching } = useMeQuery();
  const [logout, { isLoading }] = useLogoutMutation();
  const [message, setMessage] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      setMessage("✅ Logout successful");
      window.location.replace("/logins");
    } catch {
      setMessage("❌ Logout failed");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-16 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Secure Area
      </h2>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        {isFetching ? (
          <p className="text-gray-500">Loading...</p>
        ) : data ? (
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <p className="text-gray-500 italic">No user data</p>
        )}
      </div>

      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="mt-6 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
      >
        {isLoading ? "Logging out..." : "Logout"}
      </button>

      {message && (
        <p
          className={`mt-4 text-center font-medium ${
            message.includes("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
