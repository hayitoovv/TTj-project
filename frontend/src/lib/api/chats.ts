import { apiClient } from "./client";

export type ChatRoomType =
  | "student_landlord"
  | "student_curator"
  | "landlord_curator"
  | "group";

export type UserRole = "student" | "landlord" | "curator" | "admin";

export interface ChatParticipant {
  id: number;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_pro?: boolean;
}

export interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: number;
  content: string;
  attachment_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ChatRoom {
  id: number;
  type: ChatRoomType;
  booking_id: number | null;
  last_message_at: string | null;
  created_at: string;
  participants: ChatParticipant[];
  last_message?: ChatMessage | null;
  unread_count?: number;
}

export interface CreateRoomPayload {
  peer_id: number;
  booking_id?: number | null;
  initial_message?: string | null;
}

export const chatsApi = {
  listRooms: async (): Promise<ChatRoom[]> => {
    const res = await apiClient.get<ChatRoom[]>("/chats/rooms");
    return res.data;
  },

  createOrGetRoom: async (payload: CreateRoomPayload): Promise<ChatRoom> => {
    const res = await apiClient.post<ChatRoom>("/chats/rooms", payload);
    return res.data;
  },

  getRoom: async (roomId: number): Promise<ChatRoom> => {
    const res = await apiClient.get<ChatRoom>(`/chats/rooms/${roomId}`);
    return res.data;
  },

  listMessages: async (
    roomId: number,
    opts: { before_id?: number; limit?: number } = {},
  ): Promise<ChatMessage[]> => {
    const params = new URLSearchParams();
    if (opts.before_id) params.set("before_id", String(opts.before_id));
    if (opts.limit) params.set("limit", String(opts.limit));
    const qs = params.toString();
    const res = await apiClient.get<ChatMessage[]>(
      `/chats/rooms/${roomId}/messages${qs ? `?${qs}` : ""}`,
    );
    return res.data;
  },

  sendMessage: async (
    roomId: number,
    content: string,
    attachment_url?: string,
  ): Promise<ChatMessage> => {
    const res = await apiClient.post<ChatMessage>(
      `/chats/rooms/${roomId}/messages`,
      { content, attachment_url: attachment_url ?? null },
    );
    return res.data;
  },

  markRead: async (roomId: number): Promise<void> => {
    await apiClient.post(`/chats/rooms/${roomId}/read`);
  },

  unreadCount: async (): Promise<number> => {
    const res = await apiClient.get<{ unread: number }>("/chats/unread-count");
    return res.data.unread;
  },
};

export function buildWsUrl(roomId: number, token: string): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  const wsUrl = apiUrl.replace(/^http/, "ws");
  return `${wsUrl}/chats/ws/${roomId}?token=${encodeURIComponent(token)}`;
}
