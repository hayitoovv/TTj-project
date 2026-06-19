import { apiClient } from "./client";
import type { NotificationRead, NotificationType, PaginatedResponse } from "./types";

export interface NotificationListFilter {
  is_read?: boolean;
  type?: NotificationType;
  page?: number;
  page_size?: number;
}

function buildParams(filters: NotificationListFilter): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") p.append(k, String(v));
  }
  return p;
}

export const notificationsApi = {
  list: async (filters: NotificationListFilter = {}) => {
    const params = buildParams(filters);
    const res = await apiClient.get<PaginatedResponse<NotificationRead>>(
      `/notifications?${params.toString()}`,
    );
    return res.data;
  },

  unreadCount: async () => {
    const res = await apiClient.get<{ unread: number }>("/notifications/unread-count");
    return res.data.unread;
  },

  markRead: async (id: number) => {
    await apiClient.post(`/notifications/${id}/read`);
  },

  markAllRead: async () => {
    const res = await apiClient.post<{ updated: number }>("/notifications/mark-all-read");
    return res.data.updated;
  },
};
