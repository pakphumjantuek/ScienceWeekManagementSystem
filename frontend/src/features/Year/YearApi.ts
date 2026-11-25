// YearApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { Year } from "./type";

export type CloneYearRequest = {
  sourceYearId: number;
  newYearNumber: number;
  newYearName: string;

  // ตัวเลือกฝั่ง client (จะส่งไปเซิร์ฟเวอร์ตามที่ล็อกไว้แล้วว่าไม่ก็อปทีม)
  copyCertificateBackgroundFile?: boolean;
  copyCertificateConfig?: boolean;
  resetCertificateStartNumberToOne?: boolean;
  copyCompetitionYears?: boolean;
  copyCompetitionLevels?: boolean;
  copyAwards?: boolean;
  copyTeams?: boolean; // ไม่ก็อปทีม -> false
  copyMatches?: boolean; // ไม่ก็อปแมตช์ -> false
};

export const YearApi = createApi({
  reducerPath: "yearApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Year"],
  endpoints: (builder) => ({
    getAllYear: builder.query<Year[], void>({
      query: () => "year",
      transformResponse: (response: ApiResponse<Year[]>) => response.result,
      providesTags: ["Year"],
    }),
    addYear: builder.mutation<Year, Partial<Year>>({
      query: (team) => ({
        url: "year",
        method: "POST",
        body: team,
      }),
      invalidatesTags: ["Year"],
    }),
    updateYear: builder.mutation<Year, Year>({
      query: (team) => ({
        url: `year/${team.yearID}`,
        method: "PUT",
        body: team,
      }),
      invalidatesTags: ["Year"],
    }),
    deleteYear: builder.mutation<{ success: boolean }, number>({
      query: (yearId) => ({
        url: `year/${yearId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Year"],
    }),
    teamcertificateNumber: builder.mutation<number, { yearId: number }>({
      query: ({ yearId }) => ({
        url: `year/teamcertificateNumber/${yearId}`,
        method: "POST",
      }),
      invalidatesTags: ["Year"],
    }),

    cloneYear: builder.mutation<Year, CloneYearRequest>({
      query: (body) => ({
        url: `year/${body.sourceYearId}/clone`,
        method: "POST",
        body: {
          sourceYearId: body.sourceYearId,
          newYearNumber: body.newYearNumber,
          newYearName: body.newYearName,
          copyCertificateBackgroundFile:
            body.copyCertificateBackgroundFile ?? true,
          copyCertificateConfig: body.copyCertificateConfig ?? true,
          resetCertificateStartNumberToOne:
            body.resetCertificateStartNumberToOne ?? true,
          copyCompetitionYears: body.copyCompetitionYears ?? true,
          copyCompetitionLevels: body.copyCompetitionLevels ?? true,
          copyAwards: body.copyAwards ?? true,
          copyTeams: false,
          copyMatches: false,
        },
      }),
      invalidatesTags: ["Year"],
    }),
  }),
});

export const {
  useGetAllYearQuery,
  useAddYearMutation,
  useUpdateYearMutation,
  useDeleteYearMutation,
  useTeamcertificateNumberMutation,
  useCloneYearMutation, // ⬅️ export hook
} = YearApi;
