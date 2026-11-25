import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  BarChart3,
  LogIn,
  LogOut,
  Newspaper,
  BookOpen,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  ClipboardList,
  FileQuestion,
} from "lucide-react";
import { adminManualUrl } from "./AdminManualButton";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { RootState } from "../Redux/store";
import { emptyUserState, setLoggedInUser } from "../Redux/userAuthSlice";
import { showSuccessOk } from "../utils/confirmDelete";
import { useGetSystemSettingsQuery } from "../features/setting/systemSettingsApi";

const themeGradients: Record<string, string> = {
  emerald: "from-emerald-600 via-teal-600 to-cyan-700",
  blue: "from-blue-600 via-indigo-600 to-violet-700",
  purple: "from-purple-600 via-fuchsia-600 to-pink-700",
  ruby: "from-rose-600 via-red-600 to-orange-700",
  slate: "from-slate-700 via-slate-800 to-slate-900",
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const instituteLogoSrc = `${import.meta.env.BASE_URL}institute-Logo.png`;
  const { data: settings } = useGetSystemSettingsQuery();
  const logoPath = settings?.logoPath ?? (settings as any)?.LogoPath;
  const logoSrc = logoPath
    ? `${import.meta.env.VITE_API_BASE_URLS}/${logoPath}`
    : instituteLogoSrc;
  const activeTheme = settings?.theme ?? (settings as any)?.Theme ?? "emerald";
  const navbarGradient = themeGradients[activeTheme] || themeGradients.emerald;

  const userData = useSelector((state: RootState) => state.userAuthStore);
  const isAuthenticated = !!userData.id;
  const initial = (userData.email || "?").charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(setLoggedInUser({ ...emptyUserState }));
    showSuccessOk("ออกจากระบบสำเร็จ");
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    navigate("/");
  };

  // ปิดเมนูเมื่อเปลี่ยนหน้า / คลิกนอกเมนูผู้ใช้
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const showTraining =
    settings?.showTrainingMenu ?? (settings as any)?.ShowTrainingMenu ?? true;
  const showNews =
    settings?.showNewsMenu ?? (settings as any)?.ShowNewsMenu ?? true;
  const showResults =
    settings?.showResultsMenu ?? (settings as any)?.ShowResultsMenu ?? true;
  const showActivity =
    settings?.showActivityMenu ?? (settings as any)?.ShowActivityMenu ?? true;
  // คู่มือผู้ใช้ (แสดงเมื่ออัปโหลดไฟล์แล้ว)
  const userManualPath = settings?.userManualPath ?? (settings as any)?.UserManualPath;
  const userManualHref = userManualPath ? adminManualUrl(userManualPath) : null;

  // ปุ่มหลัก "ลงทะเบียนกิจกรรม": สีเหลืองทองตัดกับทุกธีม มีเงาและยกขึ้นเล็กน้อยเมื่อชี้
  const registerBtnClass =
    "items-center justify-center rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 font-bold text-slate-900 " +
    "shadow-md shadow-black/20 ring-1 ring-white/40 whitespace-nowrap transition-all duration-200 " +
    "hover:from-amber-200 hover:to-yellow-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0";

  // เมนูทั่วไป เรียงตามความสำคัญ ("ลงทะเบียนกิจกรรม" แยกเป็นปุ่มเด่นด้านขวา)
  const menuItems = [
    { label: "หน้าแรก", to: "/" },
    ...(showResults
      ? [{ icon: BarChart3, label: "ผลการแข่งขัน", to: "/yearresults" }]
      : []),
    { icon: CalendarDays, label: "แผนผังกิจกรรม", to: "/schedule" },
    ...(showTraining
      ? [{ icon: BookOpen, label: "ลงทะเบียนอบรม", to: "/training/list" }]
      : []),
    ...(showNews
      ? [{ icon: Newspaper, label: "ข่าวสาร", to: "/newsList" }]
      : []),
  ];

  const projectName =
    settings?.projectName ?? (settings as any)?.ProjectName ?? "คณะวิทยาศาสตร์และเทคโนโลยี";
  const projectSubtitle =
    settings?.projectSubtitle ?? (settings as any)?.ProjectSubtitle ?? "มหาวิทยาลัยราชภัฏกาญจนบุรี";

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium whitespace-nowrap transition-colors ${
      isActive ? "bg-white/25 text-white" : "text-white/90 hover:text-white hover:bg-white/15"
    }`;
  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3.5 rounded-xl text-lg font-medium transition-colors ${
      isActive ? "bg-white text-slate-900" : "text-white hover:bg-white/15"
    }`;

  return (
    <nav className={`bg-gradient-to-r ${navbarGradient} shadow-lg sticky top-0 z-50`}>
      <div className="w-full px-3 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between gap-3 h-16 lg:h-[72px]">
          {/* Logo + name */}
          <NavLink to="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src={logoSrc} alt="โลโก้สถาบัน" className="h-10 w-10 sm:h-12 sm:w-12 object-contain shrink-0" />
            <div className="min-w-0">
              <p className="text-base sm:text-lg xl:text-xl font-bold text-white leading-tight truncate">
                {projectName}
              </p>
              <p className="text-xs sm:text-sm text-white/80 leading-tight truncate">{projectSubtitle}</p>
            </div>
          </NavLink>

          {/* Desktop Menu */}
          <div className="hidden xl:flex items-center gap-0.5">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink key={item.label} to={item.to} end={item.to === "/"} className={desktopLinkClass}>
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {userManualHref && (
              <a
                href={userManualHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-lg text-base font-medium text-white/90 hover:text-white hover:bg-white/15 transition-colors whitespace-nowrap"
                title="เปิดคู่มือผู้ใช้ (PDF)"
              >
                <FileQuestion className="h-4 w-4" />
                คู่มือผู้ใช้
              </a>
            )}
            {showActivity && (
              <NavLink
                to="/yearuser"
                className={({ isActive }) =>
                  `${registerBtnClass} hidden md:inline-flex px-6 py-2.5 text-base ${
                    isActive ? "ring-2 ring-white ring-offset-2 ring-offset-transparent" : ""
                  }`
                }
              >
                ลงทะเบียนกิจกรรม
              </NavLink>
            )}

            {isAuthenticated ? (
              <div className="relative hidden xl:block" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  aria-label="เมนูผู้ใช้"
                  className="flex items-center gap-1.5 rounded-full border border-white/40 pl-1 pr-2 py-1 text-white hover:bg-white/15 transition-colors cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center font-bold">
                    {initial}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isUserMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl text-slate-800"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs text-slate-500">เข้าสู่ระบบในชื่อ</p>
                      <p className="text-sm font-semibold truncate" title={userData.email}>
                        {userData.email}
                      </p>
                    </div>
                    <NavLink
                      to="/my-registrations"
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2.5 text-base hover:bg-slate-50"
                    >
                      <ClipboardList className="h-4 w-4 text-blue-600" />
                      ประวัติการลงทะเบียน
                    </NavLink>
                    {showTraining && (
                      <NavLink
                        to="/training/my"
                        role="menuitem"
                        className="flex items-center gap-2 px-4 py-2.5 text-base hover:bg-slate-50"
                      >
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        การอบรมของฉัน
                      </NavLink>
                    )}
                    <button
                      onClick={handleLogout}
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-base text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-white/50 text-sm sm:text-base font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogIn className="h-5 w-5" />
                <span className="hidden sm:inline">เข้าสู่ระบบ</span>
                <span className="sm:hidden">เข้าระบบ</span>
              </button>
            )}

            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label={isMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
              aria-expanded={isMenuOpen}
              className="xl:hidden p-2.5 text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / tablet menu */}
      {isMenuOpen && (
        <div className="xl:hidden border-t border-white/20 bg-black/15 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-3 sm:px-6 py-3 space-y-1">
            {isAuthenticated && (
              <div className="px-4 py-3 mb-2 rounded-xl bg-white/15 text-white">
                <p className="text-sm text-white/80">เข้าสู่ระบบในชื่อ</p>
                <p className="text-lg font-semibold truncate">{userData.email}</p>
              </div>
            )}
            {showActivity && (
              <NavLink
                to="/yearuser"
                className={`${registerBtnClass} flex w-full px-4 py-3.5 text-lg mb-2`}
              >
                ลงทะเบียนกิจกรรม
              </NavLink>
            )}
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink key={item.label} to={item.to} end={item.to === "/"} className={mobileLinkClass}>
                  {IconComponent && <IconComponent className="h-5 w-5" />}
                  {item.label}
                </NavLink>
              );
            })}
            {userManualHref && (
              <a
                href={userManualHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-lg font-medium text-white hover:bg-white/15 transition-colors"
              >
                <FileQuestion className="h-5 w-5" />
                คู่มือผู้ใช้
              </a>
            )}
            {isAuthenticated && (
              <NavLink to="/my-registrations" className={mobileLinkClass}>
                <ClipboardList className="h-5 w-5" />
                ประวัติการลงทะเบียน
              </NavLink>
            )}
            {isAuthenticated && showTraining && (
              <NavLink to="/training/my" className={mobileLinkClass}>
                <GraduationCap className="h-5 w-5" />
                การอบรมของฉัน
              </NavLink>
            )}
            {isAuthenticated && (
              <div className="pt-2 mt-2 border-t border-white/20">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-lg font-medium text-white hover:bg-white/15 transition-colors cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
