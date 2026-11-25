import { HiOutlineBookOpen } from "react-icons/hi";
import { useGetSystemSettingsQuery } from "../features/setting/systemSettingsApi";

export const adminManualUrl = (path: string) =>
  `${(import.meta.env.VITE_API_BASE_URLS as string).replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

/**
 * ปุ่ม "คู่มือการใช้งาน" บนแถบหัวของแอดมิน/เจ้าหน้าที่ (แสดงเมื่อมีการอัปโหลดคู่มือแล้วเท่านั้น)
 * ส่ง children/className มาเพื่อใช้เป็นปุ่ม "เปิดดู" ในหน้าตั้งค่าได้
 */
const AdminManualButton = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
  const { data } = useGetSystemSettingsQuery();
  const path = data?.adminManualPath;
  if (!path) return null;

  return (
    <a
      href={adminManualUrl(path)}
      target="_blank"
      rel="noopener noreferrer"
      title="คู่มือการใช้งาน"
      className={
        className ??
        "flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
      }
    >
      {children ?? (
        <>
          <HiOutlineBookOpen className="h-5 w-5 text-blue-600" />
          <span className="hidden sm:inline">คู่มือการใช้งาน</span>
        </>
      )}
    </a>
  );
};

export default AdminManualButton;
