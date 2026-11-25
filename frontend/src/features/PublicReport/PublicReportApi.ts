import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type {
  CompetitorAnnouncement,
  PublicReportCompetitionLevel,
  PublicReportCompetitionYear,
  PublicReportLevelSummary,
  PublicReportPaginatedTeams,
  PublicReportStudent,
  PublicReportYear,
} from "./type";

export const PublicReportApi = createApi({
  reducerPath: "publicReportApi",
  baseQuery: customBaseQuery,
  tagTypes: ["PublicReport"],
  endpoints: (builder) => ({
    getReportYears: builder.query<PublicReportYear[], void>({
      query: () => "public/report/years",
      transformResponse: (response: ApiResponse<PublicReportYear[]>) =>
        response.result,
      providesTags: ["PublicReport"],
    }),
    getReportCompetitionYears: builder.query<PublicReportCompetitionYear[], number>({
      query: (yearId) => ({
        url: "public/report/competition-years",
        params: { yearId },
      }),
      transformResponse: (response: ApiResponse<PublicReportCompetitionYear[]>) =>
        response.result,
      providesTags: ["PublicReport"],
    }),
    getReportCompetitionLevels: builder.query<PublicReportCompetitionLevel[], number>({
      query: (competitionYearID) => ({
        url: "public/report/competition-levels",
        params: { competitionYearID },
      }),
      transformResponse: (response: ApiResponse<PublicReportCompetitionLevel[]>) =>
        response.result,
      providesTags: ["PublicReport"],
    }),
    getReportCompetitionLevelSummary: builder.query<PublicReportLevelSummary, number>({
      query: (competitionLevelID) => ({
        url: "public/report/competition-level-summary",
        params: { competitionLevelID },
      }),
      transformResponse: (response: ApiResponse<PublicReportLevelSummary>) =>
        response.result,
      providesTags: ["PublicReport"],
    }),
    getReportTeams: builder.query<
      PublicReportPaginatedTeams,
      { competitionLevelID: number; page?: number; pageSize?: number; search?: string }
    >({
      query: ({ competitionLevelID, page = 1, pageSize = 20, search }) => ({
        url: "public/report/teams",
        params: {
          competitionLevelID,
          page,
          pageSize,
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: (response: ApiResponse<PublicReportPaginatedTeams>) =>
        response.result,
      providesTags: ["PublicReport"],
    }),
    getReportStudentsByTeam: builder.query<PublicReportStudent[], number>({
      query: (teamID) => ({
        url: `public/report/teams/${teamID}/students`,
      }),
      transformResponse: (response: ApiResponse<PublicReportStudent[]>) =>
        response.result,
      providesTags: ["PublicReport"],
    }),
    getReportCompetitorsAnnouncement: builder.query<CompetitorAnnouncement[], number>({
      query: (competitionLevelID) => ({
        url: `public/report/level/${competitionLevelID}/announcements`,
      }),
      transformResponse: (response: ApiResponse<CompetitorAnnouncement[]>) =>
        response.result,
      providesTags: ["PublicReport"],
    }),
  }),
});

export const {
  useGetReportYearsQuery,
  useGetReportCompetitionYearsQuery,
  useGetReportCompetitionLevelsQuery,
  useLazyGetReportCompetitionLevelsQuery,
  useGetReportCompetitionLevelSummaryQuery,
  useLazyGetReportCompetitionLevelSummaryQuery,
  useGetReportTeamsQuery,
  useGetReportStudentsByTeamQuery,
  useGetReportCompetitorsAnnouncementQuery,
} = PublicReportApi;
