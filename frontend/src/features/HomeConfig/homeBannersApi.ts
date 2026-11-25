import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { ApiResponse } from "../../Interface/apiResponse";

export type HomeBanner = { id: number; imagePath: string; sortOrder: number; isActive: boolean; showInPopup: boolean };
export const homeBannersApi = createApi({ reducerPath: "homeBannersApi", baseQuery: customBaseQuery, tagTypes: ["HomeBanners"], endpoints: (builder) => ({
  getHomeBanners: builder.query<HomeBanner[], void>({ query: () => "HomeBanners", transformResponse: (response: ApiResponse<HomeBanner[]>) => response.result, providesTags: ["HomeBanners"] }),
  addHomeBanner: builder.mutation<HomeBanner, FormData>({ query: (body) => ({ url: "HomeBanners", method: "POST", body }), invalidatesTags: ["HomeBanners"] }),
  updateHomeBanner: builder.mutation<HomeBanner, HomeBanner>({ query: ({ id, ...body }) => ({ url: `HomeBanners/${id}`, method: "PUT", body }), invalidatesTags: ["HomeBanners"] }),
  deleteHomeBanner: builder.mutation<void, number>({ query: (id) => ({ url: `HomeBanners/${id}`, method: "DELETE" }), invalidatesTags: ["HomeBanners"] }),
})});
export const { useGetHomeBannersQuery, useAddHomeBannerMutation, useUpdateHomeBannerMutation, useDeleteHomeBannerMutation } = homeBannersApi;
