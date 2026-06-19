"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  CreditCard,
  HomeIcon,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { useNotifications, useUnreadCount } from "@/lib/api/hooks";
import { notificationsApi } from "@/lib/api/notifications";
import type { NotificationRead, NotificationType } from "@/lib/api/types";
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

interface NotificationBellProps {
  enabled: boolean;
}

export function NotificationBell({ enabled }: NotificationBellProps) {
  const queryClient = useQueryClient();
  const { data: unread = 0 } = useUnreadCount(enabled);
  const { data: list, isLoading } = useNotifications({ page_size: 10 }, enabled);

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (!enabled) return null;

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Bildirishnomalar"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 w-[380px] max-w-[95vw] overflow-hidden rounded-2xl border bg-popover shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h3 className="font-semibold">Bildirishnomalar</h3>
              {unread > 0 && (
                <p className="text-xs text-muted-foreground">
                  {unread} ta yangi
                </p>
              )}
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="inline-flex items-center gap-1 rounded-md text-xs font-semibold text-primary transition hover:underline disabled:opacity-50"
              >
                <CheckCheck className="h-3 w-3" />
                Barchasini o&apos;qildi deb belgilash
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : !list?.items.length ? (
              <div className="py-12 text-center">
                <Bell className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Hali bildirishnomalar yo&apos;q
                </p>
              </div>
            ) : (
              <ul>
                {list.items.map((n) => (
                  <NotificationItem key={n.id} notification={n} />
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {list && list.items.length > 0 && (
            <div className="border-t px-4 py-2 text-center">
              <Link
                href="/dashboard/notifications"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Hammasini ko&apos;rish →
              </Link>
            </div>
          )}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

function NotificationItem({ notification }: { notification: NotificationRead }) {
  const Icon = ICONS[notification.type] ?? Bell;
  const colorClass = COLORS[notification.type] ?? "bg-muted text-muted-foreground";
  const queryClient = useQueryClient();

  const data = notification.data ?? {};
  const bookingId = (data as any).booking_id;
  const houseId = (data as any).house_id;
  const href = bookingId
    ? `/dashboard/bookings/${bookingId}`
    : houseId
      ? `/houses/${houseId}`
      : "/dashboard/notifications";

  const handleClick = () => {
    if (!notification.is_read) {
      notificationsApi
        .markRead(notification.id)
        .then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }));
    }
  };

  return (
    <li>
      <DropdownMenuPrimitive.Item asChild>
        <Link
          href={href}
          onClick={handleClick}
          className={cn(
            "flex cursor-pointer items-start gap-3 px-4 py-3 outline-none transition focus:bg-accent",
            !notification.is_read && "bg-blue-50/50",
          )}
        >
          <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", colorClass)}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-tight">{notification.title}</p>
              {!notification.is_read && (
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {notification.body}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </p>
          </div>
        </Link>
      </DropdownMenuPrimitive.Item>
    </li>
  );
}
