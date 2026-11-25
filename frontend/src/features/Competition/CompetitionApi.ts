import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { Competition } from "./type";

export const CompetitionApi = createApi({
  reducerPath: "competitionApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Competition"],
  endpoints: (builder) => ({
    getAllCompetition: builder.query<Competition[], void>({
      query: () => "competition",
      transformResponse: (response: ApiResponse<Competition[]>) =>
        response.result,
      providesTags: ["Competition"],
    }),
    getCompetitionByID: builder.query<Competition, number>({
      query: (competitionID) => `competition/${competitionID}`,
      transformResponse: (response: ApiResponse<Competition>) =>
        response.result,
      providesTags: ["Competition"],
    }),
    addCompetition: builder.mutation<Competition, Partial<Competition>>({
      query: (competition) => ({
        url: "competition",
        method: "POST",
        body: competition,
      }),
      invalidatesTags: ["Competition"],
    }),
    updateCompetition: builder.mutation<Competition, Competition>({
      query: (competition) => ({
        url: `competition/${competition.competitionID}`,
        method: "PUT",
        body: competition,
      }),
      invalidatesTags: ["Competition"],
    }),
    deleteCompetition: builder.mutation<{ success: boolean }, number>({
      query: (competitionID) => ({
        url: `competition/${competitionID}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Competition"],
    }),
  }),
});

export const {
  useGetAllCompetitionQuery,
  useGetCompetitionByIDQuery,
  useAddCompetitionMutation,
  useUpdateCompetitionMutation,
  useDeleteCompetitionMutation,
} = CompetitionApi;
