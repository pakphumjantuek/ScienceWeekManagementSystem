import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { SystemSetting } from "./type";
import type { ApiResponse } from "../../Interface/apiResponse";

export const systemSettingsApi = createApi({
  reducerPath: "systemSettingsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["SystemSettings"],
  endpoints: (builder) => ({
    getSystemSettings: builder.query<SystemSetting, void>({
      query: () => "SystemSettings",
      transformResponse: (response: ApiResponse<SystemSetting> | SystemSetting) => {
        return (response as ApiResponse<SystemSetting>)?.result ?? (response as SystemSetting);
      },
      providesTags: ["SystemSettings"],
    }),
    updateSystemSettings: builder.mutation<SystemSetting, FormData>({
      query: (formData) => ({
        url: "SystemSettings",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["SystemSettings"],
    }),
    setDisplayYear: builder.mutation<void, number>({
      query: (yearId) => ({ url: `SystemSettings/display-year/${yearId}`, method: "PUT" }),
      invalidatesTags: ["SystemSettings"],
    }),
    uploadAdminManual: builder.mutation<void, File>({
      query: (file) => {
        const body = new FormData();
        body.append("file", file);
        return { url: "AdminManual", method: "POST", body };
      },
      invalidatesTags: ["SystemSettings"],
    }),
    deleteAdminManual: builder.mutation<void, void>({
      query: () => ({ url: "AdminManual", method: "DELETE" }),
      invalidatesTags: ["SystemSettings"],
    }),
    uploadUserManual: builder.mutation<void, File>({
      query: (file) => {
        const body = new FormData();
        body.append("file", file);
        return { url: "UserManual", method: "POST", body };
      },
      invalidatesTags: ["SystemSettings"],
    }),
    deleteUserManual: builder.mutation<void, void>({
      query: () => ({ url: "UserManual", method: "DELETE" }),
      invalidatesTags: ["SystemSettings"],
    }),
  }),
});

export const {
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useSetDisplayYearMutation,
  useUploadAdminManualMutation,
  useDeleteAdminManualMutation,
  useUploadUserManualMutation,
  useDeleteUserManualMutation,
} = systemSettingsApi;
