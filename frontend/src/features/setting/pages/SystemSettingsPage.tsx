import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  FileText,
  Save,
  Trash2,
  Upload,
  Shield,
  Eye,
  Settings2,
  Globe,
  Menu as MenuIcon,
  Home,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useDeleteAdminManualMutation,
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useUploadAdminManualMutation,
  useUploadUserManualMutation,
  useDeleteUserManualMutation,
} from "../systemSettingsApi";
import { withAdminAuth } from "../../../HOC";
import { adminManualUrl } from "../../../components/AdminManualButton";
import { showError, showSuccessOk } from "../../../utils/confirmDelete";
import { useGetAllYearQuery } from "../../Year/YearApi";

const themeGradients: Record<string, string> = {
  emerald: "from-emerald-600 via-teal-600 to-cyan-700",
  blue: "from-blue-600 via-indigo-600 to-violet-700",
  purple: "from-purple-600 via-fuchsia-600 to-pink-700",
  ruby: "from-rose-600 via-red-600 to-orange-700",
  slate: "from-slate-700 via-slate-800 to-slate-900",
};

// แท็บของหน้าตั้งค่า — sharedSave: ใช้ปุ่มบันทึกรวมด้านล่าง, preview: แสดงตัวอย่างแถบเมนูด้านขวา
const TABS = [
  { id: "general", label: "ทั่วไป", icon: Globe, sharedSave: true, preview: true },
  { id: "menu", label: "เมนู", icon: MenuIcon, sharedSave: true, preview: true },
  { id: "home", label: "หน้าแรก", icon: Home, sharedSave: true, preview: false },
  { id: "manual", label: "คู่มือ", icon: BookOpen, sharedSave: false, preview: false },
] as const;
type TabId = (typeof TABS)[number]["id"];

const SystemSettingsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "general";
  const tab = TABS.find((t) => t.id === activeTab)!;
  const selectTab = (id: TabId) => setSearchParams({ tab: id }, { replace: true });
  const { data: settings, isLoading } = useGetSystemSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] =
    useUpdateSystemSettingsMutation();
  const { data: years = [] } = useGetAllYearQuery();

  const [projectName, setProjectName] = useState("");
  const [projectSubtitle, setProjectSubtitle] = useState("");
  const [showNavbar, setShowNavbar] = useState(true);
  const [theme, setTheme] = useState("emerald");
  const [showTrainingMenu, setShowTrainingMenu] = useState(true);
  const [showNewsMenu, setShowNewsMenu] = useState(true);
  const [showResultsMenu, setShowResultsMenu] = useState(true);
  const [showActivityMenu, setShowActivityMenu] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [home, setHome] = useState({ heroTitle: "", heroHighlight: "", heroDescription: "", registerButtonLabel: "", guideButtonLabel: "", applicantsButtonLabel: "", showNews: true, newsTitle: "", newsDescription: "", newsButtonLabel: "" });
  const [homeDisplayYearId, setHomeDisplayYearId] = useState<number | "">("");
  const [loaded, setLoaded] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const snapshot = JSON.stringify({ projectName, projectSubtitle, showNavbar, theme, showTrainingMenu, showNewsMenu, showResultsMenu, showActivityMenu, home, homeDisplayYearId });

  // จำค่าที่โหลดมาครั้งแรก ไว้เทียบว่ามีการแก้ไขที่ยังไม่บันทึกหรือไม่
  useEffect(() => {
    if (loaded && savedSnapshot === null) setSavedSnapshot(snapshot);
  }, [loaded, savedSnapshot, snapshot]);

  // เตือนก่อนปิด/รีเฟรชหน้า ถ้ายังมีการแก้ไขที่ไม่ได้บันทึก
  const hasUnsaved = savedSnapshot !== null && (snapshot !== savedSnapshot || logoFile !== null);
  useEffect(() => {
    if (!hasUnsaved) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsaved]);

  useEffect(() => {
    if (settings && !loaded) {
      setProjectName(
        settings.projectName ?? (settings as any).ProjectName ?? "",
      );
      setProjectSubtitle(
        settings.projectSubtitle ?? (settings as any).ProjectSubtitle ?? "",
      );
      setShowNavbar(
        settings.showNavbar ?? (settings as any).ShowNavbar ?? true,
      );
      setShowTrainingMenu(
        settings.showTrainingMenu ?? (settings as any).ShowTrainingMenu ?? true,
      );
      setShowNewsMenu(
        settings.showNewsMenu ?? (settings as any).ShowNewsMenu ?? true,
      );
      setShowResultsMenu(
        settings.showResultsMenu ?? (settings as any).ShowResultsMenu ?? true,
      );
      setShowActivityMenu(
        settings.showActivityMenu ?? (settings as any).ShowActivityMenu ?? true,
      );
      const activeTheme = settings.theme ?? (settings as any).Theme;
      if (activeTheme) {
        setTheme(activeTheme);
      }
      const activeLogoPath = settings.logoPath ?? (settings as any).LogoPath;
      const value = settings as any;
      setHome({ heroTitle: settings.homeHeroTitle ?? value.HomeHeroTitle ?? "", heroHighlight: settings.homeHeroHighlight ?? value.HomeHeroHighlight ?? "", heroDescription: settings.homeHeroDescription ?? value.HomeHeroDescription ?? "", registerButtonLabel: settings.homeRegisterButtonLabel ?? value.HomeRegisterButtonLabel ?? "", guideButtonLabel: settings.homeGuideButtonLabel ?? value.HomeGuideButtonLabel ?? "", applicantsButtonLabel: settings.homeApplicantsButtonLabel ?? value.HomeApplicantsButtonLabel ?? "", showNews: settings.showHomeNews ?? value.ShowHomeNews ?? true, newsTitle: settings.homeNewsTitle ?? value.HomeNewsTitle ?? "", newsDescription: settings.homeNewsDescription ?? value.HomeNewsDescription ?? "", newsButtonLabel: settings.homeNewsButtonLabel ?? value.HomeNewsButtonLabel ?? "" });
      setHomeDisplayYearId(settings.homeDisplayYearId ?? value.HomeDisplayYearId ?? "");
      setLoaded(true);
      if (activeLogoPath) {
        setLogoPreview(
          `${import.meta.env.VITE_API_BASE_URLS}/${activeLogoPath}`,
        );
      }
    }
  }, [settings, loaded]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("ProjectName", projectName);
      formData.append("ProjectSubtitle", projectSubtitle);
      formData.append("ShowNavbar", String(showNavbar));
      formData.append("Theme", theme);
      formData.append("ShowTrainingMenu", String(showTrainingMenu));
      formData.append("ShowNewsMenu", String(showNewsMenu));
      formData.append("ShowResultsMenu", String(showResultsMenu));
      formData.append("ShowActivityMenu", String(showActivityMenu));
      formData.append("HomeHeroTitle", home.heroTitle);
      formData.append("HomeHeroHighlight", home.heroHighlight);
      formData.append("HomeHeroDescription", home.heroDescription);
      formData.append("HomeRegisterButtonLabel", home.registerButtonLabel);
      formData.append("HomeGuideButtonLabel", home.guideButtonLabel);
      formData.append("HomeApplicantsButtonLabel", home.applicantsButtonLabel);
      formData.append("ShowHomeNews", String(home.showNews));
      formData.append("HomeNewsTitle", home.newsTitle);
      formData.append("HomeNewsDescription", home.newsDescription);
      formData.append("HomeNewsButtonLabel", home.newsButtonLabel);
      if (homeDisplayYearId) formData.append("HomeDisplayYearId", String(homeDisplayYearId));
      if (logoFile) {
        formData.append("Logo", logoFile);
      }

      await updateSettings(formData).unwrap();
      setSavedSnapshot(snapshot);
      setLogoFile(null);
      showSuccessOk("บันทึกการตั้งค่าระบบเรียบร้อยแล้ว");
    } catch (err: any) {
      showError(
        err?.data?.errorMessages?.[0] || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-slate-500">กำลังโหลดการตั้งค่า...</p>
        </div>
      </div>
    );
  }

  const isDirty = hasUnsaved;
  // จุดสีส้มบนแท็บที่มีการแก้ค้างอยู่
  const saved = savedSnapshot ? JSON.parse(savedSnapshot) : null;
  const changed = (...keys: string[]) =>
    !!saved && keys.some((k) => JSON.stringify(saved[k]) !== JSON.stringify(JSON.parse(snapshot)[k]));
  const tabDirty: Record<TabId, boolean> = {
    general: changed("projectName", "projectSubtitle", "theme") || logoFile !== null,
    menu: changed("showNavbar", "showTrainingMenu", "showNewsMenu", "showResultsMenu", "showActivityMenu"),
    home: changed("home", "homeDisplayYearId"),
    manual: false,
  };
  const confirmLeave = () =>
    !isDirty || window.confirm("มีการแก้ไขที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?");
  const setHomeField = (key: keyof typeof home, value: string | boolean) =>
    setHome((old) => ({ ...old, [key]: value }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <form onSubmit={handleSave} className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 ring-1 ring-emerald-500/20">
              <Settings2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ตั้งค่าระบบ</h1>
              <p className="text-sm text-slate-500">
                ชื่อเว็บไซต์ โลโก้ สีธีม เมนูด้านบน และข้อความบนหน้าแรก
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => confirmLeave() && navigate(-1)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            ย้อนกลับ
          </button>
        </div>

        {/* ===== Tabs ===== */}
        <div role="tablist" aria-label="หมวดการตั้งค่า" className="mb-6 -mx-4 sm:mx-0 overflow-x-auto [scrollbar-width:none]">
          <div className="flex min-w-max gap-1 border-b border-slate-200 px-4 sm:px-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(t.id)}
                  className={`relative -mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-base font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  {tabDirty[t.id] && (
                    <span className="h-2 w-2 rounded-full bg-amber-500" title="มีการแก้ไขที่ยังไม่ได้บันทึก" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`grid gap-6 ${tab.preview ? "xl:grid-cols-[1fr_420px]" : ""}`}>
          {/* ===== Left: settings ===== */}
          <div className="space-y-6 min-w-0">
            {activeTab === "general" && (<>
            <Section title="ข้อมูลเว็บไซต์" desc="แสดงที่แถบเมนูด้านบนและท้ายเว็บของทุกหน้า">
              <div className="grid gap-5 md:grid-cols-[1fr_200px]">
                <div className="space-y-4">
                  <Field label="ชื่อเว็บไซต์" required>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="เช่น คณะวิทยาศาสตร์และเทคโนโลยี"
                    />
                  </Field>
                  <Field label="ข้อความใต้ชื่อ">
                    <input
                      type="text"
                      value={projectSubtitle}
                      onChange={(e) => setProjectSubtitle(e.target.value)}
                      className={inputClass}
                      placeholder="เช่น มหาวิทยาลัยราชภัฏกาญจนบุรี"
                    />
                  </Field>
                </div>
                <div>
                  <span className={labelClass}>โลโก้</span>
                  <label className="group flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 transition hover:border-emerald-400 hover:bg-emerald-50/40">
                    {logoPreview ? (
                      <img src={logoPreview} alt="โลโก้" className="h-24 w-24 object-contain" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center text-sm text-slate-400">
                        ยังไม่มีโลโก้
                      </div>
                    )}
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                      <Upload className="h-4 w-4" />
                      {logoPreview ? "เปลี่ยนรูป" : "เลือกรูป"}
                    </span>
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                  <p className="mt-1.5 text-center text-xs text-slate-400">
                    PNG, JPG, WEBP, SVG ไม่เกิน 2MB
                  </p>
                </div>
              </div>
            </Section>

            <Section title="สีธีม" desc="สีของแถบเมนูด้านบน ดูผลได้ที่ตัวอย่างทันที">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {THEMES.map((t) => {
                  const selected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      aria-pressed={selected}
                      className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                        selected
                          ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className={`h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br ${t.bg}`} />
                      <span className="text-sm font-semibold text-slate-700">{t.name}</span>
                      {selected && (
                        <Check className="absolute right-2 top-2 h-4 w-4 text-emerald-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </Section>
            </>)}

            {activeTab === "menu" && (
            <Section title="เมนูบนแถบด้านบน" desc="เปิดเฉพาะเมนูที่ต้องการให้บุคคลทั่วไปเห็น (ท้ายเว็บจะซ่อนลิงก์ตามด้วย)">
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                <ToggleRow
                  label="แสดงแถบเมนูด้านบน"
                  desc="ถ้าปิด จะไม่มีแถบเมนูในหน้าสาธารณะ"
                  checked={showNavbar}
                  onChange={setShowNavbar}
                />
                <ToggleRow
                  label="เมนู “ลงทะเบียนกิจกรรม”"
                  desc="ทางเข้าระบบสมัครแข่งขันของโรงเรียน"
                  checked={showActivityMenu}
                  onChange={setShowActivityMenu}
                  disabled={!showNavbar}
                />
                <ToggleRow
                  label="เมนู “ลงทะเบียนอบรม”"
                  desc="โครงการอบรมสำหรับบุคคลทั่วไป"
                  checked={showTrainingMenu}
                  onChange={setShowTrainingMenu}
                  disabled={!showNavbar}
                />
                <ToggleRow
                  label="เมนู “ข่าวสาร”"
                  desc="ข่าวประชาสัมพันธ์"
                  checked={showNewsMenu}
                  onChange={setShowNewsMenu}
                  disabled={!showNavbar}
                />
                <ToggleRow
                  label="เมนู “ผลการแข่งขัน”"
                  desc="สรุปผลการประกวดแข่งขัน"
                  checked={showResultsMenu}
                  onChange={setShowResultsMenu}
                  disabled={!showNavbar}
                />
              </div>
            </Section>
            )}

            {activeTab === "home" && (
            <Section title="ข้อความบนหน้าแรก" desc="ปล่อยว่างไว้ได้ ระบบจะใช้ข้อความเริ่มต้น">
              <a
                href={import.meta.env.BASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                เปิดดูหน้าแรก (แท็บใหม่) — ต้องบันทึกก่อนจึงจะเห็นข้อความใหม่
              </a>
              <div className="space-y-6">
                <Field label="ปีการจัดงานที่แสดงบนหน้าแรก">
                  <select
                    value={homeDisplayYearId}
                    onChange={(e) => setHomeDisplayYearId(e.target.value ? Number(e.target.value) : "")}
                    className={inputClass}
                  >
                    <option value="">ใช้ปีที่เปิดใช้งานอยู่</option>
                    {years.map((year) => (
                      <option key={year.yearID} value={year.yearID}>
                        {year.yearNumber} {year.yearName ? `- ${year.yearName}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <SubGroup title="ส่วนหัวหน้าแรก">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="หัวข้อหลัก">
                      <input value={home.heroTitle} onChange={(e) => setHomeField("heroTitle", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="หัวข้อเน้น (ตัวสี)">
                      <input value={home.heroHighlight} onChange={(e) => setHomeField("heroHighlight", e.target.value)} className={inputClass} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="คำอธิบาย">
                        <textarea rows={3} value={home.heroDescription} onChange={(e) => setHomeField("heroDescription", e.target.value)} className={inputClass} />
                      </Field>
                    </div>
                  </div>
                </SubGroup>

                <SubGroup title="ข้อความบนปุ่ม">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="ปุ่มสมัคร">
                      <input value={home.registerButtonLabel} onChange={(e) => setHomeField("registerButtonLabel", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="ปุ่มขั้นตอนการสมัคร">
                      <input value={home.guideButtonLabel} onChange={(e) => setHomeField("guideButtonLabel", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="ปุ่มจำนวนผู้สมัคร">
                      <input value={home.applicantsButtonLabel} onChange={(e) => setHomeField("applicantsButtonLabel", e.target.value)} className={inputClass} />
                    </Field>
                  </div>
                </SubGroup>

                <SubGroup title="ส่วนข่าวสาร">
                  <div className="mb-4 rounded-xl border border-slate-200">
                    <ToggleRow
                      label="แสดงส่วนข่าวสารบนหน้าแรก"
                      checked={home.showNews}
                      onChange={(v) => setHomeField("showNews", v)}
                    />
                  </div>
                  <fieldset disabled={!home.showNews} className={`grid gap-4 md:grid-cols-2 ${home.showNews ? "" : "opacity-50"}`}>
                    <Field label="หัวข้อข่าว">
                      <input value={home.newsTitle} onChange={(e) => setHomeField("newsTitle", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="ข้อความปุ่มดูข่าว">
                      <input value={home.newsButtonLabel} onChange={(e) => setHomeField("newsButtonLabel", e.target.value)} className={inputClass} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="คำอธิบายข่าว">
                        <textarea rows={2} value={home.newsDescription} onChange={(e) => setHomeField("newsDescription", e.target.value)} className={inputClass} />
                      </Field>
                    </div>
                  </fieldset>
                </SubGroup>
              </div>
            </Section>
            )}

            {activeTab === "manual" && (<>
            <Section title="คู่มือผู้ใช้" desc="สำหรับครูและนักเรียน แสดงบนแถบเมนูด้านบน ท้ายเว็บ และหน้าเลือกปีลงทะเบียน · ทุกคนเปิดอ่านได้ · อัปโหลดแล้วบันทึกทันที">
              <ManualUploader kind="user" />
            </Section>
            <Section title="คู่มือแอดมิน" desc="แสดงเป็นปุ่ม “คู่มือการใช้งาน” บนแถบด้านบนของแอดมินและเจ้าหน้าที่ · อัปโหลดแล้วบันทึกทันที">
              <ManualUploader kind="admin" />
            </Section>
            </>)}

          </div>

          {/* ===== Right: live preview (sticky) ===== */}
          {tab.preview && (
          <aside className="xl:sticky xl:top-6 self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Eye className="h-4 w-4 text-emerald-600" />
                ตัวอย่างแถบเมนูด้านบน
              </div>
              {showNavbar ? (
                <div className={`rounded-xl bg-gradient-to-r ${themeGradients[theme] || themeGradients.emerald} p-3 shadow transition-all duration-300`}>
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg bg-white/20 object-contain p-1" />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 text-[10px] font-bold text-white">
                        LOGO
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{projectName || "ชื่อเว็บไซต์"}</p>
                      <p className="truncate text-xs text-white/80">{projectSubtitle || "ข้อความใต้ชื่อ"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[
                      showActivityMenu && "ลงทะเบียนกิจกรรม",
                      showTrainingMenu && "ลงทะเบียนอบรม",
                      showNewsMenu && "ข่าวสาร",
                      showResultsMenu && "ผลการแข่งขัน",
                    ]
                      .filter(Boolean)
                      .map((m) => (
                        <span key={m as string} className="rounded-md bg-white/15 px-2 py-1 text-xs text-white">
                          {m}
                        </span>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                  ปิดแถบเมนูด้านบนอยู่
                </div>
              )}
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <Shield className="h-3.5 w-3.5" />
                เปลี่ยนแล้วต้องกด “บันทึก” ด้านล่างจึงจะมีผลบนเว็บจริง
              </p>
            </div>
          </aside>
          )}
        </div>

        {/* ===== Sticky save bar (เฉพาะแท็บที่ใช้ปุ่มบันทึกรวม) ===== */}
        {tab.sharedSave && (
        <div className="sticky bottom-0 z-20 mt-6 rounded-2xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur">
          <div className="flex flex-wrap items-center justify-end gap-3 px-4 py-3">
            <span className={`text-sm ${isDirty ? "font-semibold text-amber-600" : "text-slate-400"}`}>
              {isDirty
                ? `มีการแก้ไขที่ยังไม่ได้บันทึก (${TABS.filter((t) => tabDirty[t.id]).map((t) => t.label).join(", ")})`
                : "บันทึกล่าสุดแล้ว"}
            </span>
            <button
              type="submit"
              disabled={isUpdating || !isDirty}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Save className="h-4 w-4" />
              {isUpdating ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
        )}
      </form>
    </div>
  );
};

// อัปโหลดแล้วบันทึกทันที แยกจากปุ่ม "บันทึก" ของฟอร์มหลัก
// ตัวอัปโหลดคู่มือ PDF ใช้ร่วมกันทั้งคู่มือแอดมินและคู่มือผู้ใช้
const ManualUploader = ({ kind }: { kind: "admin" | "user" }) => {
  const { data } = useGetSystemSettingsQuery();
  const adminUpload = useUploadAdminManualMutation();
  const adminRemove = useDeleteAdminManualMutation();
  const userUpload = useUploadUserManualMutation();
  const userRemove = useDeleteUserManualMutation();
  const [upload, { isLoading: uploading }] = kind === "admin" ? adminUpload : userUpload;
  const [remove, { isLoading: removing }] = kind === "admin" ? adminRemove : userRemove;
  const settings =
    kind === "admin"
      ? { path: data?.adminManualPath, fileName: data?.adminManualFileName, updatedAt: data?.adminManualUpdatedAt }
      : { path: data?.userManualPath, fileName: data?.userManualFileName, updatedAt: data?.userManualUpdatedAt };
  const exists = !!settings.path;
  const removeWarning =
    kind === "admin"
      ? "ต้องการลบไฟล์คู่มือแอดมินใช่หรือไม่? ปุ่มคู่มือบนแถบด้านบนของแอดมินจะหายไป"
      : "ต้องการลบไฟล์คู่มือผู้ใช้ใช่หรือไม่? ลิงก์คู่มือบนเว็บไซต์จะหายไป";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) return showError("กรุณาเลือกไฟล์ PDF");
    if (file.size > 20 * 1024 * 1024) return showError("ไฟล์ต้องมีขนาดไม่เกิน 20MB");
    try {
      await upload(file).unwrap();
      showSuccessOk("อัปโหลดคู่มือเรียบร้อยแล้ว");
    } catch (err: any) {
      showError(typeof err?.data === "string" ? err.data : "อัปโหลดคู่มือไม่สำเร็จ");
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(removeWarning)) return;
    try {
      await remove().unwrap();
    } catch {
      showError("ลบคู่มือไม่สำเร็จ");
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${exists ? "bg-rose-100 text-rose-600" : "bg-slate-200 text-slate-400"}`}>
          <FileText className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          {exists ? (
            <>
              <p className="truncate font-semibold text-slate-800" title={settings.fileName ?? undefined}>{settings.fileName || "คู่มือการใช้งาน.pdf"}</p>
              <p className="text-sm text-slate-500">
                {settings.updatedAt && `อัปเดต ${new Date(settings.updatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}`}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-slate-700">ยังไม่มีไฟล์คู่มือ</p>
              <p className="text-sm text-slate-500">PDF ขนาดไม่เกิน 20MB</p>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {exists && (
          <>
            <a
              href={adminManualUrl(settings.path!)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Eye className="h-4 w-4" /> เปิดดู
            </a>
            <button type="button" onClick={handleRemove} disabled={removing} className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 cursor-pointer">
              <Trash2 className="h-4 w-4" /> ลบ
            </button>
          </>
        )}
        <label className={`flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 ${uploading ? "pointer-events-none opacity-60" : "cursor-pointer"}`}>
          <Upload className="h-4 w-4" />
          {uploading ? "กำลังอัปโหลด..." : exists ? "เปลี่ยนไฟล์" : "อัปโหลด PDF"}
          <input type="file" accept="application/pdf,.pdf" onChange={handleFile} className="hidden" />
        </label>
      </div>
    </div>
  );
};

// ===== UI helpers =====
const THEMES = [
  { id: "emerald", name: "เขียว", bg: "from-emerald-500 to-teal-600" },
  { id: "blue", name: "น้ำเงิน", bg: "from-blue-500 to-indigo-600" },
  { id: "purple", name: "ม่วง", bg: "from-purple-500 to-fuchsia-600" },
  { id: "ruby", name: "แดง", bg: "from-rose-500 to-red-600" },
  { id: "slate", name: "เทาเข้ม", bg: "from-slate-600 to-slate-800" },
];

const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50";

const Section = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {desc && <p className="text-sm text-slate-500">{desc}</p>}
      </div>
    </div>
    {children}
  </section>
);

const SubGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="mb-3 border-b border-slate-100 pb-2 text-base font-semibold text-slate-800">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <label className="block">
    <span className={labelClass}>
      {label}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </span>
    {children}
  </label>
);

const ToggleRow = ({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <label className={`flex items-center justify-between gap-4 px-4 py-3 ${disabled ? "opacity-50" : "cursor-pointer hover:bg-slate-50"}`}>
    <div className="min-w-0">
      <p className="text-[15px] font-semibold text-slate-800">{label}</p>
      {desc && <p className="text-sm text-slate-500">{desc}</p>}
    </div>
    <span className="flex flex-shrink-0 items-center gap-2">
      <span className={`text-sm font-medium ${checked ? "text-emerald-700" : "text-slate-400"}`}>
        {checked ? "เปิด" : "ปิด"}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="relative h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-500/20 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-5" />
    </span>
  </label>
);

export default withAdminAuth(SystemSettingsPage);
