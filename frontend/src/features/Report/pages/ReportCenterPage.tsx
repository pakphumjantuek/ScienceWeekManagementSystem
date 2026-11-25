import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Check,
  Eye,
  CalendarDays,
  FileDown,
  FileSpreadsheet,
  FileText,
  Layers,
  ListChecks,
  Loader2,
  Trophy,
  Users,
} from "lucide-react";
import { useGetAllYearQuery } from "../../Year/YearApi";
import { useGetAllCompetitionYearQuery } from "../../CompetitionYear/CompetitionYearApi";
import { useGetAllCompetitionLevelQuery } from "../../CompetitionLevel/CompetitionLevelApi";
import {
  fetchExportBlob,
  handleDownloadCertificateStatusCsv,
  handleDownloadWinnersByYearWord,
  handleDownloadWinnersWord,
  handleDownloadWord,
  handleDownloadWordCompetitionLevels,
  handleDownloadWordCompetitionYear,
  handleDownloadWordCompetitionYearsSummary,
} from "../../../Apis/Export";
import PdfPreviewModal from "../../../components/PdfPreviewModal";

type Scope = "year" | "competition" | "level";

type ReportDef = {
  key: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  // PDF: path ของ API สำหรับเปิดดูตัวอย่าง/พิมพ์ในหน้าเว็บ
  pdf?: string;
  // Word: ฟังก์ชันดาวน์โหลด
  word?: () => Promise<void>;
  // Excel (CSV): ฟังก์ชันดาวน์โหลด
  excel?: () => Promise<void>;
};

const SCOPES: { key: Scope; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "year", label: "ทั้งปี", hint: "รวมทุกกิจกรรมในปีนั้น", icon: CalendarDays },
  { key: "competition", label: "รายกิจกรรม", hint: "เลือก 1 กิจกรรม", icon: Layers },
  { key: "level", label: "รายระดับชั้น", hint: "เลือกกิจกรรมและระดับชั้น", icon: ListChecks },
];

const STORAGE_KEY = "reportCenter.yearId";
const readSavedYear = () => {
  try {
    const v = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
};

const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400";

const StepLabel = ({ no, children }: { no: number; children: React.ReactNode }) => (
  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{no}</span>
    {children}
  </p>
);

// ช่องเลือกที่ต้องเลือก: ป้าย * และคำเตือนสีส้มจนกว่าจะเลือก
const RequiredSelect = ({
  label,
  missing,
  hint,
  children,
}: {
  label: string;
  missing: boolean;
  hint: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-700">
      {label}
      <span className="text-rose-500">*</span>
      {!missing && <Check className="ml-1 h-4 w-4 text-emerald-600" />}
    </span>
    {children}
    {missing && (
      <span className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-amber-700">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        {hint}
      </span>
    )}
  </label>
);

export default function ReportCenterPage() {
  const { data: years = [], isLoading: yearsLoading } = useGetAllYearQuery();
  const [yearId, setYearId] = useState<number | null>(readSavedYear);
  const [scope, setScope] = useState<Scope>("year");
  const [competitionYearId, setCompetitionYearId] = useState<number | null>(null);
  const [levelId, setLevelId] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ title: string; path: string } | null>(null);

  // ปีเริ่มต้น: ปีที่เคยเลือกไว้ ถ้าไม่มี/ถูกลบไปแล้ว ใช้ปีล่าสุด
  useEffect(() => {
    if (years.length === 0) return;
    if (yearId && years.some((y) => y.yearID === yearId)) return;
    const latest = [...years].sort((a, b) => (b.yearNumber ?? 0) - (a.yearNumber ?? 0))[0];
    if (latest?.yearID) setYearId(latest.yearID);
  }, [years, yearId]);

  useEffect(() => {
    try {
      if (yearId) localStorage.setItem(STORAGE_KEY, String(yearId));
    } catch {
      // ไม่จำก็ไม่เป็นไร
    }
    setCompetitionYearId(null);
    setLevelId(null);
  }, [yearId]);

  useEffect(() => setLevelId(null), [competitionYearId]);

  const { data: competitions = [], isFetching: compLoading } = useGetAllCompetitionYearQuery(yearId ?? 0, {
    skip: !yearId || scope === "year",
  });
  const { data: levels = [], isFetching: levelLoading } = useGetAllCompetitionLevelQuery(competitionYearId ?? 0, {
    skip: !competitionYearId || scope === "year",
  });

  const year = years.find((y) => y.yearID === yearId);
  const competition = competitions.find((c) => c.competitionYearID === competitionYearId);
  const level = levels.find((l) => l.competitionLevelID === levelId);

  const ready =
    !!yearId && (scope === "year" || (scope === "competition" && !!competitionYearId) || (scope === "level" && !!levelId));

  const reports: ReportDef[] = useMemo(() => {
    if (!yearId) return [];
    if (scope === "year")
      return [
        {
          key: "year-summary",
          title: "สรุปภาพรวมทุกกิจกรรม",
          desc: "จำนวนทีม นักเรียน และโรงเรียน แยกตามกิจกรรมและระดับชั้น",
          icon: BarChart3,
          tone: "bg-blue-100 text-blue-600",
          pdf: `reportpdfCompetitionYearsSummary/${yearId}`,
          word: () => handleDownloadWordCompetitionYearsSummary(yearId),
        },
        {
          key: "year-attendance",
          title: "ผู้สมัครและผู้เข้างาน",
          desc: "เทียบจำนวนผู้สมัครกับผู้ลงทะเบียนเข้างาน รายกิจกรรมและระดับชั้น",
          icon: Users,
          tone: "bg-emerald-100 text-emerald-600",
          pdf: `reportpdfCompetitionAttendance/${yearId}`,
        },
        {
          key: "year-winners",
          title: "แบบฟอร์มผู้ชนะทั้งปี",
          desc: "รายชื่อทีมที่ได้รับรางวัลทุกกิจกรรม สำหรับประกาศผล",
          icon: Trophy,
          tone: "bg-amber-100 text-amber-600",
          word: () => handleDownloadWinnersByYearWord(yearId),
        },
        {
          key: "year-cert-status",
          title: "รายการเลขเกียรติบัตร",
          desc: "ทีมที่ได้เลขเกียรติบัตรแล้ว เรียงตามเลข",
          icon: ListChecks,
          tone: "bg-teal-100 text-teal-600",
          excel: () => handleDownloadCertificateStatusCsv(yearId),
        },
      ];
    if (scope === "competition" && competitionYearId)
      return [
        {
          key: "comp-teams",
          title: "รายชื่อทีมของกิจกรรม",
          desc: "ทุกระดับชั้นของกิจกรรมนี้ในไฟล์เดียว",
          icon: FileText,
          tone: "bg-blue-100 text-blue-600",
          word: () => handleDownloadWordCompetitionYear(competitionYearId),
        },
        {
          key: "comp-levels",
          title: "รายชื่อทีม แยกหน้าตามระดับชั้น",
          desc: `รวม ${levels.length} ระดับชั้น ขึ้นหน้าใหม่ทุกระดับ`,
          icon: Layers,
          tone: "bg-violet-100 text-violet-600",
          word:
            levels.length > 0
              ? () => handleDownloadWordCompetitionLevels(levels.map((l) => l.competitionLevelID!).filter(Boolean))
              : undefined,
        },
      ];
    if (scope === "level" && levelId)
      return [
        {
          key: "level-teams",
          title: "รายชื่อทีม",
          desc: "ทีม โรงเรียน นักเรียน และครูที่ปรึกษา ของระดับชั้นนี้",
          icon: FileText,
          tone: "bg-blue-100 text-blue-600",
          pdf: `reportpdfTeam/${levelId}`,
          word: () => handleDownloadWord(levelId),
        },
        {
          key: "level-winners",
          title: "แบบฟอร์มผู้ชนะ",
          desc: "ทีมที่ได้รับรางวัลของระดับชั้นนี้",
          icon: Trophy,
          tone: "bg-amber-100 text-amber-600",
          word: () => handleDownloadWinnersWord(levelId),
        },
      ];
    return [];
  }, [scope, yearId, competitionYearId, levelId, levels]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const scopeText =
    scope === "year"
      ? `ปี ${year?.yearNumber ?? ""}`
      : scope === "competition"
        ? competition?.competitionName ?? ""
        : `${competition?.competitionName ?? ""} · ${level?.levelName ?? ""}`;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <FileDown className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ศูนย์รายงาน</h1>
          <p className="text-sm text-slate-500">เลือกปี ขอบเขต แล้วกดดาวน์โหลดรายงานที่ต้องการ</p>
        </div>
      </div>

      <div className="space-y-5 2xl:grid 2xl:grid-cols-[400px_1fr] 2xl:items-start 2xl:gap-6 2xl:space-y-0">
      {/* Steps */}
      <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[220px_1fr] 2xl:sticky 2xl:top-6 2xl:grid-cols-1">
        <div>
          <StepLabel no={1}>เลือกปี</StepLabel>
          <select
            value={yearId ?? ""}
            onChange={(e) => setYearId(Number(e.target.value) || null)}
            disabled={yearsLoading}
            className={selectClass}
          >
            {years.map((y) => (
              <option key={y.yearID} value={y.yearID}>
                ปี {y.yearNumber} {y.yearName && y.yearName !== String(y.yearNumber) ? `· ${y.yearName}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <StepLabel no={2}>เลือกขอบเขต</StepLabel>
          <div className="grid gap-2 sm:grid-cols-3 2xl:grid-cols-1" role="radiogroup" aria-label="ขอบเขตรายงาน">
            {SCOPES.map((s) => {
              const active = scope === s.key;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setScope(s.key)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition cursor-pointer ${
                    active ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`} />
                  <span>
                    <span className={`block font-semibold ${active ? "text-blue-800" : "text-slate-800"}`}>{s.label}</span>
                    <span className="block text-sm text-slate-500">{s.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {scope !== "year" && (
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
              <RequiredSelect
                label="เลือกกิจกรรม"
                missing={!competitionYearId}
                hint={compLoading ? "กำลังโหลดกิจกรรม..." : competitions.length ? "ต้องเลือกกิจกรรมก่อน จึงจะดาวน์โหลดรายงานได้" : "ปีนี้ยังไม่มีกิจกรรม"}
              >
                <select
                  value={competitionYearId ?? ""}
                  onChange={(e) => setCompetitionYearId(Number(e.target.value) || null)}
                  disabled={compLoading || competitions.length === 0}
                  className={`${selectClass} ${!competitionYearId ? "border-amber-400 bg-amber-50/40" : ""}`}
                  aria-label="กิจกรรม"
                  aria-required="true"
                >
                  <option value="">{compLoading ? "กำลังโหลด..." : "— กรุณาเลือกกิจกรรม —"}</option>
                  {competitions.map((c) => (
                    <option key={c.competitionYearID} value={c.competitionYearID}>
                      {c.competitionName}
                    </option>
                  ))}
                </select>
              </RequiredSelect>
              {scope === "level" && (
                <RequiredSelect
                  label="เลือกระดับชั้น"
                  missing={!levelId}
                  hint={
                    !competitionYearId
                      ? "เลือกกิจกรรมก่อน แล้วจึงเลือกระดับชั้น"
                      : levelLoading
                        ? "กำลังโหลดระดับชั้น..."
                        : levels.length
                          ? "ต้องเลือกระดับชั้น จึงจะดาวน์โหลดรายงานได้"
                          : "กิจกรรมนี้ยังไม่มีระดับชั้น"
                  }
                >
                  <select
                    value={levelId ?? ""}
                    onChange={(e) => setLevelId(Number(e.target.value) || null)}
                    disabled={!competitionYearId || levelLoading || levels.length === 0}
                    className={`${selectClass} ${competitionYearId && !levelId ? "border-amber-400 bg-amber-50/40" : ""}`}
                    aria-label="ระดับชั้น"
                    aria-required="true"
                  >
                    <option value="">{!competitionYearId ? "— เลือกกิจกรรมก่อน —" : "— กรุณาเลือกระดับชั้น —"}</option>
                    {levels.map((l) => (
                      <option key={l.competitionLevelID} value={l.competitionLevelID}>
                        {l.levelName}
                      </option>
                    ))}
                  </select>
                </RequiredSelect>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Reports */}
      <section>
        <StepLabel no={3}>
          เลือกรายงาน {ready && <span className="font-normal text-slate-500">· {scopeText}</span>}
        </StepLabel>

        {!ready ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-slate-500">
            {scope === "competition" ? "เลือกกิจกรรมด้านบนก่อน" : "เลือกกิจกรรมและระดับชั้นด้านบนก่อน"}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-2 min-[1800px]:grid-cols-3">
            {reports.map((r) => {
              const Icon = r.icon;
              const wordId = `${r.key}-word`;
              const wordLoading = busy === wordId;
              return (
                <article key={r.key} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${r.tone}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-900">{r.title}</h3>
                      <p className="mt-0.5 text-sm text-slate-500">{r.desc}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-1 items-end gap-2">
                    {!r.pdf && !r.word && !r.excel && <p className="text-sm text-slate-400">ยังไม่มีข้อมูลสำหรับรายงานนี้</p>}
                    {r.pdf && (
                      <button
                        type="button"
                        onClick={() => setPreview({ title: `${r.title} · ${scopeText}`, path: r.pdf! })}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100 cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        ดู / พิมพ์ PDF
                      </button>
                    )}
                    {r.word && (
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => run(wordId, r.word!)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        {wordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                        {wordLoading ? "กำลังสร้างไฟล์..." : "ดาวน์โหลด Word"}
                      </button>
                    )}
                    {r.excel && (
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => run(`${r.key}-excel`, r.excel!)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        {busy === `${r.key}-excel` ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                        {busy === `${r.key}-excel` ? "กำลังสร้างไฟล์..." : "ดาวน์โหลด Excel"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      </div>

      {preview && (
        <PdfPreviewModal
          title={preview.title}
          fileName={`${preview.title}.pdf`}
          load={() => fetchExportBlob(preview.path)}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
