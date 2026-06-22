import { apiClient } from "./client";
import type { HouseFilter, HouseListItem, PaginatedResponse, UserRole } from "./types";

export interface DashboardStats {
  total_users: number;
  total_students: number;
  total_landlords: number;
  total_curators: number;
  blocked_users: number;
  new_users_this_month: number;
  total_houses: number;
  pending_houses: number;
  approved_houses: number;
  rejected_houses: number;
  total_bookings: number;
  pending_bookings: number;
  active_bookings: number;
  ended_bookings: number;
  new_bookings_this_month: number;
  total_revenue: string;
  total_platform_fee: string;
  revenue_this_month: string;
}

export interface UserAdminRead {
  id: number;
  phone: string;
  role: UserRole;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_blocked: boolean;
  phone_verified_at?: string | null;
  last_login_at?: string | null;
  created_at: string;
}

export interface UserAdminListFilter {
  role?: UserRole;
  is_blocked?: boolean;
  is_verified?: boolean;
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

export interface MonthlyBucket {
  month: string;
  label: string;
}

export interface RevenuePoint extends MonthlyBucket {
  revenue: string;
  bookings: number;
  platform_fee: string;
}

export interface SignupPoint extends MonthlyBucket {
  students: number;
  landlords: number;
  curators: number;
  total: number;
}

export interface HousePoint extends MonthlyBucket {
  created: number;
  approved: number;
  rejected: number;
}

export interface TopUniversity {
  university_id: number;
  name: string;
  short_name?: string | null;
  student_count: number;
}

export interface TopRegion {
  region: string;
  house_count: number;
  booking_count: number;
}

export interface AnalyticsOverview {
  revenue_trend: RevenuePoint[];
  signup_trend: SignupPoint[];
  house_trend: HousePoint[];
  top_universities: TopUniversity[];
  top_regions: TopRegion[];
  avg_booking_amount: string;
  pro_landlords_count: number;
  active_pro_subscriptions: number;
}

export const adminApi = {
  stats: async () => {
    const res = await apiClient.get<DashboardStats>("/admin/stats");
    return res.data;
  },

  analyticsOverview: async () => {
    const res = await apiClient.get<AnalyticsOverview>("/admin/analytics/overview");
    return res.data;
  },

  listUsers: async (filters: UserAdminListFilter = {}) => {
    const params = buildParams(filters as Record<string, unknown>);
    const res = await apiClient.get<PaginatedResponse<UserAdminRead>>(
      `/admin/users?${params.toString()}`,
    );
    return res.data;
  },

  blockUser: async (userId: number, reason: string) => {
    const res = await apiClient.post<UserAdminRead>(`/admin/users/${userId}/block`, { reason });
    return res.data;
  },

  unblockUser: async (userId: number) => {
    const res = await apiClient.post<UserAdminRead>(`/admin/users/${userId}/unblock`);
    return res.data;
  },

  listHouses: async (filters: HouseFilter = {}) => {
    const params = buildParams(filters as Record<string, unknown>);
    const res = await apiClient.get<PaginatedResponse<HouseListItem>>(
      `/admin/houses?${params.toString()}`,
    );
    return res.data;
  },
};
