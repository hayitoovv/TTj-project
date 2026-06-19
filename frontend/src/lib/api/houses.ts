import { apiClient } from "./client";
import type {
  AmenityRead,
  HouseDetail,
  HouseFilter,
  HouseListItem,
  PaginatedResponse,
} from "./types";

function buildParams(filters: HouseFilter): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)));
    } else {
      params.append(key, String(value));
    }
  }
  return params;
}

export interface HouseCreateInput {
  title: string;
  description?: string;
  region?: string;
  district?: string;
  address: string;
  latitude: number;
  longitude: number;
  rooms: number;
  area_sqm?: number;
  max_tenants?: number;
  floor?: number;
  total_floors?: number;
  price_per_month: number;
  currency: "UZS" | "USD";
  deposit_amount?: number;
  amenity_ids?: number[];
  photo_urls?: string[];
}

export type HouseUpdateInput = Partial<HouseCreateInput>;

export const housesApi = {
  list: async (filters: HouseFilter = {}) => {
    const params = buildParams(filters);
    const res = await apiClient.get<PaginatedResponse<HouseListItem>>(
      `/houses?${params.toString()}`,
    );
    return res.data;
  },

  listMine: async (filters: HouseFilter = {}) => {
    const params = buildParams(filters);
    const res = await apiClient.get<PaginatedResponse<HouseListItem>>(
      `/houses/mine?${params.toString()}`,
    );
    return res.data;
  },

  detail: async (id: number) => {
    const res = await apiClient.get<HouseDetail>(`/houses/${id}`);
    return res.data;
  },

  create: async (payload: HouseCreateInput) => {
    const res = await apiClient.post<HouseDetail>("/houses", payload);
    return res.data;
  },

  update: async (id: number, payload: HouseUpdateInput) => {
    const res = await apiClient.patch<HouseDetail>(`/houses/${id}`, payload);
    return res.data;
  },

  remove: async (id: number) => {
    await apiClient.delete(`/houses/${id}`);
  },
};

export const amenitiesApi = {
  list: async () => {
    const res = await apiClient.get<AmenityRead[]>("/amenities");
    return res.data;
  },
};
