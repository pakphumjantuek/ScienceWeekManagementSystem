import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type {
  MyRegistration,
  Team,
  TeamCopyRequest,
  TeamCopyResult,
  TeamAdvisor,
  TeamRegister,
  TeamStatusGroupResponse,
} from "./type";

export const TeamApi = createApi({
  reducerPath: "teamApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Team"],
  endpoints: (builder) => ({
    getAllTeam: builder.query<Team[], void>({
      query: () => "team",
      transformResponse: (response: ApiResponse<Team[]>) => response.result,
      providesTags: ["Team"],
    }),
    getAllTeamStatus: builder.query<TeamStatusGroupResponse, number>({
      query: (competitionLevelID) => ({
        url: "team/status",
        params: { competitionLevelID: competitionLevelID },
      }),
      transformResponse: (response: ApiResponse<TeamStatusGroupResponse>) =>
        response.result,
      providesTags: ["Team"],
    }),
    getAllTeamByCompetitionLevel: builder.query<Team[], number>({
      query: (competitionLevelID) => ({
        url: "teamRegistration/teamcompetitionLevel",
        params: { competitionLevelID: competitionLevelID },
      }),
      transformResponse: (response: ApiResponse<Team[]>) => response.result,
      providesTags: ["Team"],
    }),
    getMyRegistrations: builder.query<MyRegistration[], void>({
      query: () => "teamRegistration/my",
      transformResponse: (response: ApiResponse<MyRegistration[]>) => response.result,
      providesTags: ["Team"],
    }),
    addTeam: builder.mutation<TeamRegister, FormData>({
      query: (formData) => ({
        url: "team",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: any) => response.result,
      invalidatesTags: ["Team"],
    }),
    updateTeam: builder.mutation<Team, TeamRegister>({
      query: (team) => ({
        url: `team/${team.teamID}`,
        method: "PUT",
        body: team,
      }),
      transformResponse: (response: any) => response.result,
      invalidatesTags: ["Team"],
    }),
    updateTeamRegistration: builder.mutation<void, TeamRegister>({
      query: (team) => ({
        url: `teamRegistration/register?teamId=${team.teamID}&competitionLevelID=${team.competitionLevelID}`,
        method: "PUT",
        body: team,
      }),
      invalidatesTags: ["Team"],
    }),
    getTeamAdvisors: builder.query<TeamAdvisor[], number>({
      query: (teamId) => `teams/${teamId}/advisors`,
      transformResponse: (response: ApiResponse<TeamAdvisor[]>) => response.result,
      providesTags: ["Team"],
    }),
    updateTeamAdvisors: builder.mutation<void, { teamId: number; advisors: TeamAdvisor[] }>({
      query: ({ teamId, advisors }) => ({ url: `teams/${teamId}/advisors`, method: "PUT", body: advisors }),
      invalidatesTags: ["Team"],
    }),
    updateTeamStatus: builder.mutation<
      void,
      { teamID: number; status: number }
    >({
      query: ({ teamID, status }) => ({
        url: `teamRegistration/${teamID}/changStatusTeam?status=${status}`,
        method: "PUT",
      }),
      invalidatesTags: ["Team"],
    }),
    deleteTeam: builder.mutation<{ success: boolean }, number>({
      query: (teamId) => ({
        url: `team/${teamId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Team"],
    }),
    updateaward: builder.mutation<
      void,
      { teamID: number; rewardTypeId: number }
    >({
      query: ({ teamID, rewardTypeId }) => ({
        url: `TeamRegistration/${teamID}/award?rewardTypeID=${rewardTypeId}`,
        method: "PUT",
      }),
      invalidatesTags: ["Team"],
    }),
    copyTeam: builder.mutation<TeamCopyResult, TeamCopyRequest>({
      query: (payload) => ({
        url: "team/copy",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: any) => response.result ?? response, // รองรับทั้ง 2 แบบ
      invalidatesTags: ["Team"],
    }),
    changeTeamLevel: builder.mutation<
      ApiResponse<any>,
      { teamId: number; targetCompetitionLevelId: number }
    >({
      query: (body) => ({
        url: "team/change-level",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Team"],
    }),
  }),
});

export const {
  useGetAllTeamQuery,
  useGetAllTeamStatusQuery,
  useGetAllTeamByCompetitionLevelQuery,
  useGetMyRegistrationsQuery,
  useAddTeamMutation,
  useUpdateTeamMutation,
  useUpdateTeamRegistrationMutation,
  useGetTeamAdvisorsQuery,
  useUpdateTeamAdvisorsMutation,
  useDeleteTeamMutation,
  useUpdateTeamStatusMutation,
  useUpdateawardMutation,
  useCopyTeamMutation,
  useChangeTeamLevelMutation,
} = TeamApi;
