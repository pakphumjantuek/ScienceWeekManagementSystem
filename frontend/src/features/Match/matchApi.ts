import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { Match, MatchDrawLog } from "./type";

export const matchApi = createApi({
  reducerPath: "matchApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Match", "MatchDrawLog"],
  endpoints: (builder) => ({
    getAllMatch: builder.query<Match[], string>({
      query: (competitionLevelID) =>
        `match/competition-level/${competitionLevelID}/matches`,
      transformResponse: (response: ApiResponse<Match[]>) => response.result,
      providesTags: ["Match"],
    }),
    getMatchDrawLogs: builder.query<MatchDrawLog[], string>({
      query: (competitionLevelID) =>
        `match/competition-level/${competitionLevelID}/logs`,
      transformResponse: (response: ApiResponse<MatchDrawLog[]>) => response.result,
      providesTags: ["MatchDrawLog"],
    }),
    generateMatches: builder.mutation<
      Match[],
      { competitionLevelID: string; sampleSize?: number | null }
    >({
      query: ({ competitionLevelID, sampleSize }) => {
        const qs = sampleSize != null ? `?sampleSize=${sampleSize}` : "";
        return {
          url: `match/competition-level/${competitionLevelID}/generate${qs}`,
          method: "POST",
        };
      },
      invalidatesTags: ["Match", "MatchDrawLog"],
    }),
    nextRoundMatches: builder.mutation<string, string>({
      query: (competitionLevelID) => ({
        url: `match/competition-level/${competitionLevelID}/start-next-round`,
        method: "POST",
      }),
      invalidatesTags: ["Match", "MatchDrawLog"],
    }),
    rollbackMatchDrawLog: builder.mutation<string, number>({
      query: (logId) => ({
        url: `match/log/${logId}/rollback`,
        method: "POST",
      }),
      invalidatesTags: ["Match", "MatchDrawLog"],
    }),
    matchResult: builder.mutation<
      void,
      { matchId: string; winnerId: number; isEdit: boolean }
    >({
      query: ({ matchId, winnerId, isEdit }) => ({
        url: `match/match/${matchId}/submit`,
        method: "PUT",
        body: { winnerId, isEdit },
      }),
      invalidatesTags: ["Match"],
    }),
    cancelMatch: builder.mutation<
      { success: boolean },
      { competitionLevelID: string; roundNumber: string }
    >({
      query: ({ competitionLevelID, roundNumber }) => ({
        url: `match/competition-level/${competitionLevelID}/cancel-round/${roundNumber}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Match", "MatchDrawLog"],
    }),
  }),
});

export const {
  useGetAllMatchQuery,
  useGetMatchDrawLogsQuery,
  useGenerateMatchesMutation,
  useNextRoundMatchesMutation,
  useRollbackMatchDrawLogMutation,
  useMatchResultMutation,
  useCancelMatchMutation,
} = matchApi;