// src/features/School/SchoolApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { School } from "./type";

export const SchoolApi = createApi({
  reducerPath: "schoolApi",
  baseQuery: customBaseQuery,
  tagTypes: ["School"],
  endpoints: (builder) => ({
    // ========== CRUD/Basic ==========
    getAllSchool: builder.query<School[], void>({
      query: () => "schools",
      transformResponse: (response: ApiResponse<School[]>) => response.result ?? [],
      providesTags: ["School"],
    }),
    addSchool: builder.mutation<School, Partial<School>>({
      query: (school) => ({
        url: "schools",
        method: "POST",
        body: school,
      }),
      transformResponse: (response: ApiResponse<School>) => response.result,
      invalidatesTags: ["School"],
    }),
    updateSchool: builder.mutation<School, School>({
      query: (school) => ({
        url: `schools/${school.school_code}`,
        method: "PUT",
        body: school,
      }),
      transformResponse: (response: ApiResponse<School>) => response.result,
      invalidatesTags: ["School"],
    }),
    deleteSchool: builder.mutation<{ success: boolean }, number>({
      query: (school_code) => ({
        url: `schools/${school_code}`,
        method: "DELETE",
      }),
      invalidatesTags: ["School"],
    }),
    searchSchools: builder.query<School[], { q: string; limit?: number }>({
      query: ({ q, limit = 50 }) =>
        `schools?query=${encodeURIComponent(q)}&limit=${limit}`,
      transformResponse: (resp: ApiResponse<School[]>) => resp.result ?? [],
    }),
    getSchoolByCode: builder.query<School, number>({
      query: (code) => `schools/${code}`,
      transformResponse: (resp: ApiResponse<School>) => resp.result,
    }),

    // ========== Cascading ==========
    getProvinces: builder.query<string[], void>({
      query: () => ({ url: "schools/provinces" }), // <-- ตัด '/' นำหน้า
      transformResponse: (res: ApiResponse<string[]>) => res.result ?? [],
      providesTags: ["School"],
    }),
    getDistricts: builder.query<string[], string>({
      // arg = province
      query: (province) => ({ url: "schools/districts", params: { province } }),
      transformResponse: (res: ApiResponse<string[]>) => res.result ?? [],
      // แยกแคชตาม province
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (_currentCache, newItems) => newItems,
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      providesTags: ["School"],
    }),
    searchSchoolsByArea: builder.query<
      Array<Pick<School, "school_code" | "school_name">>,
      { province: string; district: string; q?: string; limit?: number }
    >({
      query: ({ province, district, q, limit = 100 }) => ({
        url: "schools/search",
        params: { province, district, q, limit },
      }),
      transformResponse: (
        res: ApiResponse<Array<Pick<School, "school_code" | "school_name">>>
      ) => res.result ?? [],
    }),
  }),
});

export const {
  useGetAllSchoolQuery,
  useAddSchoolMutation,
  useUpdateSchoolMutation,
  useDeleteSchoolMutation,
  useLazySearchSchoolsQuery,
  useGetSchoolByCodeQuery,
  useLazyGetSchoolByCodeQuery,
  useGetProvincesQuery,
  useGetDistrictsQuery,
  useLazySearchSchoolsByAreaQuery,
} = SchoolApi;
