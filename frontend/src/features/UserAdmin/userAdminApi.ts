// src/features/UserAdmin/userAdminApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { UserAdmin, RoleOption } from "./type";

// ✅ ใช้ payload ตาม backend: { userName, role }
export type ChangeRolePayload = { userName: string; role: string };

type GenResetLinkResponse = {
  userId: string;
  resetUrl: string;
  expiresAt?: string;
};

export const UserAdminApi = createApi({
  reducerPath: "userAdmin",
  baseQuery: customBaseQuery,
  tagTypes: ["UserAdmin", "Roles"],
  endpoints: (builder) => ({
    getAllUserAdmin: builder.query<UserAdmin[], void>({
      query: () => "admin/users",
      transformResponse: (res: ApiResponse<UserAdmin[]> | UserAdmin[]) =>
        Array.isArray(res) ? res : (res.result as UserAdmin[]),
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({
                type: "UserAdmin" as const,
                // 🔑 backend เดิมมักไม่มี id → ใช้ userName เป็น key
                id: u.userName ?? u.email ?? "unknown",
              })),
              { type: "UserAdmin" as const, id: "LIST" },
            ]
          : [{ type: "UserAdmin" as const, id: "LIST" }],
    }),

    getAllRole: builder.query<RoleOption[], void>({
      query: () => "admin/users/roles",
      transformResponse: (res: ApiResponse<RoleOption[]> | RoleOption[]) =>
        Array.isArray(res) ? res : (res.result as RoleOption[]),
      providesTags: ["Roles"],
    }),

    // ✅ เปลี่ยน role แบบตรงกับ backend:
    // PUT /api/admin/users/{userName}/role/{rolฟe}  (ไม่มี body)
    changeUserRole: builder.mutation<
      UserAdmin,
      { userName: string; role: string }
    >({
      query: ({ userName, role }) => ({
        url: `admin/users/${encodeURIComponent(userName)}/role`,
        method: "PUT",
        body: { newRole: role }, // <<< ต้องใช้ newRole
      }),
      transformResponse: (res: ApiResponse<UserAdmin> | UserAdmin) =>
        (res as any)?.result ?? (res as UserAdmin),
      invalidatesTags: (result) => [
        {
          type: "UserAdmin",
          id: result?.userName ?? result?.email ?? "unknown",
        },
        { type: "UserAdmin", id: "LIST" },
      ],
    }),
    setUserSuspended: builder.mutation<void, { userName: string; suspended: boolean }>({
      query: ({ userName, suspended }) => ({
        url: `admin/users/${encodeURIComponent(userName)}/suspend`,
        method: "PUT",
        body: { suspended },
      }),
      invalidatesTags: [{ type: "UserAdmin", id: "LIST" }],
    }),
    generateResetLink: builder.mutation<
      GenResetLinkResponse,
      { userName: string; clientBaseUrl: string }
    >({
      query: ({ userName, clientBaseUrl }) => ({
        url: `admin/users/${encodeURIComponent(userName)}/reset-password-link`,
        method: "POST",
        body: { clientBaseUrl },
      }),
      transformResponse: (
        res: ApiResponse<GenResetLinkResponse> | GenResetLinkResponse
      ) => (res as any)?.result ?? (res as GenResetLinkResponse),
    }),
  }),
});

export const {
  useGetAllUserAdminQuery,
  useGetAllRoleQuery,
  useChangeUserRoleMutation,
  useGenerateResetLinkMutation,
  useSetUserSuspendedMutation,
} = UserAdminApi;
