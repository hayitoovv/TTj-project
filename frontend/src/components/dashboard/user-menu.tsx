"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Crown, LayoutDashboard, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ProBadge } from "@/components/dashboard/pro-badge";
import { useSubscriptionStatus } from "@/lib/api/hooks";
import type { UserResponse } from "@/lib/api/types";
import { fullUploadUrl } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const ROLE_LABELS: Record<string, string> = {
  student: "Talaba",
  landlord: "Uy egasi",
  curator: "Kurator",
  admin: "Admin",
};

export function UserMenu({ user }: { user: UserResponse }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { data: subscriptionStatus } = useSubscriptionStatus();
  const isPro = Boolean(subscriptionStatus?.is_pro);

  const initial =
    (user.first_name?.[0] ?? user.last_name?.[0] ?? user.phone[user.phone.length - 1])
      ?.toString()
      .toUpperCase() ?? "U";
  const name =
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.phone;

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          className={cn(
            "group flex items-center gap-2 rounded-full border bg-card p-1 pr-3 transition hover:shadow-sm",
            isPro && "border-yellow-300 ring-1 ring-yellow-300/40",
          )}
        >
          <span className="relative">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fullUploadUrl(user.avatar_url) ?? user.avatar_url}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-yellow-400 text-xs font-bold text-white">
                {initial}
              </span>
            )}
            {isPro && (
              <span
                aria-label="PRO"
                className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 ring-2 ring-card"
              >
                <Crown className="h-2.5 w-2.5 text-foreground" />
              </span>
            )}
          </span>
          <span className="hidden items-center gap-1.5 text-sm font-medium md:inline-flex">
            {user.first_name || ROLE_LABELS[user.role]}
            {isPro && <ProBadge size="sm" />}
          </span>
        </button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={6}
          className={cn(
            "z-50 min-w-[220px] overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
          )}
        >
          <div className="flex items-center gap-2 px-3 py-3">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fullUploadUrl(user.avatar_url) ?? user.avatar_url}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-yellow-400 text-xs font-bold text-white">
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold">{name}</p>
                {isPro && <ProBadge size="sm" />}
              </div>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />
          <Item href="/dashboard" icon={LayoutDashboard}>
            Dashboard
          </Item>
          <Item href="/dashboard/profile" icon={User}>
            Profil
          </Item>
          <Item href="/dashboard/settings" icon={Settings}>
            Sozlamalar
          </Item>
          <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />
          <DropdownMenuPrimitive.Item
            onSelect={() => {
              logout();
              router.push("/");
            }}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive outline-none transition focus:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

function Item({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuPrimitive.Item asChild>
      <Link
        href={href}
        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition focus:bg-accent"
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
        {children}
      </Link>
    </DropdownMenuPrimitive.Item>
  );
}
