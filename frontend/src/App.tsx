import { GlobalModal } from "./components/modals/GlobalModal";
import Navbar from "./components/Navbar";
import ActivityBannerModal from "./components/ActivityBannerModal";
import AuditLogPage from "./features/AuditLog/pages/AuditLogPage";
import ReportCenterPage from "./features/Report/pages/ReportCenterPage";
import { AccessDenied, Login, Register } from "./Pages";
import { Route, Routes, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { setLoggedInUser } from "./Redux/userAuthSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import NavMenu from "./components/NavMenu";
import {
  CompetitionLevelList,
  CompetitionLevelFormPage,
  CompetitionLevelResults,
  CompetitionList,
  CompetitionTypeList,
  CompetitionYearList,
  CompetitionYearFormPage,
  CompetitionYearsResults,
  EducationLevelList,
  MatchResultList,
  MatchTabs,
  RewardTypeList,
  StudentList,
  StudentUserList,
  TeamCheckin,
  TeamList,
  TeamStatus,
  TeamUserResult,
  YearList,
  YearFormPage,
  YearResults,
  NewsList,
  NewsFormPage,
  NewListUser,
  NewListDetail,
  UserAdminList,
  RoleList,
  ReportDashboard,
  SystemSettingsPage,
  StaffYearList,
  StaffCompetitionYearList,
  StaffCompetitionLevelList,
  StaffStudentList,
  StaffMatchTabs,
  StaffMatchTabsRov,
} from "./features";
import { useGetSystemSettingsQuery } from "./features/setting/systemSettingsApi";
import { Footer, Notfound, StaffNavMenu } from "./components";

import YearUserList from "./features/Year/pages/YearUserList";
import CompetitionYearUserList from "./features/CompetitionYear/pages/CompetitionYearUserList";
import CompetitionLevelUserList from "./features/CompetitionLevel/pages/CompetitionLevelUserList";
import { MatchTabsRov } from "./features/Match/pages/MathchTabsRov";
import UploadBackgroundYear from "./features/setting/pages/UploadBackgroundYear";
import { MatchUserList } from "./features/Match/pages/MatchUserList";
import TeamRegister from "./features/Team/pages/User/TeamRegisterList";
import TeamFormNew from "./features/Team/pages/User/TeamFormPage";
import MyActivityRegistrationsPage from "./features/Team/pages/User/MyRegistrationsPage";
import SchoolList from "./features/School/Pages/SchoolList";
import TeamPlayersPage from "./features/Team/pages/User/TeamPlayersPage";
import TeamRovList from "./features/Team/pages/User/TeamRovList";
import AdminFormPage from "./features/Team/pages/Admin/AdminFormPage";
import Home from "./features/AuthCookie/page/Homes";
import LoginPage from "./features/AuthCookie/page/LoginPage";
import RegisterPage from "./features/AuthCookie/page/RegisterPage";
import Secure from "./features/AuthCookie/page/Secure";
import ResetPassword from "./features/Auth/Pages/ResetPassword";
import HomePage from "./features/HomeConfig/page/HomePage";
import EventSchedulePage from "./features/HomeConfig/page/EventSchedulePage";
import HomeBannersPage from "./features/HomeConfig/page/HomeBannersPage";
import PublicReportYearsPage from "./features/PublicReport/pages/PublicReportYearsPage";
import PublicReportCompetitionYearsPage from "./features/PublicReport/pages/PublicReportCompetitionYearsPage";
import PublicReportCompetitionLevelsPage from "./features/PublicReport/pages/PublicReportCompetitionLevelsPage";
import PublicReportCompetitionLevelOverviewPage from "./features/PublicReport/pages/PublicReportCompetitionLevelOverviewPage";
import ClosedActivitiesAnnouncementPage from "./features/PublicReport/pages/ClosedActivitiesAnnouncementPage";
import CompetitorAnnouncementPage from "./features/PublicReport/pages/CompetitorAnnouncementPage";
import PublicReportCompetitionSummaryPage from "./features/PublicReport/pages/PublicReportCompetitionSummaryPage";
import TrainingTopicsListPage from "./features/training/pages/TrainingTopicsListPage";
import MyRegistrationsPage from "./features/training/pages/MyRegistrationsPage";
import AdminTrainingTopicsPage from "./features/training/pages/AdminTrainingTopicsPage";
import AdminTrainingRegistrationsPage from "./features/training/pages/AdminTrainingRegistrationsPage";
import AdminTrainingTopicFormPage from "./features/training/pages/AdminTrainingTopicFormPage";
import AdminBranchesPage from "./features/training/pages/AdminBranchesPage";

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { data: settings } = useGetSystemSettingsQuery();

  useEffect(() => {
    const localToken = localStorage.getItem("token");
    if (localToken) {
      try {
        const decoded: any = jwtDecode(localToken);
        const id =
          decoded.id ||
          decoded.nameid ||
          decoded[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
          ] ||
          "";
        const email =
          decoded.email ||
          decoded[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
          ] ||
          "";
        const role =
          decoded.role ||
          decoded[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
          ] ||
          decoded.Role ||
          "";
        dispatch(setLoggedInUser({ id, email, role }));
      } catch (e) {
        console.error("JWT Decode Error:", e);
      }
    }
  }, []);

  const hideNavbar =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/staff") ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname.startsWith("/matchuser") ||
    // location.pathname.startsWith("/yearresults") ||
    // location.pathname.startsWith("/competitionyearresults") ||
    // location.pathname.startsWith("/competitionlevelresults") ||
    // location.pathname.startsWith("/teamuserresult") ||
    location.pathname.startsWith("/teamrovlist");

  const hideFooter =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/staff") ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "404" ||
    location.pathname.startsWith("/matchuser") ||
    location.pathname.startsWith("/competitionyearresults") ||
    location.pathname.startsWith("/competitionlevelresults") ||
    location.pathname.startsWith("/teamuserresult") ||
    // location.pathname.startsWith("/yearresults") ||
    location.pathname.startsWith("/teamrovlist");

  return (
    <div>
      <GlobalModal />
      {!hideNavbar && (settings?.showNavbar ?? true) && <Navbar />}
      {!hideNavbar && <ActivityBannerModal />}
      <div className="">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/schedule" element={<EventSchedulePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/training/list" element={<TrainingTopicsListPage />} />
          <Route path="/training/my" element={<MyRegistrationsPage />} />
          <Route path="/my-registrations" element={<MyActivityRegistrationsPage />} />
          <Route path="/yearuser" element={<YearUserList />} />
          <Route path="/yearresults" element={<YearResults />} />
          <Route path="/news/:id" element={<NewListDetail />} />
          <Route path="/newsList" element={<NewListUser />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/reports/applicants"
            element={<PublicReportYearsPage />}
          />
          <Route
            path="/reports/applicants/:yearId/summary"
            element={<PublicReportCompetitionSummaryPage />}
          />
          <Route
            path="/reports/applicants/:yearId/competitions"
            element={<PublicReportCompetitionYearsPage />}
          />
          <Route
            path="/reports/applicants/competition-years/:competitionYearID/levels"
            element={<PublicReportCompetitionLevelsPage />}
          />
          <Route
            path="/reports/applicants/competition-level/:competitionLevelID"
            element={<PublicReportCompetitionLevelOverviewPage />}
          />
          <Route
            path="/announcements"
            element={<ClosedActivitiesAnnouncementPage />}
          />
          <Route
            path="/announcements/level/:competitionLevelId"
            element={<CompetitorAnnouncementPage />}
          />

          {/* Auth Cookie */}
          <Route path="/homes" element={<Home />} />
          <Route path="/logins" element={<LoginPage />} />
          <Route path="/registers" element={<RegisterPage />} />
          <Route path="/secures" element={<Secure />} />

          {/* Auth Cookie */}
          <Route
            path="/teamrovlist/:competitionLevelID"
            element={<TeamRovList />}
          />
          <Route
            path="/matchuser/:competitionLevelID"
            element={<MatchUserList />}
          />
          <Route
            path="/teamformnew/:competitionLevelID"
            element={<TeamFormNew />}
          />
          <Route path="/team/:teamId/players" element={<TeamPlayersPage />} />

          <Route
            path="/teamregister/:competitionLevelID"
            element={<TeamRegister />}
          />
          <Route
            path="/competitionyearresults/:yearId"
            element={<CompetitionYearsResults />}
          />
          <Route
            path="/competitionlevelresults/:competitionYearID"
            element={<CompetitionLevelResults />}
          />
          <Route
            path="/competitionYearsList/:yearId"
            element={<CompetitionYearUserList />}
          />
          <Route
            path="/teamuserresult/:competitionLevelID"
            element={<TeamUserResult />}
          />
          <Route
            path="/competitionLevelUserList/:competitionYearID"
            element={<CompetitionLevelUserList />}
          />
          <Route path="/studentuser/:teamId" element={<StudentUserList />} />
          <Route path="/accessDenied" element={<AccessDenied />} />

          <Route path="/admin" element={<NavMenu />}>
            <Route path="year" element={<YearList />} />
            <Route path="year/new" element={<YearFormPage />} />
            <Route path="year/:yearId/edit" element={<YearFormPage />} />
            <Route path="competitiontype" element={<CompetitionTypeList />} />
            <Route path="competition" element={<CompetitionList />} />
            <Route path="educationlevel" element={<EducationLevelList />} />
            <Route path="rewardType" element={<RewardTypeList />} />
            <Route path="team" element={<TeamList />} />
            <Route path="teamcheckin" element={<TeamCheckin />} />
            <Route path="school" element={<SchoolList />} />
            <Route path="adminform" element={<AdminFormPage />} />
            <Route path="news" element={<NewsList />} />
            <Route path="news/new" element={<NewsFormPage />} />
            <Route path="news/:id/edit" element={<NewsFormPage />} />
            <Route path="useradmin" element={<UserAdminList />} />
            <Route path="role" element={<RoleList />} />
            <Route path="report-dashboard" element={<ReportDashboard />} />

            <Route
              path="teamstatus/:competitionLevelID"
              element={<TeamStatus />}
            />
            <Route
              path="competitionYearsList/:yearId"
              element={<CompetitionYearList />}
            />
            <Route
              path="competitionYearsList/:yearId/new"
              element={<CompetitionYearFormPage />}
            />
            <Route
              path="competitionYearsList/:yearId/edit/:competitionYearId"
              element={<CompetitionYearFormPage />}
            />
            <Route
              path="competitionLevelList/:competitionYearID"
              element={<CompetitionLevelList />}
            />
            <Route
              path="competitionLevelList/:competitionYearID/new"
              element={<CompetitionLevelFormPage />}
            />
            <Route
              path="competitionLevelList/:competitionYearID/edit/:competitionLevelID"
              element={<CompetitionLevelFormPage />}
            />
            <Route path="student/:teamId" element={<StudentList />} />
            <Route
              path="/admin/competitionLevel/:competitionLevelID/matches/result"
              element={<MatchResultList />}
            />
            <Route
              path="/admin/competitionLevel/:competitionLevelID/match"
              element={<MatchTabs />}
            />
            <Route
              path="/admin/competitionLevel/:competitionLevelID/matchrov"
              element={<MatchTabsRov />}
            />
            <Route
              path="uploadBackgroundYear/:yearId"
              element={<UploadBackgroundYear />}
            />
            <Route path="systemsettings" element={<SystemSettingsPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="reports" element={<ReportCenterPage />} />
            <Route path="homebanners" element={<HomeBannersPage />} />
            <Route
              path="trainingtopics"
              element={<AdminTrainingTopicsPage />}
            />
            <Route path="branches" element={<AdminBranchesPage />} />
            <Route
              path="trainingtopics/new"
              element={<AdminTrainingTopicFormPage />}
            />
            <Route
              path="trainingtopics/:topicId/edit"
              element={<AdminTrainingTopicFormPage />}
            />
            <Route
              path="trainingtopics/:topicId/registrations"
              element={<AdminTrainingRegistrationsPage />}
            />
          </Route>

          <Route path="/staff" element={<StaffNavMenu />}>
            <Route path="dashboard" element={<ReportDashboard />} />
            <Route path="year" element={<StaffYearList />} />
            <Route path="reports" element={<ReportCenterPage />} />
            <Route
              path="competitionYearsList/:yearId"
              element={<StaffCompetitionYearList />}
            />
            <Route
              path="competitionLevelList/:competitionYearID"
              element={<StaffCompetitionLevelList />}
            />
            <Route
              path="competitionLevel/:competitionLevelID/match"
              element={<StaffMatchTabs />}
            />
            <Route
              path="competitionLevel/:competitionLevelID/matchrov"
              element={<StaffMatchTabsRov />}
            />
            <Route path="student/:teamId" element={<StaffStudentList />} />
            <Route path="adminform" element={<AdminFormPage />} />
          </Route>
          <Route path="*" element={<Notfound />} />
        </Routes>
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default App;
