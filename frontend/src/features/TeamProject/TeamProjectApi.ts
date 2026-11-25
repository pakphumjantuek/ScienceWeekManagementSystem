import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { TeamProject } from "./type";

export const TeamProjectApi = createApi({
  reducerPath: "teamProjectApi",
  baseQuery: customBaseQuery,
  tagTypes: ["TeamProject"],
  endpoints: (builder) => ({
    getTeamProjectByTeamId: builder.query<TeamProject[], number>({
      query: (teamID) => `TeamProject/by-team/${teamID}`,
      transformResponse: (response: ApiResponse<TeamProject[]> | TeamProject[]) =>
        Array.isArray(response) ? response : (response.result ?? []),
      providesTags: ["TeamProject"],
    }),

    getTeamProjectById: builder.query<TeamProject, number>({
      query: (teamProjectID) => `teamProject/${teamProjectID}`,
      transformResponse: (response: ApiResponse<TeamProject> | TeamProject) =>
        "result" in response ? response.result : response,
      providesTags: ["TeamProject"],
    }),

    addTeamProject: builder.mutation<TeamProject, FormData>({
      query: (formData) => ({
        url: "teamProject",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<TeamProject> | TeamProject) =>
        "result" in response ? response.result : response,
      invalidatesTags: ["TeamProject"],
    }),

    updateTeamProject: builder.mutation<
      TeamProject,
      { teamProjectID: number; formData: FormData }
    >({
      query: ({ teamProjectID, formData }) => ({
        url: `teamProject/${teamProjectID}`,
        method: "PUT",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<TeamProject> | TeamProject) =>
        "result" in response ? response.result : response,
      invalidatesTags: ["TeamProject"],
    }),

    deleteTeamProject: builder.mutation<{ success: boolean }, number>({
      query: (teamProjectID) => ({
        url: `teamProject/${teamProjectID}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TeamProject"],
    }),
  }),
});

export const {
  useGetTeamProjectByTeamIdQuery,
  useGetTeamProjectByIdQuery,
  useAddTeamProjectMutation,
  useUpdateTeamProjectMutation,
  useDeleteTeamProjectMutation,
} = TeamProjectApi;
