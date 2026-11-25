function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300">
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl text-center max-w-md w-full">
        <div className="text-5xl text-red-500 mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          ไม่มีสิทธิ์เข้าถึง
        </h1>
        <p className="text-gray-600 mb-6">
          คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้
          กรุณาติดต่อผู้ดูแลระบบหากคิดว่านี่คือความผิดพลาด
        </p>
        <a
          href="/"
          className="inline-block w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          กลับสู่หน้าหลัก
        </a>
      </div>
    </div>
  );
}

export default AccessDenied;
