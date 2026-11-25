import { useState, useRef, useEffect } from "react";
import {
  HiOutlineCube,
  HiOutlineHome,
  HiOutlineLogout,
  HiMenu,
  HiX,
  HiOutlineCalendar,
  HiOutlineDocumentDownload,
} from "react-icons/hi";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { withStaffAuth } from "../HOC";
import AdminManualButton from "./AdminManualButton";
import DisplayYearPicker from "./DisplayYearPicker";
import { emptyUserState, setLoggedInUser } from "../Redux/userAuthSlice";
import { showSuccessOk } from "../utils/confirmDelete";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../Redux/store";

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

// ===== MENU CONFIG FOR STAFF =====
const NAV_SECTIONS: NavSection[] = [
  {
    title: "เจ้าหน้าที่",
    items: [
      // {
      //   to: "/staff/dashboard",
      //   label: "รายงาน Dashboard",
      //   icon: HiOutlineChartBar,
      //   match: "prefix",
      // },
      {
        to: "/staff/year",
        label: "ปีการแข่งขัน",
        icon: HiOutlineCalendar,
        match: "prefix",
      },
      {
        to: "/staff/reports",
        label: "ศูนย์รายงาน",
        icon: HiOutlineDocumentDownload,
        match: "prefix",
      },
    ],
  },
];

const StaffNavMenu = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userData = useSelector((state: RootState) => state.userAuthStore);

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

  // redirect to /staff/year if path is exactly /staff
  useEffect(() => {
    if (location.pathname === "/staff" || location.pathname === "/staff/") {
      navigate("/staff/year", { replace: true });
    }
  }, [location.pathname, navigate]);

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
        className={`fixed lg:static h-screen z-30 flex flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? "w-72 translate-x-0"
            : "w-72 -translate-x-full lg:w-24 lg:translate-x-0"
        }`}
      >
        {/* logo */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-center lg:justify-start">
          <div className="flex-shrink-0 rounded-2xl bg-indigo-700 p-2.5 text-white shadow-sm">
            <HiOutlineCube className="w-6 h-6" />
          </div>
          {sidebarOpen && (
            <div className="ml-3 min-w-0 transition-opacity duration-300">
              <h1 className="whitespace-nowrap text-lg font-bold text-slate-900">
                ระบบเจ้าหน้าที่
              </h1>
              <p className="text-xs text-slate-500">
                งานสัปดาห์วิทยาศาสตร์เเห่งชาติ
              </p>
            </div>
          )}
        </div>

        {/* menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i}>
              {sidebarOpen && section.title && (
                <p className="mb-3 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {section.title}
                </p>
              )}

              <ul className="space-y-1">
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
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 group ${
                          active
                            ? "bg-indigo-600 text-white font-semibold shadow-sm"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <Icon
                          className={`w-5 h-5 transition-transform duration-200 ${
                            active ? "scale-110" : "group-hover:scale-105"
                          }`}
                        />
                        {sidebarOpen && (
                          <span className="whitespace-nowrap">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* logout */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 font-medium text-rose-600 transition-colors duration-200 hover:bg-rose-50 lg:justify-start"
            title={!sidebarOpen ? "ออกจากระบบ" : undefined}
          >
            <HiOutlineLogout className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            {sidebarOpen && <span>ออกจากระบบ</span>}
          </button>
        </div>
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
                สำหรับเจ้าหน้าที่ / Staff
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
          <DisplayYearPicker editable={false} />
          <Link
            to="/"
            title="ไปหน้าแรกของเว็บไซต์"
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <HiOutlineHome className="h-5 w-5 text-emerald-600" />
            <span className="hidden sm:inline">หน้าแรกเว็บไซต์</span>
          </Link>
          <AdminManualButton />

          {/* profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 transition-opacity hover:opacity-90"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-700 font-bold text-white shadow-sm">
                S
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  เจ้าหน้าที่
                </p>
                <p className="text-xs text-slate-500">
                  {userData.email || "Staff"}
                </p>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-52 origin-top-right rounded-2xl border border-slate-200 bg-white py-2 shadow-lg transition-all animate-in fade-in slide-in-from-top-2">
                <div className="mb-2 border-b border-slate-100 px-4 py-2">
                  <p className="text-sm font-semibold text-slate-700">
                    Staff User
                  </p>
                  <p className="text-xs text-slate-500 truncate">
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
          <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full bg-indigo-50/60 blur-3xl opacity-60" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/4 translate-y-1/3 rounded-full bg-slate-200/50 blur-3xl opacity-70" />

          <div className="w-full relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default withStaffAuth(StaffNavMenu);
