import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { DashboardReport } from "./type";

export const ReportApi = createApi({
  reducerPath: "reportApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Report"],
  endpoints: (builder) => ({
    getDashboardReport: builder.query<DashboardReport, number | void>({
      query: (yearId) => ({
        url: "report/dashboard",
        params: yearId ? { yearId } : undefined,
      }),
      providesTags: ["Report"],
    }),
  }),
});

export const { useGetDashboardReportQuery } = ReportApi;
