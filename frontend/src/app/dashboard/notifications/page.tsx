"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  CreditCard,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/api/hooks";
import { notificationsApi } from "@/lib/api/notifications";
import type { NotificationType } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const ICONS: Record<NotificationType, LucideIcon> = {
  booking: ClipboardCheck,
  payment: CreditCard,
  message: MessageCircle,
  complaint: ShieldAlert,
  review: Star,
  system: Sparkles,
};

const COLORS: Record<NotificationType, string> = {
  booking: "bg-blue-100 text-blue-600",
  payment: "bg-green-100 text-green-600",
  message: "bg-purple-100 text-purple-600",
  complaint: "bg-red-100 text-red-600",
  review: "bg-yellow-100 text-yellow-700",
  system: "bg-gradient-to-br from-blue-500 to-yellow-400 text-white",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useNotifications({ page_size: 50 });
  const items = data?.items ?? [];
  const unread = items.filter((n) => !n.is_read).length;

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Bildirishnomalar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.total ?? 0} ta bildirishnoma · {unread} ta yangi
          </p>
        </div>
        {unread > 0 && (
          <Button onClick={() => markAll.mutate()} disabled={markAll.isPending} variant="outline">
            <CheckCheck className="h-4 w-4" />
            Barchasini o&apos;qildi
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-16 text-center">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">Hali bildirishnomalar yo&apos;q</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Yangi bron, sharh yoki tasdiqlashlar shu yerda paydo bo&apos;ladi.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            const colorClass = COLORS[n.type] ?? "bg-muted text-muted-foreground";
            const data = (n.data ?? {}) as Record<string, any>;
            const href = data.booking_id
              ? `/dashboard/bookings/${data.booking_id}`
              : data.house_id
                ? `/houses/${data.house_id}`
                : "#";

            return (
              <li key={n.id}>
                <Link
                  href={href}
                  onClick={() => !n.is_read && markRead.mutate(n.id)}
                  className={cn(
                    "flex items-start gap-4 rounded-2xl border bg-card p-4 transition hover:shadow-md",
                    !n.is_read && "border-l-4 border-l-blue-500 bg-blue-50/40",
                  )}
                >
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", colorClass)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">{n.title}</h3>
                      {!n.is_read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground/70">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
