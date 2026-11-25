import { useEffect, useMemo, useState } from "react";
import {
  Users,
  ChevronRight,
  FileText,
  BookOpen,
  Trophy,
  Award,
  ChevronLeft,
  Calendar,
  Clock,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  ArrowUp,
  Target,
  Medal,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGetAllYearQuery } from "../../Year/YearApi";
import { useGetAllNewsQuery } from "../../News/newsApi";
import type { News } from "../../News/type";
import { formatThaiDate } from "../../../utils";
import { useDocumentTitle } from "../../../utils/dateUtils";
import { buildImageUrl } from "../../../utils/๊UrlImage";
import { useGetSystemSettingsQuery } from "../../setting/systemSettingsApi";
import { useGetHomeBannersQuery } from "../homeBannersApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../Redux/store";

type HomeContent = {
  heroTitle?: string;
  heroHighlight?: string;
  heroDescription?: string;
  registerButtonLabel?: string;
  guideButtonLabel?: string;
  applicantsButtonLabel?: string;
  showNews?: boolean;
  newsTitle?: string;
  newsDescription?: string;
  newsButtonLabel?: string;
  displayYearId?: number;
};

const useHomeContent = (): HomeContent => {
  const { data: settings } = useGetSystemSettingsQuery();
  const setting = settings as any;
  const content = settings?.homepageContent ?? setting?.HomepageContent;
  try {
    const legacy = content ? JSON.parse(content) : {};
    return {
      ...legacy,
      heroTitle:
        settings?.homeHeroTitle ?? setting?.HomeHeroTitle ?? legacy.heroTitle,
      heroHighlight:
        settings?.homeHeroHighlight ??
        setting?.HomeHeroHighlight ??
        legacy.heroHighlight,
      heroDescription:
        settings?.homeHeroDescription ??
        setting?.HomeHeroDescription ??
        legacy.heroDescription,
      registerButtonLabel:
        settings?.homeRegisterButtonLabel ??
        setting?.HomeRegisterButtonLabel ??
        legacy.registerButtonLabel,
      guideButtonLabel:
        settings?.homeGuideButtonLabel ??
        setting?.HomeGuideButtonLabel ??
        legacy.guideButtonLabel,
      applicantsButtonLabel:
        settings?.homeApplicantsButtonLabel ??
        setting?.HomeApplicantsButtonLabel ??
        legacy.applicantsButtonLabel,
      showNews:
        settings?.showHomeNews ?? setting?.ShowHomeNews ?? legacy.showNews,
      newsTitle:
        settings?.homeNewsTitle ?? setting?.HomeNewsTitle ?? legacy.newsTitle,
      newsDescription:
        settings?.homeNewsDescription ??
        setting?.HomeNewsDescription ??
        legacy.newsDescription,
      newsButtonLabel:
        settings?.homeNewsButtonLabel ??
        setting?.HomeNewsButtonLabel ??
        legacy.newsButtonLabel,
      displayYearId:
        settings?.homeDisplayYearId ??
        setting?.HomeDisplayYearId ??
        legacy.displayYearId,
    };
  } catch {
    return {};
  }
};

const stripHtml = (html?: string) => {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-amber-500 animate-pulse" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto">
      <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
        <FileText size={40} />
      </div>
      <h3 className="text-slate-800 font-bold text-lg">
        ยังไม่มีประกาศให้แสดงในขณะนี้
      </h3>
      <p className="text-slate-500 text-sm mt-1">
        โปรดติดตามประกาศในภายหลัง
      </p>
    </div>
  );
}

const getRegisterStatus = (openDate?: string, closeDate?: string) => {
  const now = new Date();
  const open = openDate ? new Date(openDate) : null;
  const close = closeDate ? new Date(closeDate) : null;

  if (open && now < open) {
    return {
      text: "ยังไม่เปิดรับสมัคร",
      canRegister: false,
      targetDate: open,
    };
  }

  if (close && now > close) {
    return {
      text: "ปิดรับสมัครแล้ว",
      canRegister: false,
      targetDate: null,
    };
  }

  return {
    text: "เปิดรับสมัครแล้ว",
    canRegister: true,
    targetDate: close,
  };
};

// ==== Dynamic Countdown Component (Academic Light Theme) ====
function RegistrationCountdown({ targetDate }: { targetDate: Date | null }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(null);
      return;
    }

    const calculate = () => {
      const diff = targetDate.getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="mt-6 flex flex-col items-center">
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-100/80 text-blue-800 text-xs font-semibold mb-3 border border-blue-200">
        <Clock
          className="w-3.5 h-3.5 text-blue-600 animate-spin"
          style={{ animationDuration: "8s" }}
        />
        <span>นับถอยหลังกำหนดการรับสมัคร</span>
      </div>
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3 text-center max-w-sm mx-auto w-full">
        {[
          { label: "วัน", value: timeLeft.days },
          { label: "ชั่วโมง", value: timeLeft.hours },
          { label: "นาที", value: timeLeft.minutes },
          { label: "วินาที", value: timeLeft.seconds },
        ].map((unit, i) => (
          <div
            key={i}
            className="bg-white border border-blue-200 text-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-md shadow-blue-900/5"
          >
            <span className="block text-xl sm:text-2xl font-extrabold text-blue-700 font-mono">
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroSection() {
  const { data: years = [] } = useGetAllYearQuery();
  const navigate = useNavigate();
  const content = useHomeContent();
  const isLoggedIn = useSelector((state: RootState) => !!state.userAuthStore.id);

  const activeYear = (() => {
    const actives = years.filter((y) => y.isActive);
    if (actives.length === 0) return undefined;
    return actives
      .slice()
      .sort((a, b) => (b.yearNumber ?? 0) - (a.yearNumber ?? 0))[0];
  })();
  const displayYear =
    years.find((year) => year.yearID === content.displayYearId) ?? activeYear;

  const registerStatus = getRegisterStatus(
    displayYear?.registrationOpenDate,
    displayYear?.registrationCloseDate,
  );
  const isOpen = registerStatus.canRegister;
  const isClosed = registerStatus.text === "ปิดรับสมัครแล้ว";

  const onPrimary = () => {
    if (isClosed) return navigate("/yearresults");
    if (!isOpen) return;
    const external = import.meta.env.VITE_REGISTER_URL as string | undefined;
    if (external) window.location.href = external;
    else navigate(`/competitionYearsList/${displayYear?.yearID}`);
  };

  const onViewApplicantSummary = () => {
    if (!displayYear?.yearID) return;
    navigate(`/reports/applicants/${displayYear.yearID}/summary`);
  };

  const formatThaiDateOnly = (date?: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const daysLeft = registerStatus.targetDate
    ? Math.ceil((registerStatus.targetDate.getTime() - Date.now()) / 86_400_000)
    : null;

  const statusTone = isOpen
    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
    : isClosed
      ? "border-slate-300 bg-white text-slate-700"
      : "border-amber-300 bg-amber-50 text-amber-900";
  const dotTone = isOpen ? "bg-emerald-500 animate-pulse" : isClosed ? "bg-slate-400" : "bg-amber-500";

  const quickLinks = [
    { label: "กำหนดการ", to: "/schedule", icon: Calendar },
    { label: "ผลการแข่งขัน", to: "/yearresults", icon: Trophy },
    { label: "ข่าวสาร", to: "/newsList", icon: FileText },
    ...(isLoggedIn ? [{ label: "ประวัติการลงทะเบียน", to: "/my-registrations", icon: Users }] : []),
  ];

  return (
    <section
      className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(ellipse_at_top,_#e0f2fe_0%,_#ffffff_55%,_#f8fafc_100%)] text-slate-900"
      aria-labelledby="hero-title"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-center">
        {displayYear?.yearNumber && (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-blue-200 text-blue-900 text-sm font-semibold mb-5 shadow-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            ประจำปี {displayYear.yearNumber}
          </span>
        )}

        <h1 id="hero-title" className="font-extrabold leading-tight tracking-tight text-slate-900">
          <span className="block text-3xl sm:text-5xl lg:text-6xl">
            {content.heroTitle || "งานสัปดาห์วิทยาศาสตร์"}
          </span>
          <span className="mt-2 block text-xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-700 via-sky-600 to-blue-800 bg-clip-text text-transparent">
            {content.heroHighlight || "และการแข่งขัน E-Sports (ROV)"}
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          {content.heroDescription ||
            "ขอเชิญชวนนักเรียน นักศึกษา และผู้ที่สนใจเข้าร่วมกิจกรรมทางวิชาการ นิทรรศการ และการแข่งขัน E-Sports เพื่อส่งเสริมทักษะและศักยภาพ"}
        </p>

        {/* Status strip: รวมปี / สถานะ / วันปิด / วันจัดงาน ไว้แถบเดียว */}
        {displayYear && (
          <div
            className={`mt-7 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-2xl border-2 px-5 py-3 text-base ${statusTone}`}
          >
            <span className="inline-flex items-center gap-2 font-bold">
              <span className={`w-2.5 h-2.5 rounded-full ${dotTone}`} />
              {registerStatus.text}
            </span>
            {isOpen && displayYear.registrationCloseDate && (
              <span>
                ปิดรับ <b>{formatThaiDateOnly(displayYear.registrationCloseDate)}</b>
                {daysLeft !== null && daysLeft >= 0 && (
                  <span className={`ml-1 font-semibold ${daysLeft <= 3 ? "text-rose-600" : ""}`}>
                    · {daysLeft === 0 ? "ปิดวันนี้" : `เหลือ ${daysLeft} วัน`}
                  </span>
                )}
              </span>
            )}
            {!isOpen && !isClosed && displayYear.registrationOpenDate && (
              <span>
                เปิดรับ <b>{formatThaiDateOnly(displayYear.registrationOpenDate)}</b>
              </span>
            )}
            {displayYear.dateName && (
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <Clock className="w-4 h-4" />
                จัดงาน {displayYear.dateName}
              </span>
            )}
          </div>
        )}

        {/* นับถอยหลังเฉพาะตอนรอเปิดรับสมัคร */}
        {!isOpen && !isClosed && <RegistrationCountdown targetDate={registerStatus.targetDate} />}

        {/* Actions */}
        <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <button
            onClick={onPrimary}
            disabled={!isOpen && !isClosed}
            className={`inline-flex items-center justify-center gap-2.5 rounded-2xl px-8 py-4 text-lg font-bold shadow-lg transition-all ${
              isOpen
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/25 cursor-pointer"
                : isClosed
                  ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/25 cursor-pointer"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
            }`}
          >
            {isClosed ? <Trophy className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            {isOpen
              ? content.registerButtonLabel || "ลงทะเบียนเข้าร่วมงาน"
              : isClosed
                ? "ดูผลการแข่งขัน"
                : "รอเปิดรับสมัคร"}
            {(isOpen || isClosed) && <ChevronRight className="h-5 w-5" />}
          </button>

          {displayYear?.competitionRegulationsUrl && (
            <a
              target="_blank"
              rel="noreferrer"
              href={displayYear.competitionRegulationsUrl}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-blue-700 transition-colors"
            >
              <BookOpen className="h-5 w-5 text-blue-600" />
              {content.guideButtonLabel || "กฎระเบียบการแข่งขัน"}
            </a>
          )}

          <button
            type="button"
            onClick={onViewApplicantSummary}
            disabled={!displayYear?.yearID}
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Users className="h-5 w-5 text-sky-600" />
            {content.applicantsButtonLabel || "ตรวจสอบจำนวนผู้สมัคร"}
          </button>
        </div>

        {/* Quick links */}
        <nav aria-label="ทางลัด" className="mt-6 flex flex-wrap justify-center gap-2">
          {quickLinks.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm sm:text-base font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              <Icon className="h-4 w-4 text-blue-600" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

function BannerSlider() {
  const { data: banners = [] } = useGetHomeBannersQuery();
  const active = banners.filter((banner) => banner.isActive);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent(0);
  }, [active.length]);

  useEffect(() => {
    if (active.length < 2) return;
    const timer = window.setInterval(
      () => setCurrent((index) => (index + 1) % active.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [active.length]);

  if (!active.length) return null;
  const baseUrl = (import.meta.env.VITE_API_BASE_URLS as string).replace(
    /\/$/,
    "",
  );
  const move = (direction: number) =>
    setCurrent((index) => (index + direction + active.length) % active.length);

  return (
    <section className="bg-slate-100/70 px-4 py-12 sm:px-6 sm:py-16 relative border-b border-slate-200">
      <div className="max-w-7xl mx-auto mb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-2 border border-blue-200">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>ประชาสัมพันธ์ & ไฮไลต์กิจกรรม</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            แบนเนอร์กิจกรรมน่าสนใจ
          </h2>
        </div>
        {active.length > 1 && (
          <p className="text-xs text-slate-500 font-medium">
            สไลด์ที่ {current + 1} จาก {active.length}
          </p>
        )}
      </div>

      <div className="group relative mx-auto max-w-7xl overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-xl">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {active.map((banner) => {
            const source = `${baseUrl}/${banner.imagePath.replace(/^\//, "")}`;
            return (
              <div
                key={banner.id}
                className="relative flex w-full shrink-0 items-center justify-center overflow-hidden bg-white min-h-[220px] sm:min-h-[360px] md:min-h-[460px] lg:min-h-[520px] max-h-[75vh] p-1 sm:p-2"
              >
                <img
                  src={source}
                  alt={`แบนเนอร์ประชาสัมพันธ์ ${banner.sortOrder}`}
                  className="w-full h-full object-contain object-center"
                />
              </div>
            );
          })}
        </div>

        {active.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-200 bg-white text-slate-800 p-3 shadow-lg transition-all hover:bg-blue-600 hover:text-white hover:scale-110 active:scale-95 sm:left-5"
              aria-label="แบนเนอร์ก่อนหน้า"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-200 bg-white text-slate-800 p-3 shadow-lg transition-all hover:bg-blue-600 hover:text-white hover:scale-110 active:scale-95 sm:right-5"
              aria-label="แบนเนอร์ถัดไป"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-white/95 px-4 py-2 border border-slate-200 shadow-md backdrop-blur-md">
              {active.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setCurrent(index)}
                  aria-label={`แสดงแบนเนอร์ ${index + 1}`}
                  className={`h-3 rounded-full transition-all ${
                    index === current
                      ? "w-8 bg-blue-600"
                      : "w-3 bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ==== Event Timeline Section (Light Academic Theme) ====
function TimelineSection() {
  // ใช้ชื่อขั้นตอนตรงกับในระบบ และกดไปหน้านั้นได้
  const steps = [
    {
      num: "1",
      title: "เลือกปีการจัดงาน",
      desc: "เลือกปีที่เปิดรับสมัคร",
      icon: Calendar,
      to: "/yearuser",
    },
    {
      num: "2",
      title: "เลือกกิจกรรม",
      desc: "ดูรายการแข่งขันทั้งหมด รวมถึง E-Sports (ROV)",
      icon: Target,
      to: "/yearuser",
    },
    {
      num: "3",
      title: "เลือกระดับชั้น",
      desc: "ตรวจวันแข่งและจำนวนสมาชิกที่ต้องมี",
      icon: Users,
      to: "/yearuser",
    },
    {
      num: "4",
      title: "ลงทะเบียนทีม",
      desc: "สร้างทีม เพิ่มรายชื่อนักเรียน แล้วมารายงานตัววันแข่ง",
      icon: Medal,
      to: "/yearuser",
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white text-slate-900 border-b border-slate-200">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            ขั้นตอนการลงทะเบียน
          </h2>
          <p className="text-slate-600 mt-2 text-base">
            ทำตามนี้ได้เลย หลังลงทะเบียนแล้วกลับมาแก้ไขรายชื่อได้จนถึงวันปิดรับสมัคร
          </p>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.num}>
                <Link
                  to={step.to}
                  className="group flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:border-blue-300 hover:bg-white hover:shadow-md transition-all"
                >
                  <span className="w-11 h-11 rounded-full bg-blue-600 text-white text-lg font-extrabold flex items-center justify-center shrink-0">
                    {step.num}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-lg font-bold text-slate-900 group-hover:text-blue-700">
                      <Icon className="w-4 h-4 text-blue-600" />
                      {step.title}
                    </span>
                    <span className="mt-1 block text-sm text-slate-600 leading-relaxed">{step.desc}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function HighlightsSection() {
  const items = [
    {
      icon: BookOpen,
      tone: "bg-blue-50 text-blue-600",
      title: "กิจกรรมวิชาการ & นิทรรศการ",
      text: "นิทรรศการวิทยาศาสตร์ เทคโนโลยี และการแข่งขันทางวิชาการหลากหลายรายการ",
    },
    {
      icon: Trophy,
      tone: "bg-indigo-50 text-indigo-600",
      title: "การแข่งขัน E-Sports (ROV)",
      text: "ประลองฝีมือ การทำงานเป็นทีม และการคิดวิเคราะห์",
    },
    {
      icon: Award,
      tone: "bg-amber-50 text-amber-600",
      title: "เกียรติบัตรออนไลน์",
      text: "ผู้ชนะและผู้เข้าร่วมดาวน์โหลดเกียรติบัตรได้จากระบบหลังประกาศผล",
    },
  ];
  return (
    <section className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {items.map(({ icon: Icon, tone, title, text }) => (
          <div key={title} className="flex items-start gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200">
            <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm sm:text-base text-slate-600 leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ==== News Card Component ====
function NewsCard({ item, onOpen }: { item: News; onOpen: (n: News) => void }) {
  const cover = buildImageUrl(item.coverImagePath);
  const summary = stripHtml(item.content || "");

  return (
    <article className="group flex flex-col bg-white rounded-3xl border border-slate-200/90 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex w-full h-full items-center justify-center text-slate-300 bg-slate-50">
            <FileText size={48} />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/95 backdrop-blur-md text-slate-800 text-xs font-semibold rounded-full shadow-sm border border-slate-200">
            <Calendar className="w-3 h-3 text-blue-600" />
            {formatThaiDate(item.datePublished)}
          </span>
        </div>
      </div>
      <div className="flex flex-col flex-grow p-6">
        <h3 className="text-lg font-bold text-slate-900 leading-snug mb-3 line-clamp-2 group-hover:text-blue-700 transition-colors">
          {item.title}
        </h3>
        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
          {summary}
        </p>
        <button
          onClick={() => onOpen(item)}
          className="inline-flex items-center justify-between w-full font-bold text-xs text-blue-700 hover:text-blue-900 transition-colors mt-auto pt-3 border-t border-slate-100"
        >
          <span>อ่านรายละเอียด</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </article>
  );
}

function NewsSection() {
  const { data, isLoading, isError } = useGetAllNewsQuery();
  const navigate = useNavigate();
  const content = useHomeContent();

  const latest = useMemo(() => {
    const list = (data ?? [])
      .slice()
      .sort(
        (a, b) =>
          new Date(b.datePublished).getTime() -
          new Date(a.datePublished).getTime(),
      );
    return list.slice(0, 8);
  }, [data]);

  if (content.showNews === false) return null;

  return (
    <section id="news" className="py-14 sm:py-20 bg-slate-50 relative">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ประกาศล่าสุด</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              {content.newsTitle || "ประกาศและข่าวประชาสัมพันธ์"}
            </h2>
            <p className="text-slate-600 text-base mt-1">
              {content.newsDescription ||
                "ประกาศ ข่าวประชาสัมพันธ์ และข้อมูลที่เกี่ยวข้องกับการจัดกิจกรรมและการแข่งขัน"}
            </p>
          </div>
          <Link
            to="/newsList"
            className="inline-flex items-center gap-1.5 font-bold text-sm text-blue-700 hover:text-blue-900 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition-all"
          >
            <span>{content.newsButtonLabel || "ดูประกาศทั้งหมด"}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading && <Spinner />}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 font-medium mb-1">
              ไม่สามารถแสดงประกาศได้ในขณะนี้
            </p>
            <p className="text-red-600 text-xs">
              โปรดลองใหม่อีกครั้งภายหลัง
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {latest.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
                {latest.map((n) => (
                  <NewsCard
                    key={n.id}
                    item={n}
                    onOpen={() => {
                      navigate(`/news/${n.id}`);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ==== FAQ Section ====
function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "ใครสามารถสมัครเข้าร่วมงานและกิจกรรมการแข่งขันได้บ้าง?",
      a: "นักเรียน นักศึกษา ครู อาจารย์ และบุคคลทั่วไป สามารถเข้าร่วมกิจกรรมได้ตามคุณสมบัติที่ระบุไว้ในแต่ละประเภทรายการแข่งขัน",
    },
    {
      q: "ผู้เข้าร่วมแข่งขันจะได้รับเกียรติบัตรอย่างไร?",
      a: "ผู้ที่มารายงานตัวเข้าร่วมการแข่งขัน ดาวน์โหลดเกียรติบัตรออนไลน์ได้หลังประกาศผล ที่หน้า \"ผลการแข่งขัน\" หรือ \"ประวัติการลงทะเบียน\"",
    },
    {
      q: "หากต้องการแก้ไขข้อมูลทีมหรือรายชื่อนักเรียน ทำได้อย่างไร?",
      a: "เข้าสู่ระบบด้วยบัญชีที่ใช้ลงทะเบียน แล้วไปที่ \"ประวัติการลงทะเบียน\" กด \"จัดการสมาชิก\" แก้ไขได้จนถึงวันปิดรับสมัคร",
    },
    {
      q: "สถานะทีมจะเปลี่ยนเป็น \"ลงทะเบียนเข้างาน\" เมื่อไร?",
      a: "เมื่อมารายงานตัวที่จุดลงทะเบียนในวันแข่งขัน ก่อนหน้านั้นสถานะจะเป็น \"สมัครสำเร็จ\"",
    },
  ];

  return (
    <section className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3 border border-slate-200">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>คำถามที่พบบ่อย (FAQ)</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            ข้อสงสัยที่พบบ่อยเกี่ยวกับการสมัคร
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-blue-700 transition-colors"
                >
                  <span className="text-base sm:text-lg">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-slate-400 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-blue-700" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-200/80 pt-3 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ==== Quick Action Floating Bar ====
function QuickActionBar() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // แสดงเฉพาะปุ่ม "ขึ้นด้านบน" หลังเลื่อนลงไปแล้ว ไม่ลอยบังเนื้อหาตลอดเวลา
  if (!showScrollTop) return null;
  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-5 right-5 z-40 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-lg transition-colors cursor-pointer"
      title="ขึ้นด้านบน"
      aria-label="ขึ้นด้านบน"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

// ==== Main HomePage Component ====
export default function HomePage() {
  const { data: settings } = useGetSystemSettingsQuery();
  useDocumentTitle(
    settings?.projectName ?? (settings as any)?.ProjectName ?? "สัปดาห์วิทยาศาสตร์และการแข่งขัน ROV",
  );
  return (
    <div className="min-h-screen font-sans text-slate-900 bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      <HeroSection />
      <BannerSlider />
      <TimelineSection />
      <HighlightsSection />
      <NewsSection />
      <FaqSection />
      <QuickActionBar />
    </div>
  );
}
