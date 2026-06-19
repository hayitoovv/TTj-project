import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";

export interface StudentListItem {
  id: number;
  phone: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  is_blocked: boolean;
  is_verified: boolean;
  created_at: string;
  hemis_id?: string | null;
  university_id?: number | null;
  university_name?: string | null;
  university_short?: string | null;
  faculty?: string | null;
  course?: number | null;
  group_name?: string | null;
  active_bookings_count: number;
  total_bookings_count: number;
  open_complaints_count: number;
}

export interface StudentListFilter {
  university_id?: number;
  course?: number;
  is_blocked?: boolean;
  q?: string;
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

export const curatorApi = {
  listStudents: async (filters: StudentListFilter = {}) => {
    const params = buildParams(filters);
    const res = await apiClient.get<PaginatedResponse<StudentListItem>>(
      `/curator/students?${params.toString()}`,
    );
    return res.data;
  },
};
