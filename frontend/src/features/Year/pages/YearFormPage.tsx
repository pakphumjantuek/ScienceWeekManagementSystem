import { useNavigate, useParams } from "react-router-dom";
import { Loading } from "../../../components/Loading";
import { withAdminAuth } from "../../../HOC";
import { useGetAllYearQuery } from "../YearApi";
import { YearForm } from "./YearForm";

const YearFormPage = () => {
  const navigate = useNavigate();
  const { yearId } = useParams<{ yearId?: string }>();
  const isEditMode = Boolean(yearId);
  const { data: years = [], isLoading } = useGetAllYearQuery();

  if (isLoading) return <Loading />;

  const currentYear = isEditMode
    ? years.find((year) => year.yearID === Number(yearId)) ?? null
    : null;

  return (
    <div className="w-full space-y-6 font-sarabun">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigate("/admin/year")}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-500 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-slate-400/30 transition-colors hover:bg-slate-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          กลับไปรายการปีการแข่งขัน
        </button>
      </div>

      <YearForm
        currentYear={currentYear}
        onSuccess={() => navigate("/admin/year")}
        onCancel={() => navigate("/admin/year")}
      />
    </div>
  );
};

export default withAdminAuth(YearFormPage);
