import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loading } from "../../../components";
import { withAdminAuth } from "../../../HOC";
import { useGetAllCompetitionYearQuery } from "../CompetitionYearApi";
import { CompetitionYearForm } from "./CompetitionYearForm";

const CompetitionYearFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { yearId, competitionYearId } = useParams<{
    yearId: string;
    competitionYearId?: string;
  }>();
  const yearName = location.state?.yearName;
  const isEditMode = Boolean(competitionYearId);
  const parsedYearId = Number(yearId);
  const { data: competitionYears = [], isLoading } =
    useGetAllCompetitionYearQuery(parsedYearId);

  if (isLoading) return <Loading />;

  const currentCompetitionYear = isEditMode
    ? competitionYears.find(
        (item) => item.competitionYearID === Number(competitionYearId),
      ) ?? null
    : null;

  const backToList = () =>
    navigate(`/admin/competitionYearsList/${yearId}`, {
      state: { yearName },
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={backToList}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-500 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-slate-400/30 transition-colors hover:bg-slate-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          กลับไปรายการกิจกรรม
        </button>
      </div>

      <CompetitionYearForm
        currentCompetitionYear={currentCompetitionYear}
        yearId={yearId}
        onSuccess={backToList}
        onCancel={backToList}
      />
    </div>
  );
};

export default withAdminAuth(CompetitionYearFormPage);
