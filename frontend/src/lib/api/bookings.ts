import { apiClient } from "./client";
import type {
  BookingCreate,
  BookingDetail,
  BookingListItem,
  BookingStatus,
  PaginatedResponse,
} from "./types";

export interface BookingListFilter {
  status?: BookingStatus;
  house_id?: number;
  page?: number;
  page_size?: number;
}

export interface BookingFeeEstimate {
  days: number;
  monthly_price: string;
  currency: "UZS" | "USD";
  total_rent: string;
  platform_fee: string;
  service_fee: string;
  total_amount: string;
}

function buildParams(filters: BookingListFilter): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") params.append(key, String(value));
  }
  return params;
}

export const bookingsApi = {
  list: async (filters: BookingListFilter = {}) => {
    const params = buildParams(filters);
    const res = await apiClient.get<PaginatedResponse<BookingListItem>>(
      `/bookings?${params.toString()}`,
    );
    return res.data;
  },

  detail: async (id: number) => {
    const res = await apiClient.get<BookingDetail>(`/bookings/${id}`);
    return res.data;
  },

  create: async (payload: BookingCreate) => {
    const res = await apiClient.post<BookingDetail>("/bookings", payload);
    return res.data;
  },

  estimate: async (house_id: number, start_date: string, end_date: string) => {
    const params = new URLSearchParams({
      house_id: String(house_id),
      start_date,
      end_date,
    });
    const res = await apiClient.get<BookingFeeEstimate>(`/bookings/estimate?${params.toString()}`);
    return res.data;
  },

  confirm: async (id: number) => {
    const res = await apiClient.post<BookingDetail>(`/bookings/${id}/confirm`);
    return res.data;
  },

  reject: async (id: number, reason: string) => {
    const res = await apiClient.post<BookingDetail>(`/bookings/${id}/reject`, { reason });
    return res.data;
  },

  cancel: async (id: number, reason: string) => {
    const res = await apiClient.post<BookingDetail>(`/bookings/${id}/cancel`, { reason });
    return res.data;
  },

  acceptContract: async (id: number) => {
    const res = await apiClient.post<BookingDetail>(`/bookings/${id}/accept-contract`);
    return res.data;
  },

  pay: async (id: number, gateway: "click" | "payme" | "uzum" | "paynet" = "click") => {
    const res = await apiClient.post<BookingDetail>(`/bookings/${id}/pay`, { gateway });
    return res.data;
  },
};
