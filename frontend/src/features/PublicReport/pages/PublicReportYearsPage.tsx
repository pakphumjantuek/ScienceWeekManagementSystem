import { ArrowLeft, BarChart3, ChevronRight, FolderSearch } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Loading } from "../../../components";
import { useGetReportYearsQuery } from "../PublicReportApi";

export default function PublicReportYearsPage() {
  const { data: years, isLoading, error } = useGetReportYearsQuery();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_35%),linear-gradient(135deg,_#eff6ff_0%,_#ffffff_45%,_#f8fafc_100%)] px-4 py-6 sm:px-8 sm:py-8">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-sky-700"
            >
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-sky-700">
              <BarChart3 className="h-3.5 w-3.5" />
              APPLICANT REPORT
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              ดูยอดผู้สมัคร
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              เลือกปีการแข่งขันเพื่อดูยอดโรงเรียน ทีม และนักเรียนแบบไม่ต้องเข้าสู่ระบบ
            </p>
          </div>
        </section>

        {error ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-14 text-center text-rose-800">
            ไม่สามารถโหลดรายการปีสำหรับรายงานได้
          </section>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:hidden">
            เลื่อนตารางซ้ายขวาเพื่อดูข้อมูลเพิ่มเติม
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-900 text-slate-100">
                <tr>
                  <th className="px-4 py-4 font-semibold sm:px-6">ปีการจัดงาน</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">ปีการศึกษา</th>
                  <th className="px-4 py-4 text-right font-semibold sm:px-6">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(years ?? []).map((year) => (
                  <tr
                    key={year.yearID}
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-4 sm:px-6 sm:py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                          <FolderSearch className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-slate-900 text-base">
                          {year.yearName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-5">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        ปี {year.yearNumber}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right sm:px-6 sm:py-5">
                      <Link
                        to={`/reports/applicants/${year.yearID}/competitions`}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:w-auto"
                      >
                        ดูข้อมูลกิจกรรม
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
