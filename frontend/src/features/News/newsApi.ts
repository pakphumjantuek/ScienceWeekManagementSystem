import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { News } from "./type";

export const NewsApi = createApi({
  reducerPath: "news",
  baseQuery: customBaseQuery,
  tagTypes: ["News"],
  endpoints: (builder) => ({
    getAllNews: builder.query<News[], void>({
      query: () => "news",
      transformResponse: (response: ApiResponse<News[]>) => response.result,
      providesTags: ["News"],
    }),
    getNewsById: builder.query<News, number>({
      query: (id) => `news/${id}`,
      transformResponse: (response: ApiResponse<News>) => response.result,
      providesTags: ["News"],
    }),
    addNews: builder.mutation<News, FormData>({
      query: (formData) => ({
        url: "news",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<News>) => response.result,
      invalidatesTags: ["News"],
    }),
    updateNews: builder.mutation<News, { id: number; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `news/${id}`,
        method: "PUT",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<News>) => response.result,
      invalidatesTags: ["News"],
    }),

    deleteNews: builder.mutation<{ success: boolean }, number>({
      query: (newsID) => ({
        url: `news/${newsID}`,
        method: "DELETE",
      }),
      invalidatesTags: ["News"],
    }),
  }),
});

export const {
  useGetAllNewsQuery,
  useGetNewsByIdQuery,
  useAddNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
} = NewsApi;
