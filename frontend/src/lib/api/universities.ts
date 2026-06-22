import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";

export interface UniversityRead {
  id: number;
  name: string;
  short_name?: string | null;
  hemis_code?: string | null;
  region?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  student_count: number;
}

export interface UniversityListFilter {
  q?: string;
  region?: string;
  page?: number;
  page_size?: number;
}

export interface UniversityCreate {
  name: string;
  short_name?: string;
  hemis_code?: string;
  region?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export type UniversityUpdate = Partial<UniversityCreate>;

function buildParams(filters: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  }
  return p;
}

export const universitiesApi = {
  list: async (filters: UniversityListFilter = {}) => {
    const params = buildParams(filters as Record<string, unknown>);
    const res = await apiClient.get<PaginatedResponse<UniversityRead>>(
      `/universities?${params.toString()}`,
    );
    return res.data;
  },

  create: async (payload: UniversityCreate) => {
    const res = await apiClient.post<UniversityRead>("/universities", payload);
    return res.data;
  },

  update: async (id: number, payload: UniversityUpdate) => {
    const res = await apiClient.patch<UniversityRead>(`/universities/${id}`, payload);
    return res.data;
  },

  remove: async (id: number) => {
    await apiClient.delete(`/universities/${id}`);
  },
};
