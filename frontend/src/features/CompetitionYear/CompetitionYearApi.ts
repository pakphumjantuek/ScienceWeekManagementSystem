import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { CompetitionYear } from "./type";

export const CompetitionYearApi = createApi({
  reducerPath: "competitionYear",
  baseQuery: customBaseQuery,
  tagTypes: ["CompetitionYear"],
  endpoints: (builder) => ({
    getAllCompetitionYear: builder.query<CompetitionYear[], number>({
      query: (yearId) => ({
        url: "competitionYear",
        params: { YearID: yearId },
      }),
      transformResponse: (response: ApiResponse<CompetitionYear[]>) =>
        response.result,
      providesTags: ["CompetitionYear"],
    }),
    addCompetitionYear: builder.mutation<
      CompetitionYear,
      Partial<CompetitionYear>
    >({
      query: (competitionYear) => ({
        url: "competitionYear",
        method: "POST",
        body: competitionYear,
      }),
      invalidatesTags: ["CompetitionYear"],
    }),
    updateCompetitionYear: builder.mutation<CompetitionYear, CompetitionYear>({
      query: (competitionYear) => ({
        url: `competitionYear/${competitionYear.competitionYearID}`,
        method: "PUT",
        body: competitionYear,
      }),
      invalidatesTags: ["CompetitionYear"],
    }),
    deleteCompetitionYear: builder.mutation<{ success: boolean }, number>({
      query: (competitionYearID) => ({
        url: `competitionYear/${competitionYearID}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CompetitionYear"],
    }),
  }),
});

export const {
  useGetAllCompetitionYearQuery,
  useAddCompetitionYearMutation,
  useUpdateCompetitionYearMutation,
  useDeleteCompetitionYearMutation,
} = CompetitionYearApi;
