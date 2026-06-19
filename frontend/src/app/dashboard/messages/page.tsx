"use client";

import { Loader2, MessageSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { ChatPanel } from "@/components/chat/chat-panel";
import { RoomList } from "@/components/chat/room-list";
import { chatsApi, type ChatMessage, type ChatRoom } from "@/lib/api/chats";
import { extractApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const queryRoomId = searchParams.get("room");

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatsApi.listRooms();
      setRooms(data);
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Open room from ?room=<id>
  useEffect(() => {
    if (queryRoomId) {
      const id = Number(queryRoomId);
      if (!Number.isNaN(id)) setActiveRoomId(id);
    }
  }, [queryRoomId]);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) ?? null,
    [rooms, activeRoomId],
  );

  const handleSelect = (room: ChatRoom) => {
    setActiveRoomId(room.id);
  };

  const handleRoomRead = useCallback((roomId: number) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, unread_count: 0 } : r)),
    );
  }, []);

  const handleMessageSent = useCallback((msg: ChatMessage) => {
    setRooms((prev) => {
      const updated = prev.map((r) =>
        r.id === msg.room_id
          ? { ...r, last_message: msg, last_message_at: msg.created_at }
          : r,
      );
      updated.sort((a, b) => {
        const aTime = new Date(a.last_message_at ?? a.created_at).getTime();
        const bTime = new Date(b.last_message_at ?? b.created_at).getTime();
        return bTime - aTime;
      });
      return updated;
    });
  }, []);

  if (!user) return null;

  return (
    <div className="-mx-4 -my-6 md:-mx-8 md:-my-8">
      <div className="flex h-[calc(100vh-64px)] overflow-hidden border-t bg-background">
        {/* Sidebar */}
        <aside
          className={cn(
            "w-full overflow-y-auto border-r bg-card md:w-80 md:flex-shrink-0",
            activeRoom ? "hidden md:block" : "block",
          )}
        >
          <div className="sticky top-0 z-10 border-b bg-card px-4 py-3">
            <h1 className="text-lg font-bold">Xabarlar</h1>
            <p className="text-xs text-muted-foreground">
              {rooms.length > 0 ? `${rooms.length} ta suhbat` : "Suhbatlar ro'yxati"}
            </p>
          </div>
          {error ? (
            <div className="p-4">
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            </div>
          ) : (
            <RoomList
              rooms={rooms}
              activeRoomId={activeRoomId}
              currentUserId={user.id}
              onSelect={handleSelect}
              loading={loading}
            />
          )}
        </aside>

        {/* Chat panel */}
        <section
          className={cn(
            "flex-1 overflow-hidden",
            activeRoom ? "block" : "hidden md:block",
          )}
        >
          {activeRoom ? (
            <ChatPanel
              key={activeRoom.id}
              room={activeRoom}
              currentUserId={user.id}
              onBack={() => setActiveRoomId(null)}
              onRoomRead={handleRoomRead}
              onMessageSent={handleMessageSent}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-muted/20 to-background p-8 text-center">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MessageSquare className="h-10 w-10" />
                  </div>
                  <h2 className="text-xl font-bold">Suhbat tanlang</h2>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Chap tomondan suhbatni tanlang yoki uy sahifasidan "Yozish"
                    tugmasi orqali yangi suhbat boshlang
                  </p>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
