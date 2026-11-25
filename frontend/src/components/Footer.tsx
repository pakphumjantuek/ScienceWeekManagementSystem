import { NavLink } from "react-router-dom";
import { MapPin, Phone, ExternalLink } from "lucide-react";
import { useGetSystemSettingsQuery } from "../features/setting/systemSettingsApi";
import { adminManualUrl } from "./AdminManualButton";

// ข้อมูลติดต่อ (ยังไม่มีในหน้าตั้งค่า)
const CONTACT = {
  phone: "034-534092",
  org: "คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏกาญจนบุรี",
  address: "เลขที่ 70 หมู่ 4 ต.หนองบัว อ.เมือง จ.กาญจนบุรี 71190",
};
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  "คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏกาญจนบุรี",
)}`;

const Footer = () => {
  const { data: settings } = useGetSystemSettingsQuery();
  const s = settings as any;
  const logoPath = settings?.logoPath ?? s?.LogoPath;
  const logoSrc = logoPath
    ? `${import.meta.env.VITE_API_BASE_URLS}/${logoPath}`
    : `${import.meta.env.BASE_URL}institute-Logo.png`;
  const projectName = settings?.projectName ?? s?.ProjectName ?? "กิจกรรมสัปดาห์วิทยาศาสตร์";
  const projectSubtitle =
    settings?.projectSubtitle ?? s?.ProjectSubtitle ?? "มหาวิทยาลัยราชภัฏกาญจนบุรี";

  // ซ่อนลิงก์ตามการตั้งค่าเมนูเดียวกับแถบเมนูด้านบน
  const showTraining = settings?.showTrainingMenu ?? s?.ShowTrainingMenu ?? true;
  const showNews = settings?.showNewsMenu ?? s?.ShowNewsMenu ?? true;
  const showResults = settings?.showResultsMenu ?? s?.ShowResultsMenu ?? true;
  const showActivity = settings?.showActivityMenu ?? s?.ShowActivityMenu ?? true;
  const userManualPath = settings?.userManualPath ?? s?.UserManualPath;

  const groups = [
    {
      title: "การแข่งขัน",
      links: [
        showActivity && { label: "ลงทะเบียนกิจกรรม", to: "/yearuser" },
        { label: "กำหนดการ", to: "/schedule" },
        showResults && { label: "ผลการแข่งขัน", to: "/yearresults" },
        { label: "ประวัติการลงทะเบียน", to: "/my-registrations" },
      ],
    },
    {
      title: "ข้อมูล",
      links: [
        { label: "หน้าแรก", to: "/" },
        showNews && { label: "ข่าวสาร", to: "/newsList" },
        showTraining && { label: "ลงทะเบียนอบรม", to: "/training/list" },
      ],
    },
  ].map((g) => ({
    ...g,
    links: g.links.filter(Boolean) as { label: string; to: string }[],
  }));

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
        {/* Logo & about */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="โลโก้สถาบัน" className="h-14 w-14 object-contain shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-bold text-white leading-tight">{projectName}</p>
              <p className="text-sm text-slate-400">{projectSubtitle}</p>
            </div>
          </div>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            ระบบรับสมัครและประกาศผลการแข่งขันกิจกรรมสัปดาห์วิทยาศาสตร์
            สำหรับนักเรียนและครูจากสถานศึกษาทั่วประเทศ
          </p>
        </div>

        {/* Links */}
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <h3 className="text-base font-bold text-white mb-3">{g.title}</h3>
            <ul className="space-y-2.5 text-base">
              {g.links.map((l) => (
                <li key={l.to}>
                  <NavLink to={l.to} className="hover:text-white hover:underline underline-offset-4 transition-colors">
                    {l.label}
                  </NavLink>
                </li>
              ))}
              {g.title === "ข้อมูล" && userManualPath && (
                <li>
                  <a
                    href={adminManualUrl(userManualPath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-white hover:underline underline-offset-4 transition-colors"
                  >
                    คู่มือผู้ใช้ (PDF)
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </li>
              )}
            </ul>
          </nav>
        ))}

        {/* Contact */}
        <div>
          <h3 className="text-base font-bold text-white mb-3">ติดต่อ</h3>
          <ul className="space-y-3 text-base">
            <li>
              <a
                href={`tel:${CONTACT.phone.replace(/-/g, "")}`}
                className="inline-flex items-center gap-2.5 hover:text-white transition-colors"
              >
                <Phone className="w-5 h-5 text-sky-400 shrink-0" />
                {CONTACT.phone}
              </a>
            </li>
            <li>
              <a
                href={MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2.5 hover:text-white transition-colors"
              >
                <MapPin className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  {CONTACT.org}
                  <span className="block text-slate-400 group-hover:text-slate-300">{CONTACT.address}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm text-sky-400">
                    เปิดแผนที่ <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-slate-800">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-5 text-center text-sm sm:text-base text-slate-400 space-y-1">
          <p>© {new Date().getFullYear()} กิจกรรมสัปดาห์วิทยาศาสตร์. All rights reserved.</p>
          <p>พัฒนาโดย สาขาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยราชภัฏกาญจนบุรี</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
