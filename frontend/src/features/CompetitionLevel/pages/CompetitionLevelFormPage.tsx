import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loading } from "../../../components/Loading";
import { withAdminAuth } from "../../../HOC";
import { useGetAllCompetitionLevelQuery } from "../CompetitionLevelApi";
import { CompetitionLevelForm } from "./competitionLevelForm";

const CompetitionLevelFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { competitionYearID, competitionLevelID } = useParams<{
    competitionYearID: string;
    competitionLevelID?: string;
  }>();
  const {
    competitionName = "",
    requiresProject,
    yearId = "",
    yearName = "",
  } = location.state || {};
  const isEditMode = Boolean(competitionLevelID);
  const parsedCompetitionYearID = Number(competitionYearID);
  const { data: competitionLevels = [], isLoading } =
    useGetAllCompetitionLevelQuery(parsedCompetitionYearID);

  if (isLoading) return <Loading />;

  const currentCompetitionLevel = isEditMode
    ? competitionLevels.find(
        (item) => item.competitionLevelID === Number(competitionLevelID),
      ) ?? null
    : null;

  const backToList = () =>
    navigate(`/admin/competitionLevelList/${competitionYearID}`, {
      state: {
        competitionName,
        requiresProject,
        yearId,
        yearName,
      },
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={backToList}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-500 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-slate-400/30 transition-colors hover:bg-slate-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          กลับไปรายการระดับชั้น
        </button>
      </div>

      <CompetitionLevelForm
        currentCompetitionLevel={currentCompetitionLevel}
        competitionYearID={competitionYearID}
        onSuccess={backToList}
        onCancel={backToList}
      />
    </div>
  );
};

export default withAdminAuth(CompetitionLevelFormPage);
