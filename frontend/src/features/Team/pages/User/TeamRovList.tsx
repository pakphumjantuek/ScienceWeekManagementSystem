import { Loading } from "../../../../components/Loading";
import { useGetAllTeamStatusQuery } from "../../TeamApi";
import { useParams } from "react-router-dom";
import { badgeClass } from "../../../../utils";
import { Trophy, Crown, Medal, Star } from "lucide-react";

// =============================
// Config (มาตรฐาน "ติดกัน")
// =============================
const SECTION_ORDER = [
  "รางวัลชนะเลิศ",
  "รางวัลรองชนะเลิศอันดับ1",
  "รางวัลรองชนะเลิศอันดับ2",
  "รางวัลชมเชย",
];

// แปลงทุกรูปแบบให้เป็นมาตรฐาน "ติดกัน"
const normalizeReward = (raw?: string) => {
  const r = (raw ?? "").trim();
  if (!r) return "";

  // รวมช่องว่างซ้ำ
  let fixed = r.replace(/\s+/g, " ");

  // บังคับ "อันดับ X" ให้เป็นไม่มีเว้นวรรค (อันดับ1/อันดับ2)
  fixed = fixed
    .replace(/อันดับ\s*1/g, "อันดับ1")
    .replace(/อันดับ\s*2/g, "อันดับ2");

  // กรณีข้อมูลเก่า: "รางวัลชนะเลิศอันดับ1/2" ให้ตีความเป็น "รองชนะเลิศอันดับ1/2"
  if (/รางวัลชนะเลิศอันดับ1/.test(fixed)) return "รางวัลรองชนะเลิศอันดับ1";
  if (/รางวัลชนะเลิศอันดับ2/.test(fixed)) return "รางวัลรองชนะเลิศอันดับ2";

  // รองชนะเลิศ (มี/ไม่มีคำว่า "รางวัล")
  if (/รองชนะเลิศ/.test(fixed)) {
    if (/อันดับ1/.test(fixed)) return "รางวัลรองชนะเลิศอันดับ1";
    if (/อันดับ2/.test(fixed)) return "รางวัลรองชนะเลิศอันดับ2";
  }

  // ชนะเลิศ (ที่ไม่ใช่รอง)
  if (/รางวัลชนะเลิศ/.test(fixed) && !/รองชนะเลิศ/.test(fixed)) {
    return "รางวัลชนะเลิศ";
  }

  if (/รางวัลชมเชย/.test(fixed)) return "รางวัลชมเชย";

  // ถ้าไม่เข้าเงื่อนไข ให้คืนค่าที่ทำความสะอาดแล้ว (อาจตรงกับมาตรฐานอยู่แล้ว)
  return fixed;
};

const awardVisual = (section: string) => {
  switch (section) {
    case "รางวัลชนะเลิศ":
      return {
        icon: Crown,
        chip: "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-white shadow-amber-200",
        bar: "from-amber-300/40 to-amber-500/40",
        bubble: "bg-amber-300/30",
        podium: "from-amber-300 to-amber-500",
        glow: "shadow-[0_8px_30px_rgba(245,158,11,0.35)]",
      };
    case "รางวัลรองชนะเลิศอันดับ1":
      return {
        icon: Trophy,
        chip: "bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-400 text-slate-900 shadow-zinc-200",
        bar: "from-zinc-300/40 to-zinc-400/40",
        bubble: "bg-zinc-300/30",
        podium: "from-zinc-200 to-zinc-400",
        glow: "shadow-[0_8px_30px_rgba(161,161,170,0.35)]",
      };
    case "รางวัลรองชนะเลิศอันดับ2":
      return {
        icon: Medal,
        chip: "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white shadow-orange-200",
        bar: "from-orange-300/40 to-orange-500/40",
        bubble: "bg-orange-300/30",
        podium: "from-orange-300 to-orange-500",
        glow: "shadow-[0_8px_30px_rgba(249,115,22,0.35)]",
      };
    default:
      return {
        icon: Star,
        chip: "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white shadow-sky-200",
        bar: "from-sky-400/40 to-indigo-500/40",
        bubble: "bg-sky-300/30",
        podium: "from-sky-400 to-indigo-500",
        glow: "shadow-[0_8px_30px_rgba(59,130,246,0.35)]",
      };
  }
};

const ColumnHeader: React.FC<{ title: string }> = ({ title }) => {
  const { icon: Icon, bubble } = awardVisual(title);
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div
          className={`h-9 w-9 rounded-2xl flex items-center justify-center ${bubble} ring-1 ring-black/5`}
        >
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      </div>
    </div>
  );
};

const PodiumColumn: React.FC<{
  section: string;
  teams: any[];
  heightClass: string;
  roundedClass?: string;
}> = ({ section, teams, heightClass, roundedClass }) => {
  const { podium, /* chip, */ glow } = awardVisual(section);

  return (
    <div className="flex flex-col items-center ">
      {/* รายชื่อด้านบนแท่น (ข้อความล้วน) */}
      <div className="mb-3 flex flex-col items-center justify-center">
        <ColumnHeader title={section} />

        {teams && teams.length > 0 ? (
          <ul className="space-y-1">
            {teams.map((t: any, i: number) => (
              <li
                key={t.teamID ?? i}
                className="text-lg sm:text-xl text-slate-900"
              >
                <span className="font-semibold text-center">
                  {t.school_name}
                  {t.teamName ? ` • ${t.teamName}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-xs text-slate-400 italic">
            ยังไม่มีทีมในหมวดนี้
          </span>
        )}
      </div>

      {/* แท่น */}
      <div
        className={`relative w-full ${heightClass} rounded-2xl ${
          roundedClass ?? ""
        } bg-gradient-to-b ${podium} ${glow} border border-white/40 transition-transform duration-300 will-change-transform hover:-translate-y-0.5`}
      >
        <div className="absolute inset-x-0 top-0 h-10 bg-white/20 rounded-t-2xl blur-md" />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5" />
        {/* ป้ายหมวดที่ฐานแท่น (แสดงชื่อมาตรฐาน "ติดกัน") */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 px-4 py-1.5 rounded-full bg-white shadow border font-semibold border-slate-200 text-sm sm:text-base text-slate-700">
          {section}
        </div>
      </div>
    </div>
  );
};

const TeamRovList = () => {
  const { competitionLevelID } = useParams<{ competitionLevelID: string }>();
  const { data, isLoading } = useGetAllTeamStatusQuery(
    Number(competitionLevelID)
  );

  if (isLoading) return <Loading />;

  // =============================
  // Data prep
  // =============================
  const items = (data?.checkedInTeams ?? [])
    .map((t: any) => ({ ...t, rewardTypeNorm: normalizeReward(t.rewardType) }))
    .filter((t: any) => SECTION_ORDER.includes(t.rewardTypeNorm));

  const grouped: Record<string, any[]> = SECTION_ORDER.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {} as Record<string, any[]>);

  for (const t of items) grouped[t.rewardTypeNorm].push(t);

  SECTION_ORDER.forEach((key) =>
    grouped[key].sort((a, b) =>
      (a.school_name ?? "").localeCompare(b.school_name ?? "", "th")
    )
  );

  const total = items.length;
  const first = grouped["รางวัลชนะเลิศ"] ?? [];
  const second = grouped["รางวัลรองชนะเลิศอันดับ1"] ?? [];
  const third = grouped["รางวัลรองชนะเลิศอันดับ2"] ?? [];
  const consolation = grouped["รางวัลชมเชย"] ?? [];

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Aurora background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 -left-10 h-64 w-64 rounded-full blur-3xl bg-indigo-300/30 animate-pulse" />
        <div className="absolute top-1/3 -right-10 h-72 w-72 rounded-full blur-3xl bg-sky-300/25 animate-pulse" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full blur-3xl bg-amber-400/25 animate-pulse" />
      </div>

      <div className="w-full">
        {/* Poster */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {/* Body */}
          <div className="p-6 sm:p-10">
            {/* ====== P O D I U M  ====== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
              {/* รองชนะเลิศอันดับ1 (ซ้าย) */}
              <PodiumColumn
                section="รางวัลรองชนะเลิศอันดับ1"
                teams={second}
                heightClass="h-40 sm:h-48"
                roundedClass="sm:rounded-b-2xl"
              />

              {/* ชนะเลิศ (กลาง) */}
              <div className="order-first sm:order-none">
                <PodiumColumn
                  section="รางวัลชนะเลิศ"
                  teams={first}
                  heightClass="h-56 sm:h-64"
                  roundedClass="sm:rounded-b-2xl "
                />
              </div>

              {/* รองชนะเลิศอันดับ2 (ขวา) */}
              <PodiumColumn
                section="รางวัลรองชนะเลิศอันดับ2"
                teams={third}
                heightClass="h-32 sm:h-40 "
                roundedClass="sm:rounded-b-2xl"
              />
            </div>

            {/* เส้นคั่นบาง ๆ */}
            <div className="my-10 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {/* ====== รางวัลชมเชย ====== */}
            {(consolation?.length ?? 0) > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-2xl flex items-center justify-center bg-sky-300/30 ring-1 ring-black/5">
                      <Star className="h-5 w-5 text-slate-700" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">
                      รางวัลชมเชย
                    </h2>
                  </div>
                  <span
                    className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-semibold ${badgeClass(
                      "รางวัลชมเชย"
                    )}`}
                  >
                    {consolation.length} ทีม
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {consolation.map((team: any, idx: number) => (
                    <div
                      key={team.teamID ?? idx}
                      className="group relative flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                          <div className="text-base font-semibold text-slate-800 ">
                            {team.school_name}
                          </div>
                          {team.teamName && (
                            <div className="text-xs text-slate-500 ">
                              ทีม: {team.teamName}
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badgeClass(
                          "รางวัลชมเชย"
                        )}`}
                        title="รางวัลชมเชย"
                      >
                        รางวัลชมเชย
                      </span>

                      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 group-hover:ring-indigo-200 transition" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {total === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600">
                  <Star className="w-4 h-4" /> ยังไม่มีผู้ชนะในรายการนี้
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRovList;
