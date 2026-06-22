import { apiClient } from "./client";
import type { BookingStatus, ComplaintStatus, PaginatedResponse } from "./types";

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

export interface StudentBookingSummary {
  id: number;
  house_id: number;
  house_title?: string | null;
  house_region?: string | null;
  start_date: string;
  end_date: string;
  monthly_price: string;
  currency: string;
  status: BookingStatus;
  created_at: string;
}

export interface StudentComplaintSummary {
  id: number;
  subject: string;
  status: ComplaintStatus;
  created_at: string;
  resolved_at?: string | null;
}

export interface CurrentLandlordInfo {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  phone: string;
  avatar_url?: string | null;
  is_pro: boolean;
  house_id: number;
  house_title?: string | null;
  booking_id: number;
  booking_start_date: string;
  booking_end_date: string;
}

export interface StudentDetail {
  id: number;
  phone: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  is_blocked: boolean;
  is_verified: boolean;
  last_login_at?: string | null;
  created_at: string;

  hemis_id?: string | null;
  university_id?: number | null;
  university_name?: string | null;
  university_short?: string | null;
  faculty?: string | null;
  course?: number | null;
  group_name?: string | null;
  gender?: "male" | "female" | null;
  birth_date?: string | null;

  active_bookings_count: number;
  total_bookings_count: number;
  open_complaints_count: number;
  total_complaints_count: number;
  total_spent: string;

  bookings: StudentBookingSummary[];
  complaints: StudentComplaintSummary[];
  current_landlord?: CurrentLandlordInfo | null;
}

function buildParams(filters: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  }
  return p;
}

export interface LandlordListItem {
  id: number;
  phone: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  is_blocked: boolean;
  is_verified: boolean;
  created_at: string;
  is_pro: boolean;
  is_verified_landlord: boolean;
  houses_count: number;
  active_bookings_count: number;
  open_complaints_count: number;
}

export interface LandlordListFilter {
  is_pro?: boolean;
  is_verified_landlord?: boolean;
  is_blocked?: boolean;
  q?: string;
  page?: number;
  page_size?: number;
}

export const curatorApi = {
  listStudents: async (filters: StudentListFilter = {}) => {
    const params = buildParams(filters);
    const res = await apiClient.get<PaginatedResponse<StudentListItem>>(
      `/curator/students?${params.toString()}`,
    );
    return res.data;
  },

  getStudent: async (id: number) => {
    const res = await apiClient.get<StudentDetail>(`/curator/students/${id}`);
    return res.data;
  },

  listLandlords: async (filters: LandlordListFilter = {}) => {
    const params = buildParams(filters as Record<string, unknown>);
    const res = await apiClient.get<PaginatedResponse<LandlordListItem>>(
      `/curator/landlords?${params.toString()}`,
    );
    return res.data;
  },
};
