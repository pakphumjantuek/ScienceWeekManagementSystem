import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { CompetitionLevel } from "./type";

export const CompetitionLevelApi = createApi({
  reducerPath: "competitionLevelApi",
  baseQuery: customBaseQuery,
  tagTypes: ["CompetitionLevel"],
  endpoints: (builder) => ({
    getAllCompetitionLevel: builder.query<CompetitionLevel[], number>({
      query: (competitionYearID) => ({
        url: "competitionLevel",
        params: { competitionYearID: competitionYearID },
      }),

      transformResponse: (response: ApiResponse<CompetitionLevel[]>) =>
        response.result,
      providesTags: ["CompetitionLevel"],
    }),
    getCompetitionLevelById: builder.query<CompetitionLevel, number>({
      query: (id) => `competitionLevel/${id}`,
      transformResponse: (response: ApiResponse<CompetitionLevel>) => response.result,
    }),
    addCompetitionLevel: builder.mutation<
      CompetitionLevel,
      Partial<CompetitionLevel>
    >({
      query: (competitionLevel) => ({
        url: "competitionLevel",
        method: "POST",
        body: competitionLevel,
      }),
      invalidatesTags: ["CompetitionLevel"],
    }),
    updateCompetitionLevel: builder.mutation<
      CompetitionLevel,
      CompetitionLevel
    >({
      query: (competitionLevel) => ({
        url: `competitionLevel/${competitionLevel.competitionLevelID}`,
        method: "PUT",
        body: competitionLevel,
      }),
      invalidatesTags: ["CompetitionLevel"],
    }),
    deleteCompetitionLevel: builder.mutation<{ success: boolean }, number>({
      query: (competitionLevelID) => ({
        url: `competitionLevel/${competitionLevelID}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CompetitionLevel"],
    }),
    closeCompetitionLevel: builder.mutation<
      number,
      { competitionLevelID: number }
    >({
      query: ({ competitionLevelID }) => ({
        url: `competitionlevel/teamcertificateNumber/${competitionLevelID}`,
        method: "POST",
      }),
      invalidatesTags: ["CompetitionLevel"],
    }),
  }),
});

export const {
  useGetAllCompetitionLevelQuery,
  useGetCompetitionLevelByIdQuery,
  useAddCompetitionLevelMutation,
  useUpdateCompetitionLevelMutation,
  useDeleteCompetitionLevelMutation,
  useCloseCompetitionLevelMutation,
} = CompetitionLevelApi;
