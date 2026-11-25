import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { EducationLevel } from "./type";

export const EducationLevelApi = createApi({
  reducerPath: "educationLevel",
  baseQuery: customBaseQuery,
  tagTypes: ["EducationLevel"],
  endpoints: (builder) => ({
    getAllEducationLevel: builder.query<EducationLevel[], void>({
      query: () => "educationLevel",
      transformResponse: (response: ApiResponse<EducationLevel[]>) =>
        response.result,
      providesTags: ["EducationLevel"],
    }),
    addEducationLevel: builder.mutation<
      EducationLevel,
      Partial<EducationLevel>
    >({
      query: (educationLevel) => ({
        url: "educationLevel",
        method: "POST",
        body: educationLevel,
      }),
      invalidatesTags: ["EducationLevel"],
    }),
    updateEducationLevel: builder.mutation<EducationLevel, EducationLevel>({
      query: (educationLevel) => ({
        url: `educationLevel/${educationLevel.levelID}`,
        method: "PUT",
        body: educationLevel,
      }),
      invalidatesTags: ["EducationLevel"],
    }),
    deleteEducationLevel: builder.mutation<{ success: boolean }, number>({
      query: (levelID) => ({
        url: `educationLevel/${levelID}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EducationLevel"],
    }),
  }),
});

export const {
  useGetAllEducationLevelQuery,
  useAddEducationLevelMutation,
  useUpdateEducationLevelMutation,
  useDeleteEducationLevelMutation,
} = EducationLevelApi;
