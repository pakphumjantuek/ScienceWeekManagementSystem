import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../Apis";
import { userAuthReducer } from "./userAuthSlice";
import { YearApi } from "../features/Year/YearApi";
import { competitionTypeApi } from "../features/CompetitionType/CompetitionTypeApi";
import { CompetitionApi } from "../features/Competition/CompetitionApi";
import { CompetitionYearApi } from "../features/CompetitionYear/CompetitionYearApi";
import { EducationLevelApi } from "../features/EducationLevel/EducationLevelApi";
import { CompetitionLevelApi } from "../features/CompetitionLevel/CompetitionLevelApi";
import { RewardTypeApi } from "../features/RewardType/RewardTypeApi";
import { TeamApi } from "../features/Team/TeamApi";
import { StudentApi } from "../features/student/StudentApi";
import { matchApi } from "../features/Match/matchApi";
import { competitionReducer } from "../features/Competition/CompetitionSlice";
import { yearReducer } from "../features/Year/YearSlice";
import { certificateApi } from "../features/setting/certificateApi";
import { systemSettingsApi } from "../features/setting/systemSettingsApi";
import { SchoolApi } from "../features/School/SchoolApi";
import { NewsApi } from "../features/News/newsApi";
import { authCookiesApi } from "../features/AuthCookie/authCookiesApi";
import authReducer from "../features/AuthCookie/authSlice";
import { UserAdminApi } from "../features/UserAdmin/userAdminApi";
import { RoleApi } from "../features/Role/roleApi";
import { TeamProjectApi } from "../features/TeamProject/TeamProjectApi";
import { ReportApi } from "../features/Report/ReportApi";
import { PublicReportApi } from "../features/PublicReport/PublicReportApi";
import { trainingApi } from "../features/training/trainingApi";
import { homeBannersApi } from "../features/HomeConfig/homeBannersApi";

const store = configureStore({
  reducer: {
    userAuthStore: userAuthReducer,
    competitionStore: competitionReducer,
    yearStore: yearReducer,
    authCookies: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [YearApi.reducerPath]: YearApi.reducer,
    [competitionTypeApi.reducerPath]: competitionTypeApi.reducer,
    [CompetitionApi.reducerPath]: CompetitionApi.reducer,
    [CompetitionYearApi.reducerPath]: CompetitionYearApi.reducer,
    [EducationLevelApi.reducerPath]: EducationLevelApi.reducer,
    [CompetitionLevelApi.reducerPath]: CompetitionLevelApi.reducer,
    [RewardTypeApi.reducerPath]: RewardTypeApi.reducer,
    [TeamApi.reducerPath]: TeamApi.reducer,
    [StudentApi.reducerPath]: StudentApi.reducer,
    [matchApi.reducerPath]: matchApi.reducer,
    [certificateApi.reducerPath]: certificateApi.reducer,
    [systemSettingsApi.reducerPath]: systemSettingsApi.reducer,
    [SchoolApi.reducerPath]: SchoolApi.reducer,
    [NewsApi.reducerPath]: NewsApi.reducer,
    [authCookiesApi.reducerPath]: authCookiesApi.reducer,
    [UserAdminApi.reducerPath]: UserAdminApi.reducer,
    [RoleApi.reducerPath]: RoleApi.reducer,
    [TeamProjectApi.reducerPath]: TeamProjectApi.reducer,
    [ReportApi.reducerPath]: ReportApi.reducer,
    [PublicReportApi.reducerPath]: PublicReportApi.reducer,
    [trainingApi.reducerPath]: trainingApi.reducer,
    [homeBannersApi.reducerPath]: homeBannersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(YearApi.middleware)
      .concat(competitionTypeApi.middleware)
      .concat(CompetitionApi.middleware)
      .concat(CompetitionYearApi.middleware)
      .concat(EducationLevelApi.middleware)
      .concat(CompetitionLevelApi.middleware)
      .concat(RewardTypeApi.middleware)
      .concat(TeamApi.middleware)
      .concat(StudentApi.middleware)
      .concat(matchApi.middleware)
      .concat(certificateApi.middleware)
      .concat(systemSettingsApi.middleware)
      .concat(SchoolApi.middleware)
      .concat(NewsApi.middleware)
      .concat(UserAdminApi.middleware)
      .concat(RoleApi.middleware)
      .concat(authCookiesApi.middleware)
      .concat(TeamProjectApi.middleware)
      .concat(ReportApi.middleware)
      .concat(PublicReportApi.middleware)
      .concat(trainingApi.middleware)
      .concat(homeBannersApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;

export default store;
