import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "../../Interface/apiResponse";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { Student } from "./type";

export const StudentApi = createApi({
  reducerPath: "studentApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Student"],
  endpoints: (builder) => ({
    getAllStudent: builder.query<Student[], number>({
      query: (teamID) => ({
        url: "student",
        params: { teamID: teamID },
      }),
      transformResponse: (response: ApiResponse<Student[]>) => response.result,
      providesTags: ["Student"],
    }),
    addStudent: builder.mutation<Student, Partial<Student>>({
      query: (student) => ({
        url: "student",
        method: "POST",
        body: student,
      }),
      transformResponse: (response: any) => response.result,
      invalidatesTags: ["Student"],
    }),

    updateStudent: builder.mutation<Student, Student>({
      query: (student) => ({
        url: `student/${student.studentID}`,
        method: "PUT",
        body: student,
      }),
      transformResponse: (response: any) => response.result,
      invalidatesTags: ["Student"],
    }),
    deleteStudent: builder.mutation<{ success: boolean }, number>({
      query: (studentID) => ({
        url: `student/${studentID}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Student"],
    }),
  }),
});

export const {
  useGetAllStudentQuery,
  useAddStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = StudentApi;
