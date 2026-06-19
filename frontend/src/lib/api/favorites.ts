import { apiClient } from "./client";
import type { HouseFilter, HouseListItem, PaginatedResponse } from "./types";

function buildParams(filters: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  }
  return p;
}

export const favoritesApi = {
  list: async (filters: HouseFilter = {}) => {
    const params = buildParams(filters as Record<string, unknown>);
    const res = await apiClient.get<PaginatedResponse<HouseListItem>>(
      `/favorites?${params.toString()}`,
    );
    return res.data;
  },

  add: async (houseId: number) => {
    await apiClient.post(`/favorites/${houseId}`);
  },

  remove: async (houseId: number) => {
    await apiClient.delete(`/favorites/${houseId}`);
  },
};
