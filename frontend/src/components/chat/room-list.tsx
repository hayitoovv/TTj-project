"use client";

import { Crown, MessageSquare } from "lucide-react";

import { ProBadge } from "@/components/dashboard/pro-badge";
import { fullUploadUrl } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";
import type { ChatRoom } from "@/lib/api/chats";

interface RoomListProps {
  rooms: ChatRoom[];
  activeRoomId: number | null;
  currentUserId: number;
  onSelect: (room: ChatRoom) => void;
  loading?: boolean;
}

const roleLabels: Record<string, string> = {
  student: "Talaba",
  landlord: "Uy egasi",
  curator: "Kurator",
  admin: "Admin",
};

function getPeer(room: ChatRoom, currentUserId: number) {
  return room.participants.find((p) => p.id !== currentUserId) ?? room.participants[0];
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  const diff = (today.getTime() - d.getTime()) / 86400000;
  if (diff < 7) return d.toLocaleDateString("uz-UZ", { weekday: "short" });
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" });
}

export function RoomList({ rooms, activeRoomId, currentUserId, onSelect, loading }: RoomListProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MessageSquare className="h-8 w-8" />
        </div>
        <div>
          <p className="font-semibold">Hali xabar yo'q</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Uy sahifasidan yoki bron kartochkasidan "Yozish" tugmasini bosing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {rooms.map((room) => {
        const peer = getPeer(room, currentUserId);
        const isActive = room.id === activeRoomId;
        const unread = room.unread_count ?? 0;
        const name = [peer?.first_name, peer?.last_name].filter(Boolean).join(" ") || "Foydalanuvchi";
        const avatar = fullUploadUrl(peer?.avatar_url ?? undefined);
        const initials = (peer?.first_name?.[0] ?? "?").toUpperCase();
        const peerIsPro = Boolean(peer?.is_pro);
        const preview = room.last_message?.content
          ? room.last_message.sender_id === currentUserId
            ? `Siz: ${room.last_message.content}`
            : room.last_message.content
          : "Yangi suhbat";

        return (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelect(room)}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/60",
              isActive && "bg-primary/5",
            )}
          >
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  "h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-primary/30 to-primary/10",
                  peerIsPro && "ring-2 ring-yellow-400",
                )}
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-base font-semibold text-primary">
                    {initials}
                  </div>
                )}
              </div>
              {peerIsPro && (
                <span
                  aria-label="PRO"
                  className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 ring-2 ring-card"
                >
                  <Crown className="h-3 w-3 text-foreground" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  {peerIsPro && <ProBadge size="sm" />}
                </div>
                <span className="flex-shrink-0 text-[11px] text-muted-foreground">
                  {formatTime(room.last_message_at ?? room.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs text-muted-foreground">
                  <span className="mr-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    {roleLabels[peer?.role ?? ""] ?? ""}
                  </span>
                  {preview}
                </p>
                {unread > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
