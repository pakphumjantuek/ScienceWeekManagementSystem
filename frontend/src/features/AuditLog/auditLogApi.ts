import { UserAdminApi } from "../UserAdmin/userAdminApi";
import type { ApiResponse } from "../../Interface/apiResponse";

export interface AuditLogItem {
  id: number;
  createdAt: string;
  actor: string | null;
  action: string;
  target: string | null;
  details: string | null;
  ipAddress: string | null;
}

export interface AuditLogPage {
  total: number;
  page: number;
  pageSize: number;
  items: AuditLogItem[];
}

export interface AuditLogQuery {
  from?: string;
  to?: string;
  action?: string;
  q?: string;
  page: number;
  pageSize: number;
}

// ใช้ api เดียวกับหน้าจัดการผู้ใช้ (ไม่ต้องลงทะเบียน reducer ใหม่ใน store)
export const auditLogApi = UserAdminApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<AuditLogPage, AuditLogQuery>({
      query: (params) => ({
        url: "AuditLogs",
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")),
        // ห้ามใช้ cache ของเบราว์เซอร์ (เคยเจอ 404 เก่าค้างจนหน้าโหลดไม่ขึ้น)
        cache: "no-store",
      }),
      transformResponse: (res: ApiResponse<AuditLogPage>) => res.result,
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditLogApi;
