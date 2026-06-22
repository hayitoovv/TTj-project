"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  GraduationCap,
  Heart,
  Home,
  LayoutDashboard,
  type LucideIcon,
  MessageCircle,
  Settings,
  ShieldAlert,
  Star,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { chatsApi } from "@/lib/api/chats";
import { useSubscriptionStatus } from "@/lib/api/hooks";
import type { UserRole } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: Record<UserRole, NavItem[]> = {
  student: [
    { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
    { href: "/dashboard/bookings", label: "Mening bronlarim", icon: ClipboardList },
    { href: "/dashboard/saved", label: "Saqlangan uylar", icon: Heart },
    { href: "/dashboard/payments", label: "To'lovlar", icon: CreditCard },
    { href: "/dashboard/reviews", label: "Sharhlar", icon: Star },
    { href: "/dashboard/complaints", label: "Shikoyatlar", icon: ShieldAlert },
    { href: "/dashboard/messages", label: "Xabarlar", icon: MessageCircle },
    { href: "/dashboard/profile", label: "Profil", icon: User },
  ],
  landlord: [
    { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
    { href: "/dashboard/houses", label: "Mening uylarim", icon: Home },
    { href: "/dashboard/bookings", label: "Bronlar", icon: ClipboardList },
    { href: "/dashboard/payments", label: "Daromad", icon: CreditCard },
    { href: "/dashboard/messages", label: "Xabarlar", icon: MessageCircle },
    { href: "/dashboard/profile", label: "Profil", icon: User },
  ],
  curator: [
    { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
    { href: "/dashboard/students", label: "Talabalar", icon: Users },
    { href: "/dashboard/landlords", label: "Uy egalari", icon: Home },
    { href: "/dashboard/complaints", label: "Shikoyatlar", icon: ShieldAlert },
    { href: "/dashboard/messages", label: "Xabarlar", icon: MessageCircle },
    { href: "/dashboard/profile", label: "Profil", icon: User },
  ],
  admin: [
    { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
    { href: "/dashboard/analytics", label: "Analitika", icon: BarChart3 },
    { href: "/dashboard/users", label: "Foydalanuvchilar", icon: Users },
    { href: "/dashboard/universities", label: "Universitetlar", icon: GraduationCap },
    { href: "/dashboard/houses", label: "Uylar", icon: Home },
    { href: "/dashboard/bookings", label: "Bronlar", icon: ClipboardList },
    { href: "/dashboard/payments", label: "To'lovlar", icon: CreditCard },
    { href: "/dashboard/complaints", label: "Shikoyatlar", icon: ShieldAlert },
    { href: "/dashboard/settings", label: "Sozlamalar", icon: Settings },
  ],
};

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV[role];

  const { data: unreadChat } = useQuery({
    queryKey: ["chat-unread"],
    queryFn: () => chatsApi.unreadCount(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const canSubscribe = role === "student" || role === "landlord";
  const { data: subscriptionStatus } = useSubscriptionStatus(canSubscribe);
  const showProPromo = canSubscribe && !subscriptionStatus?.is_pro;

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/20 lg:block">
      <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <div className="mb-3 px-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Boshqaruv
          </p>
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/dashboard/messages" && unreadChat && unreadChat > 0 ? (
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                      active
                        ? "bg-white text-primary"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {unreadChat > 99 ? "99+" : unreadChat}
                  </span>
                ) : active ? (
                  <Building2 className="h-3 w-3 opacity-60" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {showProPromo && (
          <div className="mt-6 rounded-2xl border bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">PRO obuna</p>
            <p className="mt-1 text-sm font-bold">Ko&apos;proq imkoniyatlar</p>
            <Link
              href="/dashboard/subscription"
              className="mt-3 inline-block rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-white/25"
            >
              Tarif tanlash →
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
