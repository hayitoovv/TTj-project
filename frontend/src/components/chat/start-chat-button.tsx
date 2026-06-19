"use client";

import axios from "axios";
import { Crown, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { chatsApi } from "@/lib/api/chats";
import { extractApiError, getAccessToken } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface StartChatButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  peerId: number;
  bookingId?: number | null;
  label?: string;
  fullWidth?: boolean;
  redirectTo?: string;
}

export function StartChatButton({
  peerId,
  bookingId,
  label = "Yozish",
  fullWidth = true,
  redirectTo = "/dashboard/messages",
  className,
  variant = "outline",
  size = "lg",
  ...rest
}: StartChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proGate, setProGate] = useState(false);

  const handleClick = async () => {
    setError(null);
    setProGate(false);
    if (!getAccessToken()) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const room = await chatsApi.createOrGetRoom({
        peer_id: peerId,
        booking_id: bookingId ?? null,
      });
      router.push(`${redirectTo}?room=${room.id}`);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 402) {
        setProGate(true);
      } else {
        setError(extractApiError(e));
      }
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        disabled={loading}
        variant={variant}
        size={size}
        className={cn(fullWidth && "w-full", className)}
        {...rest}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageSquare className="h-4 w-4" />
        )}
        {label}
      </Button>
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
      {proGate && (
        <div className="mt-2 rounded-xl border border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 p-3 text-sm">
          <p className="font-semibold text-foreground">Chat cheklovi</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Bepul rejada faqat 1 ta suhbat ochish mumkin. Yangi chat boshlash uchun PRO ga o&apos;ting.
          </p>
          <Link
            href="/dashboard/subscription"
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1.5 text-xs font-bold text-foreground shadow-sm transition hover:shadow-md"
          >
            <Crown className="h-3 w-3" />
            PRO ga o&apos;tish
          </Link>
        </div>
      )}
    </>
  );
}
