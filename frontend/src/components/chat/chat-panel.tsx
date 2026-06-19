"use client";

import { ArrowLeft, Crown, Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ProBadge } from "@/components/dashboard/pro-badge";
import { Button } from "@/components/ui/button";
import { useChatSocket, type WSEvent } from "@/hooks/use-chat-socket";
import { chatsApi, type ChatMessage, type ChatRoom } from "@/lib/api/chats";
import { extractApiError } from "@/lib/api/client";
import { fullUploadUrl } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  room: ChatRoom;
  currentUserId: number;
  onBack?: () => void;
  onMessageSent?: (msg: ChatMessage) => void;
  onRoomRead?: (roomId: number) => void;
}

const roleLabels: Record<string, string> = {
  student: "Talaba",
  landlord: "Uy egasi",
  curator: "Kurator",
  admin: "Admin",
};

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

function formatDateHeader(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Bugun";
  if (d.toDateString() === yest.toDateString()) return "Kecha";
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" });
}

export function ChatPanel({ room, currentUserId, onBack, onMessageSent, onRoomRead }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const peer = useMemo(
    () => room.participants.find((p) => p.id !== currentUserId) ?? room.participants[0],
    [room, currentUserId],
  );
  const peerName = [peer?.first_name, peer?.last_name].filter(Boolean).join(" ") || "Foydalanuvchi";
  const avatar = fullUploadUrl(peer?.avatar_url ?? undefined);
  const initials = (peer?.first_name?.[0] ?? "?").toUpperCase();
  const peerIsPro = Boolean(peer?.is_pro);

  // Initial messages
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    chatsApi
      .listMessages(room.id, { limit: 50 })
      .then((data) => {
        if (cancelled) return;
        setMessages(data);
      })
      .catch((e) => {
        if (!cancelled) setError(extractApiError(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    chatsApi.markRead(room.id).then(() => onRoomRead?.(room.id)).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [room.id, onRoomRead]);

  const handleEvent = useCallback(
    (ev: WSEvent) => {
      if (ev.type === "message") {
        setMessages((prev) => {
          if (prev.some((m) => m.id === ev.data.id)) return prev;
          return [...prev, ev.data];
        });
        if (ev.data.sender_id !== currentUserId) {
          chatsApi.markRead(room.id).then(() => onRoomRead?.(room.id)).catch(() => {});
        } else {
          onMessageSent?.(ev.data);
        }
      } else if (ev.type === "typing") {
        if (ev.data.user_id !== currentUserId) {
          setPeerTyping(true);
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setPeerTyping(false), 2500);
        }
      } else if (ev.type === "read") {
        if (ev.data.user_id !== currentUserId) {
          setMessages((prev) =>
            prev.map((m) => (m.sender_id === currentUserId ? { ...m, is_read: true } : m)),
          );
        }
      }
    },
    [currentUserId, room.id, onRoomRead, onMessageSent],
  );

  const { status, send } = useChatSocket({ roomId: room.id, onEvent: handleEvent });

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, peerTyping]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    try {
      if (status === "open") {
        send({ type: "message", content });
        setDraft("");
      } else {
        const msg = await chatsApi.sendMessage(room.id, content);
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        onMessageSent?.(msg);
        setDraft("");
      }
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (status === "open") send({ type: "typing" });
  };

  // Group messages by day
  const grouped = useMemo(() => {
    const groups: { date: string; items: ChatMessage[] }[] = [];
    for (const m of messages) {
      const day = formatDateHeader(m.created_at);
      const last = groups[groups.length - 1];
      if (last && last.date === day) last.items.push(m);
      else groups.push({ date: day, items: [m] });
    }
    return groups;
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-card px-4 py-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted md:hidden"
            aria-label="Orqaga"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              "h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-primary/30 to-primary/10",
              peerIsPro && "ring-2 ring-yellow-400",
            )}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">
                {initials}
              </div>
            )}
          </div>
          {peerIsPro && (
            <span
              aria-label="PRO"
              className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 ring-2 ring-card"
            >
              <Crown className="h-2.5 w-2.5 text-foreground" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold">{peerName}</p>
            {peerIsPro && <ProBadge size="sm" />}
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            <span className="mr-1.5 uppercase tracking-wide">
              {roleLabels[peer?.role ?? ""] ?? ""}
            </span>
            {status === "open" ? (
              <span className="text-emerald-600">● onlayn</span>
            ) : status === "connecting" ? (
              "ulanmoqda…"
            ) : (
              "oflayn"
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-gradient-to-b from-muted/20 to-background px-4 py-4"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Hali xabar yo'q. Birinchi bo'ling!</p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {grouped.map((group) => (
              <div key={group.date} className="space-y-2">
                <div className="flex justify-center">
                  <span className="rounded-full bg-card px-3 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm">
                    {group.date}
                  </span>
                </div>
                {group.items.map((m, idx) => {
                  const mine = m.sender_id === currentUserId;
                  const prev = group.items[idx - 1];
                  const sameAuthor = prev && prev.sender_id === m.sender_id;
                  return (
                    <div
                      key={m.id}
                      className={cn("flex", mine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-foreground",
                          sameAuthor && (mine ? "rounded-tr-md" : "rounded-tl-md"),
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <div
                          className={cn(
                            "mt-1 flex items-center gap-1 text-[10px]",
                            mine ? "text-primary-foreground/70" : "text-muted-foreground",
                          )}
                        >
                          <span>{formatMessageTime(m.created_at)}</span>
                          {mine && (
                            <span className="ml-1">{m.is_read ? "✓✓" : "✓"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {peerTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-card px-3.5 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-card p-3">
        {error && (
          <p className="mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
            {error}
          </p>
        )}
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Xabar yozing…"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="h-10 w-10 flex-shrink-0 rounded-full"
            aria-label="Yuborish"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
