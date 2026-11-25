import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../../Apis/baseQuery";
import type { CertificateConfig } from "./type";
import type { ApiResponse } from "../../Interface/apiResponse";

export type SignatureRole = "UniversityDean" | "FacultyDean";
export type LogoRole = "UniversityLogo" | "InstituteLogo";

export const certificateApi = createApi({
  reducerPath: "certificateApi",
  baseQuery: customBaseQuery,
  tagTypes: ["CertificateConfig"],
  endpoints: (builder) => ({
    getCertificateConfig: builder.query<CertificateConfig | null, number>({
      query: (yearId) => `CertificateConfig/${yearId}/certificate-config`,
      transformResponse: (
        response: ApiResponse<CertificateConfig> | CertificateConfig | null
      ) => (response as any)?.result ?? (response as any) ?? null,
      providesTags: (_res, _err, yearId) => [
        { type: "CertificateConfig", id: yearId },
      ],
    }),

    // POST api/CertificateConfig/{yearId}/certificate-config
    addCertificateConfig: builder.mutation<
      CertificateConfig,
      CertificateConfig
    >({
      query: (config) => ({
        url: `CertificateConfig/${config.yearID}/certificate-config`,
        method: "POST",
        body: config,
      }),
      invalidatesTags: (_res, _err, config) => [
        { type: "CertificateConfig", id: config.yearID },
      ],
    }),

    // PUT api/CertificateConfig/{yearId}/certificate-config
    updateCertificateConfig: builder.mutation<
      CertificateConfig,
      CertificateConfig
    >({
      query: (config) => ({
        url: `CertificateConfig/${config.yearID}/certificate-config`,
        method: "PUT",
        body: config,
      }),
      invalidatesTags: (_res, _err, config) => [
        { type: "CertificateConfig", id: config.yearID },
      ],
    }),

    // POST api/CertificateConfig/background?yearId={id}
    uploadCertificateBackground: builder.mutation<
      string,
      { yearId: number; file: File }
    >({
      query: ({ yearId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `CertificateConfig/background?yearId=${yearId}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_res, _err, { yearId }) => [
        { type: "CertificateConfig", id: yearId },
      ],
    }),

    uploadSignature: builder.mutation<
      string,
      { yearId: number; role: SignatureRole; file: File }
    >({
      query: ({ yearId, role, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `CertificateConfig/signatures/${role}?yearId=${yearId}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_res, _err, { yearId }) => [
        { type: "CertificateConfig", id: yearId },
      ],
    }),
    uploadLogo: builder.mutation<
      string,
      { yearId: number; role: LogoRole; file: File }
    >({
      query: ({ yearId, role, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `CertificateConfig/logo/${role}?yearId=${yearId}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_res, _err, { yearId }) => [
        { type: "CertificateConfig", id: yearId },
      ],
    }),
  }),
});

export const {
  useGetCertificateConfigQuery,
  useAddCertificateConfigMutation,
  useUpdateCertificateConfigMutation,
  useUploadCertificateBackgroundMutation,
  useUploadSignatureMutation,
  useUploadLogoMutation,
} = certificateApi;
