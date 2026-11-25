import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";

type ResetPasswordBody = {
  userId: string;
  token: string;
  newPassword: string;
};

const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
  }),
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (userData) => ({
        url: "auth/register",
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: userData,
      }),
    }),
    loginUser: builder.mutation({
      query: (userCredentials) => ({
        url: "auth/login",
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: userCredentials,
      }),
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPasswordBody>({
      query: (body) => ({
        url: "auth/reset-password",
        method: "POST",
        body,
      }),
      transformResponse: (
        res: ApiResponse<{ message: string }> | { message: string }
      ) => (res as any)?.result ?? (res as { message: string }),
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useResetPasswordMutation,
} = authApi;
export default authApi;
