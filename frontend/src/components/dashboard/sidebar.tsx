"use client";

import {
  Building2,
  ClipboardList,
  CreditCard,
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
    { href: "/dashboard/complaints", label: "Shikoyatlar", icon: ShieldAlert },
    { href: "/dashboard/messages", label: "Xabarlar", icon: MessageCircle },
    { href: "/dashboard/profile", label: "Profil", icon: User },
  ],
  admin: [
    { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
    { href: "/dashboard/users", label: "Foydalanuvchilar", icon: Users },
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
                {active && <Building2 className="h-3 w-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-2xl border bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">PRO obuna</p>
          <p className="mt-1 text-sm font-bold">Ko&apos;proq imkoniyatlar</p>
          <Link
            href="/#pricing"
            className="mt-3 inline-block rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-white/25"
          >
            Tarif tanlash →
          </Link>
        </div>
      </div>
    </aside>
  );
}
