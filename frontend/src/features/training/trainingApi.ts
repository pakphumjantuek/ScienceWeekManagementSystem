import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { Branch, TrainingTopic, TrainingRegistration, TrainingRegistrationPayload, TrainingRegistrationUpdatePayload } from "./type";
import type { ApiResponse } from "../../Interface/apiResponse";

export const trainingApi = createApi({
  reducerPath: "trainingApi",
  baseQuery: customBaseQuery,
  tagTypes: ["TrainingTopics", "TrainingRegistrations", "Branches"],
  endpoints: (builder) => ({
    // Branches
    getBranches: builder.query<Branch[], void>({
      query: () => "Branches",
      transformResponse: (response: ApiResponse<Branch[]> | Branch[]) => {
        return (response as ApiResponse<Branch[]>)?.result ?? (response as Branch[]);
      },
      providesTags: ["Branches"],
    }),
    createBranch: builder.mutation<Branch, Partial<Branch>>({
      query: (body) => ({
        url: "Branches",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Branches"],
    }),
    updateBranch: builder.mutation<Branch, { id: number; body: Partial<Branch> }>({
      query: ({ id, body }) => ({
        url: `Branches/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Branches"],
    }),
    deleteBranch: builder.mutation<string, number>({
      query: (id) => ({
        url: `Branches/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Branches"],
    }),

    // Training Topics
    getTrainingTopics: builder.query<TrainingTopic[], void>({
      query: () => "Trainingtopics",
      transformResponse: (response: ApiResponse<TrainingTopic[]> | TrainingTopic[]) => {
        return (response as ApiResponse<TrainingTopic[]>)?.result ?? (response as TrainingTopic[]);
      },
      providesTags: ["TrainingTopics"],
    }),
    getTrainingTopicById: builder.query<TrainingTopic, number>({
      query: (id) => `Trainingtopics/${id}`,
      transformResponse: (response: ApiResponse<TrainingTopic> | TrainingTopic) => {
        return (response as ApiResponse<TrainingTopic>)?.result ?? (response as TrainingTopic);
      },
      providesTags: (_result, _error, id) => [{ type: "TrainingTopics", id }],
    }),
    createTrainingTopic: builder.mutation<TrainingTopic, Partial<TrainingTopic>>({
      query: (body) => ({
        url: "Trainingtopics",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TrainingTopics"],
    }),
    copyTrainingYear: builder.mutation<{ copied: number; skipped: number }, { fromYearId: number; toYearId: number }>({
      query: (body) => ({ url: "Trainingtopics/copy-year", method: "POST", body }),
      transformResponse: (response: ApiResponse<{ copied: number; skipped: number }>) => response.result,
      invalidatesTags: ["TrainingTopics"],
    }),
    updateTrainingTopic: builder.mutation<TrainingTopic, { id: number; body: Partial<TrainingTopic> }>({
      query: ({ id, body }) => ({
        url: `Trainingtopics/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["TrainingTopics"],
    }),
    uploadTopicLineQr: builder.mutation<string, { id: number; file: File }>({
      query: ({ id, file }) => {
        const body = new FormData();
        body.append("file", file);
        return { url: `Trainingtopics/${id}/line-qr`, method: "POST", body };
      },
      invalidatesTags: ["TrainingTopics"],
    }),
    deleteTopicLineQr: builder.mutation<void, number>({
      query: (id) => ({ url: `Trainingtopics/${id}/line-qr`, method: "DELETE" }),
      invalidatesTags: ["TrainingTopics"],
    }),
    deleteTrainingTopic: builder.mutation<string, number>({
      query: (id) => ({
        url: `Trainingtopics/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TrainingTopics"],
    }),

    // Training Registrations
    getAllTrainingRegistrations: builder.query<TrainingRegistration[], number | void>({
      query: (topicId) => {
        const url = topicId ? `TrainingRegistrations?trainingtopicId=${topicId}` : "TrainingRegistrations";
        return url;
      },
      transformResponse: (response: ApiResponse<TrainingRegistration[]> | TrainingRegistration[]) => {
        return (response as ApiResponse<TrainingRegistration[]>)?.result ?? (response as TrainingRegistration[]);
      },
      providesTags: ["TrainingRegistrations"],
    }),
    getMyRegistrations: builder.query<TrainingRegistration[], void>({
      query: () => "TrainingRegistrations/my",
      transformResponse: (response: ApiResponse<TrainingRegistration[]> | TrainingRegistration[]) => {
        return (response as ApiResponse<TrainingRegistration[]>)?.result ?? (response as TrainingRegistration[]);
      },
      providesTags: ["TrainingRegistrations"],
    }),
    registerTraining: builder.mutation<TrainingRegistration, TrainingRegistrationPayload>({
      query: (body) => ({
        url: "TrainingRegistrations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TrainingRegistrations", "TrainingTopics"],
    }),
    updateRegistration: builder.mutation<TrainingRegistration, { id: number; body: TrainingRegistrationUpdatePayload }>({
      query: ({ id, body }) => ({
        url: `TrainingRegistrations/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["TrainingRegistrations"],
    }),
    cancelRegistration: builder.mutation<TrainingRegistration, number>({
      query: (id) => ({
        url: `TrainingRegistrations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TrainingRegistrations", "TrainingTopics"],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  useGetTrainingTopicsQuery,
  useGetTrainingTopicByIdQuery,
  useCreateTrainingTopicMutation,
  useUpdateTrainingTopicMutation,
  useCopyTrainingYearMutation,
  useDeleteTrainingTopicMutation,
  useUploadTopicLineQrMutation,
  useDeleteTopicLineQrMutation,
  useGetAllTrainingRegistrationsQuery,
  useGetMyRegistrationsQuery,
  useRegisterTrainingMutation,
  useUpdateRegistrationMutation,
  useCancelRegistrationMutation,
} = trainingApi;
