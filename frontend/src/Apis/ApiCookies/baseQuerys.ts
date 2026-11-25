import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../Redux/store";
import { API_ORIGIN_URL } from "../../config";

const API_BASE = API_ORIGIN_URL;

export const rawBase = fetchBaseQuery({
  baseUrl: API_BASE,
  credentials: "include", // ส่งคุกกี้ไปด้วยทุกคำขอ
  // รองรับ error ที่เป็น text/plain (เช่น AntiforgeryValidationException)
  responseHandler: async (res) => {
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
  },
  prepareHeaders: (headers, { getState }) => {
    const t = (getState() as RootState).authCookies.csrfToken;
    if (t) headers.set("X-CSRF-Token", t); // header ต้องเป็น request token จาก /auth/csrf
    return headers;
  },
});
