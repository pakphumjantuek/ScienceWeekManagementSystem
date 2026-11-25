import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { CompetitionType } from "./type";

export const competitionTypeApi = createApi({
  reducerPath: "competitionTypeApi",
  baseQuery: customBaseQuery,
  tagTypes: ["CompetitionType"],
  endpoints: (builder) => ({
    getAllCompetitionType: builder.query<CompetitionType[], void>({
      query: () => "competitionType",
      transformResponse: (response: ApiResponse<CompetitionType[]>) =>
        response.result,
      providesTags: ["CompetitionType"],
    }),
    addCompetitionType: builder.mutation<
      CompetitionType,
      Partial<CompetitionType>
    >({
      query: (team) => ({
        url: "competitionType",
        method: "POST",
        body: team,
      }),
      invalidatesTags: ["CompetitionType"],
    }),
    updateCompetitionType: builder.mutation<CompetitionType, CompetitionType>({
      query: (competitionType) => ({
        url: `competitionType/${competitionType.competitionTypeID}`,
        method: "PUT",
        body: competitionType,
      }),
      invalidatesTags: ["CompetitionType"],
    }),
    deleteCompetitionType: builder.mutation<{ success: boolean }, number>({
      query: (competitionTypeId) => ({
        url: `competitionType/${competitionTypeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CompetitionType"],
    }),
  }),
});

export const {
  useGetAllCompetitionTypeQuery,
  useAddCompetitionTypeMutation,
  useUpdateCompetitionTypeMutation,
  useDeleteCompetitionTypeMutation,
} = competitionTypeApi;
