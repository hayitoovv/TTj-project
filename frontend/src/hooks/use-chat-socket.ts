"use client";

import { useEffect, useRef, useState } from "react";

import { getAccessToken } from "@/lib/api/client";
import { buildWsUrl, type ChatMessage } from "@/lib/api/chats";

export type WSEvent =
  | { type: "message"; data: ChatMessage }
  | { type: "typing"; data: { user_id: number } }
  | { type: "read"; data: { user_id: number } };

interface UseChatSocketOpts {
  roomId: number | null;
  onEvent: (ev: WSEvent) => void;
  enabled?: boolean;
}

export function useChatSocket({ roomId, onEvent, enabled = true }: UseChatSocketOpts) {
  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "open" | "closed">("idle");

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !roomId) return;
    let cancelled = false;

    const connect = () => {
      const token = getAccessToken();
      if (!token) {
        setStatus("closed");
        return;
      }
      setStatus("connecting");
      const ws = new WebSocket(buildWsUrl(roomId, token));
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        reconnectAttempts.current = 0;
        setStatus("open");
      };

      ws.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data) as WSEvent;
          onEventRef.current(payload);
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (cancelled) return;
        setStatus("closed");
        const attempt = Math.min(reconnectAttempts.current + 1, 6);
        reconnectAttempts.current = attempt;
        const delay = Math.min(1000 * 2 ** attempt, 15000);
        reconnectTimer.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      setStatus("idle");
    };
  }, [roomId, enabled]);

  const send = (payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  };

  return { status, send };
}
