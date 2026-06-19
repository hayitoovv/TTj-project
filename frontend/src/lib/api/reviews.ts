import { apiClient } from "./client";
import type { PaginatedResponse, ReviewCreateInput, ReviewRead } from "./types";

export interface ReviewListFilter {
  house_id?: number;
  target_user_id?: number;
  reviewer_id?: number;
  booking_id?: number;
  page?: number;
  page_size?: number;
}

function buildParams(filters: ReviewListFilter): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  }
  return p;
}

export const reviewsApi = {
  list: async (filters: ReviewListFilter = {}) => {
    const params = buildParams(filters);
    const res = await apiClient.get<PaginatedResponse<ReviewRead>>(
      `/reviews?${params.toString()}`,
    );
    return res.data;
  },

  create: async (payload: ReviewCreateInput) => {
    const res = await apiClient.post<ReviewRead>("/reviews", payload);
    return res.data;
  },

  remove: async (id: number) => {
    await apiClient.delete(`/reviews/${id}`);
  },
};
