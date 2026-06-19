import { apiClient } from "./client";
import type {
  ComplaintAgainstType,
  ComplaintCreateInput,
  ComplaintRead,
  ComplaintStatus,
  PaginatedResponse,
} from "./types";

export interface ComplaintListFilter {
  status?: ComplaintStatus;
  against_type?: ComplaintAgainstType;
  page?: number;
  page_size?: number;
}

function buildParams(filters: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  }
  return p;
}

export const complaintsApi = {
  list: async (filters: ComplaintListFilter = {}) => {
    const params = buildParams(filters);
    const res = await apiClient.get<PaginatedResponse<ComplaintRead>>(
      `/complaints?${params.toString()}`,
    );
    return res.data;
  },

  detail: async (id: number) => {
    const res = await apiClient.get<ComplaintRead>(`/complaints/${id}`);
    return res.data;
  },

  create: async (payload: ComplaintCreateInput) => {
    const res = await apiClient.post<ComplaintRead>("/complaints", payload);
    return res.data;
  },

  process: async (id: number) => {
    const res = await apiClient.post<ComplaintRead>(`/complaints/${id}/process`);
    return res.data;
  },

  resolve: async (id: number, resolution: string) => {
    const res = await apiClient.post<ComplaintRead>(`/complaints/${id}/resolve`, { resolution });
    return res.data;
  },
};
