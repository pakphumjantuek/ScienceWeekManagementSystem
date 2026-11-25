import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { RewardType } from "./type";

export const RewardTypeApi = createApi({
  reducerPath: "rewardType",
  baseQuery: customBaseQuery,
  tagTypes: ["RewardType"],
  endpoints: (builder) => ({
    getAllRewardType: builder.query<RewardType[], void>({
      query: () => "rewardType",
      transformResponse: (response: ApiResponse<RewardType[]>) =>
        response.result,
      providesTags: ["RewardType"],
    }),
    addRewardType: builder.mutation<RewardType, Partial<RewardType>>({
      query: (educationLevel) => ({
        url: "rewardType",
        method: "POST",
        body: educationLevel,
      }),
      invalidatesTags: ["RewardType"],
    }),
    updateRewardType: builder.mutation<RewardType, RewardType>({
      query: (educationLevel) => ({
        url: `rewardType/${educationLevel.rewardTypeID}`,
        method: "PUT",
        body: educationLevel,
      }),
      invalidatesTags: ["RewardType"],
    }),
    deleteRewardType: builder.mutation<{ success: boolean }, number>({
      query: (rewardTypeID) => ({
        url: `rewardType/${rewardTypeID}`,
        method: "DELETE",
      }),
      invalidatesTags: ["RewardType"],
    }),
  }),
});

export const {
  useGetAllRewardTypeQuery,
  useAddRewardTypeMutation,
  useUpdateRewardTypeMutation,
  useDeleteRewardTypeMutation,
} = RewardTypeApi;
