import { useParams, useLocation, Link } from "react-router-dom";
import { StudentFormsInline } from "../../../student/pages/StudentForms";
import { AlertCircle, ChevronRight } from "lucide-react";
import { useGetCompetitionLevelByIdQuery } from "../../../CompetitionLevel/CompetitionLevelApi";

const STEPS = ["เลือกปี", "เลือกกิจกรรม", "เลือกระดับชั้น", "ลงทะเบียน"];

function StepsBar({ current = 4 }: { current?: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="mt-5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 sm:gap-x-2">
      {STEPS.map((label, idx) => {
        const active = idx + 1 === current;
        return (
          <li key={label} className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-sm sm:text-base font-medium whitespace-nowrap ${
                active ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-500"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  active ? "bg-white text-blue-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {idx + 1}
              </span>
              {label}
            </span>
            {idx < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" />}
          </li>
        );
      })}
    </ol>
  );
}

const TeamPlayersPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { state } = useLocation() as {
    state?: {
      mainPlayersCount: number;
      reservePlayersCount: number;
      competitionLevelID: number;
      requiresProject: boolean;
      competitionName: string;
      levelName: string;
      yearId?: string;
      yearName?: string;
      competitionYearID?: number | string;
      registrationCloseDate?: string;
      registrationMode?: "individual" | "team";
    } | null;
  };
  const { data: competitionLevel } = useGetCompetitionLevelByIdQuery(
    Number(state?.competitionLevelID),
    { skip: !state?.competitionLevelID },
  );
  const mainPlayersCount = competitionLevel?.mainPlayersCount ?? state?.mainPlayersCount ?? 1;
  const reservePlayersCount = competitionLevel?.reservePlayersCount ?? state?.reservePlayersCount ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pb-28">
      {/* ===== Header ===== */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-1.5">
          <span className="flex-1 bg-blue-600" />
          <span className="flex-1 bg-emerald-500" />
          <span className="flex-1 bg-amber-500" />
          <span className="flex-1 bg-rose-500" />
        </div>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-7 md:py-10 text-center">
          {(state?.competitionName || state?.levelName) && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              {state?.competitionName && (
                <span className="bg-amber-400 text-amber-950 px-3 py-1 rounded-full text-base font-bold">
                  {state.competitionName}
                </span>
              )}
              {state?.levelName && (
                <span className="bg-blue-700 text-white px-3 py-1 rounded-full text-base font-bold">
                  ระดับ {state.levelName}
                </span>
              )}
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            เพิ่มรายชื่อนักเรียนในทีม
          </h1>
          <p className="mt-2 text-lg text-slate-500 max-w-2xl mx-auto">
            กรอกนักเรียนตัวจริงให้ครบ {mainPlayersCount} คน
            {reservePlayersCount > 0 ? ` ตัวสำรองไม่เกิน ${reservePlayersCount} คน (ไม่บังคับ)` : ""}
            {" "}แล้วกดบันทึก
          </p>
          <StepsBar />
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {!state?.competitionLevelID ? (
          // เปิดหน้านี้ตรง ๆ / รีเฟรช: ไม่มีข้อมูลระดับชั้น เลยบันทึกและย้อนกลับไม่ได้อย่างถูกต้อง
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-amber-600 mb-3" />
            <p className="text-xl font-bold text-amber-950">กรุณาเปิดหน้านี้ใหม่จากหน้ารายการทีม</p>
            <p className="text-base sm:text-lg text-amber-900 mt-1">
              รายชื่อที่บันทึกไว้ยังอยู่ครบ — ไปที่ เลือกปี → เลือกกิจกรรม → เลือกระดับชั้น
              แล้วกดปุ่ม <b>"จัดการสมาชิกทีม"</b> ของทีมนี้เพื่อแก้ไขต่อ
            </p>
            <Link
              to="/yearuser"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-lg font-bold text-white hover:bg-blue-800 transition-colors"
            >
              ไปหน้าเลือกปี / กิจกรรม
            </Link>
          </div>
        ) : (
          <StudentFormsInline
            teamId={Number(teamId)}
            mainPlayersCount={mainPlayersCount}
            reservePlayersCount={reservePlayersCount}
            competitionLevelID={state.competitionLevelID}
            returnState={{
              requiresProject: state.requiresProject,
              competitionName: state.competitionName,
              levelName: state.levelName,
              mainPlayersCount,
              reservePlayersCount,
              registrationMode: state.registrationMode,
              yearId: state.yearId,
              yearName: state.yearName,
              competitionYearID: state.competitionYearID,
              registrationCloseDate: state.registrationCloseDate,
            }}
            registrationCloseDate={state.registrationCloseDate}
          />
        )}
      </main>
    </div>
  );
};

export default TeamPlayersPage;
