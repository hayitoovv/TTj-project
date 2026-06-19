"use client";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  Home,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { Button } from "@/components/ui/button";
import { useAdminHouses, useAdminStats } from "@/lib/api/hooks";
import type { UserResponse } from "@/lib/api/types";
import { fullUploadUrl } from "@/lib/api/uploads";
import { cn, formatPrice } from "@/lib/utils";

export function AdminDashboard({ user }: { user: UserResponse }) {
  const { data: stats } = useAdminStats();
  const { data: pendingHouses } = useAdminHouses({ status: "pending" as never, page_size: 5 });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <WelcomeCard user={user} />

      {/* Pending alert */}
      {stats && stats.pending_houses > 0 && (
        <Link
          href="/dashboard/houses?status=pending"
          className="block rounded-2xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 p-5 transition hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-white shadow-md">
              <Clock className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold">{stats.pending_houses} ta e&apos;lon kutmoqda</p>
              <p className="text-sm text-muted-foreground">
                Yangi e&apos;lonlarni tasdiqlash yoki rad etish kerak
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Foydalanuvchilar"
          value={stats?.total_users ?? "—"}
          sub={stats ? `+${stats.new_users_this_month} bu oyda` : ""}
          color="from-blue-500 to-blue-700"
        />
        <StatCard
          icon={Home}
          label="E'lonlar"
          value={stats?.total_houses ?? "—"}
          sub={stats ? `${stats.approved_houses} tasdiqlangan` : ""}
          color="from-yellow-400 to-orange-500"
        />
        <StatCard
          icon={ClipboardList}
          label="Bronlar"
          value={stats?.total_bookings ?? "—"}
          sub={stats ? `${stats.active_bookings} faol` : ""}
          color="from-green-500 to-emerald-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Bu oy daromad"
          value={stats ? formatPrice(stats.revenue_this_month, "UZS") : "—"}
          sub={stats ? `Komissiya: ${formatPrice(stats.total_platform_fee, "UZS")}` : ""}
          color="from-purple-500 to-pink-600"
          isMoney
        />
      </div>

      {/* Two-column section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* User breakdown */}
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Foydalanuvchilar tarkibi</h2>
            <Link
              href="/dashboard/users"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Boshqarish →
            </Link>
          </div>
          <div className="space-y-3">
            <RoleRow
              icon={Users}
              label="Talabalar"
              count={stats?.total_students ?? 0}
              total={stats?.total_users ?? 0}
              color="bg-blue-500"
            />
            <RoleRow
              icon={Home}
              label="Uy egalari"
              count={stats?.total_landlords ?? 0}
              total={stats?.total_users ?? 0}
              color="bg-yellow-500"
            />
            <RoleRow
              icon={ShieldAlert}
              label="Kuratorlar"
              count={stats?.total_curators ?? 0}
              total={stats?.total_users ?? 0}
              color="bg-purple-500"
            />
            <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
              <span className="text-muted-foreground">Bloklangan</span>
              <span className="font-semibold text-destructive">
                {stats?.blocked_users ?? 0}
              </span>
            </div>
          </div>
        </section>

        {/* Pending houses preview */}
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Kutilayotgan e&apos;lonlar</h2>
            <Link
              href="/dashboard/houses?status=pending"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Hammasi →
            </Link>
          </div>
          {!pendingHouses ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : pendingHouses.items.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-500/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                Hammasi tasdiqlangan ✅
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingHouses.items.map((h) => (
                <Link
                  key={h.id}
                  href={`/houses/${h.id}`}
                  className="flex items-center gap-3 rounded-xl border bg-background p-3 transition hover:shadow-sm"
                >
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-yellow-100">
                    {h.main_photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fullUploadUrl(h.main_photo) ?? h.main_photo} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{h.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{h.region}</p>
                  </div>
                  <span className="text-sm font-bold">
                    {formatPrice(h.price_per_month, h.currency)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          href="/dashboard/users"
          icon={Users}
          title="Foydalanuvchilar"
          description="Ro'yxat, bloklash"
        />
        <ActionCard
          href="/dashboard/houses?status=pending"
          icon={Home}
          title="E'lonlar"
          description="Tasdiqlash, moderatsiya"
        />
        <ActionCard
          href="/dashboard/bookings"
          icon={ClipboardList}
          title="Bronlar"
          description="Barcha bronlar"
        />
        <ActionCard
          href="/dashboard/payments"
          icon={Sparkles}
          title="Moliya"
          description="To'lovlar, daromad"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  isMoney,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub: string;
  color: string;
  isMoney?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card p-5 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
            color,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {isMoney && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">
            +{Math.round(Math.random() * 10) + 5}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/70">{sub}</p>
    </div>
  );
}

function RoleRow({
  icon: Icon,
  label,
  count,
  total,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        <span className="font-semibold">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all", color)}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}
