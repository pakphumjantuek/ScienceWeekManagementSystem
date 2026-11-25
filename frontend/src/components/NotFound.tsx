import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <h2 className="mt-4 text-2xl md:text-3xl font-semibold text-slate-900">
          ไม่พบหน้าที่ต้องการ
        </h2>

        <p className="mt-4 text-slate-600 leading-relaxed">
          ขออภัย ไม่พบหน้าที่คุณกำลังค้นหา อาจเกิดจากลิงก์ไม่ถูกต้อง
          หน้าถูกย้ายตำแหน่ง หรือไม่มีอยู่ในระบบแล้ว
        </p>

        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
