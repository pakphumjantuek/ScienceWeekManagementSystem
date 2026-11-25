import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { Role } from "./type";

export const RoleApi = createApi({
  reducerPath: "role",
  baseQuery: customBaseQuery,
  tagTypes: ["Role"],
  endpoints: (builder) => ({
    getAllRole: builder.query<Role[], void>({
      query: () => "role",
      transformResponse: (response: ApiResponse<Role[]>) => response.result,
      providesTags: ["Role"],
    }),
    addRole: builder.mutation<Role, Partial<Role>>({
      query: (role) => ({
        url: "role",
        method: "POST",
        body: role,
      }),
      invalidatesTags: ["Role"],
    }),
    updateRole: builder.mutation<Role, Role>({
      query: (role) => ({
        url: `role/${role.id}`,
        method: "PUT",
        body: role,
      }),
      invalidatesTags: ["Role"],
    }),
    deleteRole: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `role/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),
  }),
});

export const {
  useGetAllRoleQuery,
  useAddRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = RoleApi;
