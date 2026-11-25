import { useState, useRef, useEffect } from "react";
import {
  HiOutlineUserGroup,
  HiOutlineCube,
  HiOutlineHome,
  HiOutlineLogout,
  HiMenu,
  HiX,
  HiOutlineNewspaper,
  HiOutlineCalendar,
  HiOutlineClipboardCheck,
  HiOutlineAcademicCap,
  HiOutlineBadgeCheck,
  HiOutlineOfficeBuilding,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineClipboardList,
  HiOutlineDocumentDownload,
  HiOutlineBookOpen,
  HiOutlineFolderOpen,
  HiOutlinePhotograph,
  HiOutlineUsers,
} from "react-icons/hi";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { withAdminAuth } from "../HOC";
import AdminManualButton from "./AdminManualButton";
import DisplayYearPicker from "./DisplayYearPicker";
import { emptyUserState, setLoggedInUser } from "../Redux/userAuthSlice";
import { showSuccessOk } from "../utils/confirmDelete";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../Redux/store";
import { useGetSystemSettingsQuery } from "../features/setting/systemSettingsApi";

// ===== Types =====
type MatchMode = "exact" | "prefix";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: MatchMode;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

// ===== Active Route =====
const isRouteActive = (
  pathname: string,
  to: string,
  mode: MatchMode = "exact",
) => {
  if (mode === "exact") return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
};

// ===== MENU CONFIG =====
const NAV_SECTIONS: NavSection[] = [
  {
    title: "ภาพรวม",
    items: [
      {
        to: "/admin/report-dashboard",
        label: "รายงาน Dashboard",
        icon: HiOutlineChartBar,
        match: "prefix",
      },
      {
        to: "/admin/reports",
        label: "ศูนย์รายงาน",
        icon: HiOutlineDocumentDownload,
        match: "prefix",
      },
      {
        to: "/admin/year",
        label: "ปีการแข่งขัน",
        icon: HiOutlineCalendar,
        match: "prefix",
      },
    ],
  },
  {
    title: "ผู้ใช้งาน",
    items: [
      {
        to: "/admin/useradmin",
        label: "รายชื่อผู้สมัคร",
        icon: HiOutlineUsers,
      },
      {
        to: "/admin/role",
        label: "สิทธิ์การใช้งาน",
        icon: HiOutlineBadgeCheck,
      },
    ],
  },
  {
    title: "การแข่งขัน",
    items: [
      {
        to: "/admin/team",
        label: "ทีมทั้งหมด",
        icon: HiOutlineUserGroup,
        match: "prefix",
      },
      {
        to: "/admin/school",
        label: "โรงเรียน",
        icon: HiOutlineOfficeBuilding,
        match: "prefix",
      },
    ],
  },
  {
    title: "อบรม",
    items: [
      {
        to: "/admin/trainingtopics",
        label: "จัดการหลักสูตรอบรม",
        icon: HiOutlineBookOpen,
        match: "prefix",
      },
      {
        to: "/admin/branches",
        label: "จัดการสาขาวิชา",
        icon: HiOutlineFolderOpen,
        match: "prefix",
      },
    ],
  },
  {
    title: "ข้อมูลพื้นฐาน",
    items: [
      {
        to: "/admin/competitiontype",
        label: "ประเภทการแข่งขัน",
        icon: HiOutlineCube,
      },
      {
        to: "/admin/competition",
        label: "กิจกรรมการแข่งขัน",
        icon: HiOutlineClipboardCheck,
        match: "prefix",
      },
      {
        to: "/admin/educationlevel",
        label: "ระดับชั้น",
        icon: HiOutlineAcademicCap,
        match: "prefix",
      },
      {
        to: "/admin/rewardType",
        label: "ประเภทรางวัล",
        icon: HiOutlineBadgeCheck,
        match: "prefix",
      },
    ],
  },
  {
    title: "เนื้อหา",
    items: [
      {
        to: "/admin/news",
        label: "ข่าวประชาสัมพันธ์",
        icon: HiOutlineNewspaper,
        match: "prefix",
      },
      {
        to: "/admin/homebanners",
        label: "แบนเนอร์หน้าแรก",
        icon: HiOutlinePhotograph,
        match: "prefix",
      },
    ],
  },
  {
    title: "ตั้งค่า",
    items: [
      {
        to: "/admin/systemsettings",
        label: "ตั้งค่าระบบ",
        icon: HiOutlineCog,
        match: "prefix",
      },
      {
        to: "/admin/audit-log",
        label: "บันทึกการใช้งาน",
        icon: HiOutlineClipboardList,
        match: "prefix",
      },
    ],
  },
];

const NavMenu = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userData = useSelector((state: RootState) => state.userAuthStore);
  const roleLower = (userData.role || "").toLowerCase();
  const isStaff = roleLower === "staff" || roleLower === "เจ้าหน้าที่";
  const roleLabel = isStaff ? "เจ้าหน้าที่" : "ผู้ดูแลระบบ";
  const userInitial = (userData.email || "?").charAt(0).toUpperCase();

  const { data: settings } = useGetSystemSettingsQuery();
  const logoPath = settings?.logoPath ?? (settings as any)?.LogoPath;
  const logoSrc = logoPath
    ? `${import.meta.env.VITE_API_BASE_URLS}/${logoPath}`
    : `${import.meta.env.BASE_URL}institute-Logo.png`;

  const filteredSections = NAV_SECTIONS.map(section => {
    const items = section.items.filter(item => {
      if (isStaff) {
        const staffRoutes = [
          "/admin/year"
        ];
        return staffRoutes.includes(item.to);
      }
      return true;
    });
    return { ...section, items };
  }).filter(section => section.items.length > 0);

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(setLoggedInUser({ ...emptyUserState }));
    showSuccessOk("ออกจากระบบสำเร็จ");
    navigate("/");
  };

  // click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900 bg-opacity-40 backdrop-blur-sm z-20 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:static h-screen z-30 flex flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? "w-72 translate-x-0"
            : "w-72 -translate-x-full lg:w-20 lg:translate-x-0"
        }`}
      >
        {/* logo */}
        <div
          className={`h-[73px] flex flex-shrink-0 items-center border-b border-slate-200 ${
            sidebarOpen ? "px-5 gap-3" : "justify-center"
          }`}
        >
          <img
            src={logoSrc}
            alt="โลโก้สถาบัน"
            className="h-11 w-11 flex-shrink-0 object-contain"
          />
          {sidebarOpen && (
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-slate-900">
                ระบบจัดการแอดมิน
              </h1>
              <p className="truncate text-xs text-slate-500">
                งานสัปดาห์วิทยาศาสตร์แห่งชาติ
              </p>
            </div>
          )}
        </div>

        {/* menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
          {filteredSections.map((section, i) => (
            <div
              key={i}
              className={i > 0 ? "mt-4 pt-4 border-t border-slate-100" : ""}
            >
              {sidebarOpen && section.title && (
                <p className="mb-1.5 px-3 text-xs font-semibold text-slate-400">
                  {section.title}
                </p>
              )}

              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isRouteActive(
                    location.pathname,
                    item.to,
                    item.match || "exact",
                  );

                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => {
                          if (window.innerWidth < 1024) setSidebarOpen(false);
                        }}
                        aria-current={active ? "page" : undefined}
                        title={!sidebarOpen ? item.label : undefined}
                        className={`flex items-center gap-3 rounded-xl py-2.5 text-[15px] transition-colors duration-150 ${
                          sidebarOpen ? "px-3" : "justify-center"
                        } ${
                          active
                            ? "bg-blue-600 text-white font-semibold shadow-sm"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 flex-shrink-0 ${
                            active ? "text-white" : "text-slate-400"
                          }`}
                        />
                        {sidebarOpen && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/85 px-6 py-4 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
            >
              {sidebarOpen ? <HiX size={24} /> : <HiMenu size={24} />}
            </button>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">
                ระบบจัดการงานสัปดาห์วิทยาศาสตร์
              </p>
              <p className="text-xs text-slate-500">
                สำหรับผู้ดูแลระบบมหาวิทยาลัย
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
          <DisplayYearPicker editable={!isStaff} />
          <Link
            to="/"
            title="ไปหน้าแรกของเว็บไซต์"
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <HiOutlineHome className="h-5 w-5 text-emerald-600" />
            <span className="hidden sm:inline">หน้าแรกเว็บไซต์</span>
          </Link>
          <AdminManualButton />
          {!isStaff && (
            <Link
              to="/admin/systemsettings"
              title="ตั้งค่าระบบ"
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <HiOutlineCog className="h-5 w-5 text-slate-500" />
              <span className="hidden sm:inline">ตั้งค่า</span>
            </Link>
          )}

          {/* profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 transition-opacity hover:opacity-90"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-sm">
                {userInitial}
              </div>
              <div className="hidden text-left sm:block max-w-[180px]">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {roleLabel}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {userData.email}
                </p>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white py-2 shadow-lg transition-all animate-in fade-in slide-in-from-top-2">
                <div className="mb-2 border-b border-slate-100 px-4 py-2">
                  <p className="text-sm font-semibold text-slate-700">
                    {roleLabel}
                  </p>
                  <p className="text-xs text-slate-500 truncate" title={userData.email}>
                    {userData.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <HiOutlineLogout className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="relative flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 scroll-smooth sm:p-6">
          {/* Background Decoration (Optional: ช่วยให้ดูมีมิติ) */}
          <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full bg-blue-50/60 blur-3xl opacity-60" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/4 translate-y-1/3 rounded-full bg-slate-200/50 blur-3xl opacity-70" />

          <div className="w-full relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default withAdminAuth(NavMenu);
