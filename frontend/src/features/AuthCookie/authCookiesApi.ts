import { createApi } from "@reduxjs/toolkit/query/react";
import { rawBase } from "../../Apis/ApiCookies/baseQuerys";
import { setCsrfToken, setUser, type User } from "./authSlice";

type RegisterPayload = {
  email: string;
  password: string;
  displayName?: string | null;
};
type LoginPayload = { email: string; password: string };

export const authCookiesApi = createApi({
  reducerPath: "authCookiesApi",
  baseQuery: rawBase,
  endpoints: (b) => ({
    // 1) ขอ CSRF (ตั้งคุกกี้ XSRF-TOKEN + คืน {csrfToken})
    getCsrf: b.query<{ csrfToken: string }, void>({
      query: () => "/auth/csrf",
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // ถ้า server ส่ง text ตอน error, data จะเป็น string → ป้องกันไว้
          if (typeof data === "object" && data && "csrfToken" in data) {
            // @ts-ignore
            dispatch(setCsrfToken(data.csrfToken as string));
          }
        } catch {
          /* noop */
        }
      },
    }),

    // 2) Register / Login / Logout / Me
    register: b.mutation<User, RegisterPayload>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = (await queryFulfilled) as { data: User };
          dispatch(setUser(data));
          // หลัง auth สำเร็จ ควรขอ CSRF ใหม่เพื่อผูกกับ user ที่ล็อกอินแล้ว
          dispatch(authCookiesApi.endpoints.getCsrf.initiate());
        } catch {}
      },
    }),
    login: b.mutation<User, LoginPayload>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = (await queryFulfilled) as { data: User };
          dispatch(setUser(data));
          dispatch(authCookiesApi.endpoints.getCsrf.initiate());
        } catch {}
      },
    }),
    logout: b.mutation<{ message: string }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;

          // ✅ ทำเฉพาะเมื่อ logout สำเร็จ
          dispatch(setUser(null));
          dispatch(setCsrfToken(null));
          // @ts-ignore
          dispatch(authCookiesApi.util.resetApiState());
          // ขอ CSRF ใหม่สำหรับ anonymous
          dispatch(authCookiesApi.endpoints.getCsrf.initiate());
        } catch {
          // ❌ ถ้าล้มเหลว (เช่น 500 จากไม่มี CSRF) อย่าล้าง state ที่นี่
          // ปล่อยให้ผู้ใช้กดใหม่หลังจากเพจเรียก getCsrf ไปแล้ว
        }
      },
    }),

    me: b.query<User, void>({
      query: () => "/auth/me",
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = (await queryFulfilled) as { data: User };
          dispatch(setUser(data));
        } catch {}
      },
    }),
  }),
});

export const {
  useGetCsrfQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
} = authCookiesApi;
