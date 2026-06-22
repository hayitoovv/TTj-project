"use client";

import {
  Building2,
  Crown,
  GraduationCap,
  Home,
  MapPin,
  Receipt,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { useAdminAnalytics, useAdminStats } from "@/lib/api/hooks";
import type {
  HousePoint,
  RevenuePoint,
  SignupPoint,
} from "@/lib/api/admin";
import { cn, formatPrice } from "@/lib/utils";

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useAdminAnalytics();
  const { data: stats } = useAdminStats();

  if (isLoading || !analytics) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted/40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-muted/40" />
      </div>
    );
  }

  const totalRevenue6m = analytics.revenue_trend.reduce(
    (sum, p) => sum + Number(p.revenue),
    0,
  );
  const totalFee6m = analytics.revenue_trend.reduce(
    (sum, p) => sum + Number(p.platform_fee),
    0,
  );
  const totalSignups6m = analytics.signup_trend.reduce((sum, p) => sum + p.total, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Platforma <span className="text-gradient-brand">analitika</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Oxirgi 6 oy trendlari va eng faol universitetlar / hududlar
        </p>
      </header>

      {/* Hero KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Wallet}
          label="6 oylik daromad"
          value={formatPrice(totalRevenue6m, "UZS")}
          sub={`Komissiya: ${formatPrice(totalFee6m, "UZS")}`}
          color="from-purple-500 to-pink-600"
        />
        <KpiCard
          icon={TrendingUp}
          label="O'rtacha bron"
          value={formatPrice(analytics.avg_booking_amount, "UZS")}
          sub="bir bron qiymati"
          color="from-blue-500 to-blue-700"
        />
        <KpiCard
          icon={Users}
          label="6 oyda yangi"
          value={totalSignups6m}
          sub="foydalanuvchilar"
          color="from-green-500 to-emerald-600"
        />
        <KpiCard
          icon={Crown}
          label="PRO uy egalari"
          value={analytics.pro_landlords_count}
          sub={`${analytics.active_pro_subscriptions} faol obuna`}
          color="from-yellow-400 to-orange-500"
        />
      </div>

      {/* Revenue chart */}
      <RevenueChart points={analytics.revenue_trend} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SignupChart points={analytics.signup_trend} />
        <HouseChart points={analytics.house_trend} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopUniversitiesPanel items={analytics.top_universities} />
        <TopRegionsPanel items={analytics.top_regions} />
      </div>

      {stats && (
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="mb-4 inline-flex items-center gap-2 font-bold">
            <Sparkles className="h-4 w-4 text-primary" />
            Joriy holat
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Faol bronlar" value={stats.active_bookings} />
            <MiniStat label="Tasdiqlangan e'lonlar" value={stats.approved_houses} />
            <MiniStat label="Kutilayotgan e'lonlar" value={stats.pending_houses} highlight />
            <MiniStat label="Talabalar" value={stats.total_students} />
            <MiniStat label="Uy egalari" value={stats.total_landlords} />
            <MiniStat label="Kuratorlar" value={stats.total_curators} />
          </div>
        </section>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card p-5 transition hover:shadow-md">
      <div
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
          color,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-xl font-extrabold tracking-tight md:text-2xl">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/70">{sub}</p>
    </div>
  );
}

function RevenueChart({ points }: { points: RevenuePoint[] }) {
  const max = Math.max(...points.map((p) => Number(p.revenue)), 1);

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 font-bold">
          <Receipt className="h-4 w-4 text-primary" />
          Daromad trendi (6 oy)
        </h2>
        <span className="text-xs text-muted-foreground">UZS</span>
      </div>
      <div className="flex h-56 items-end gap-2 sm:gap-3">
        {points.map((p) => {
          const revenue = Number(p.revenue);
          const fee = Number(p.platform_fee);
          const h = (revenue / max) * 100;
          const feeH = revenue > 0 ? (fee / revenue) * 100 : 0;
          return (
            <div key={p.month} className="group flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-semibold opacity-0 transition group-hover:opacity-100">
                {formatPrice(revenue, "UZS")}
              </span>
              <div
                className="relative w-full overflow-hidden rounded-t-lg bg-gradient-to-t from-purple-500 to-pink-500 transition group-hover:opacity-90"
                style={{ height: `${Math.max(h, 4)}%` }}
              >
                <div
                  className="absolute inset-x-0 bottom-0 bg-yellow-400/40"
                  style={{ height: `${feeH}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">{p.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-purple-500 to-pink-500" />
          Daromad
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-yellow-400/40" />
          Platforma komissiyasi
        </span>
      </div>
    </section>
  );
}

function SignupChart({ points }: { points: SignupPoint[] }) {
  const max = Math.max(...points.map((p) => p.total), 1);

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="mb-5 inline-flex items-center gap-2 font-bold">
        <Users className="h-4 w-4 text-primary" />
        Yangi foydalanuvchilar
      </h2>
      <div className="flex h-44 items-end gap-2">
        {points.map((p) => {
          const studentH = (p.students / max) * 100;
          const landlordH = (p.landlords / max) * 100;
          const curatorH = (p.curators / max) * 100;
          return (
            <div key={p.month} className="group flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-semibold opacity-0 transition group-hover:opacity-100">
                {p.total}
              </span>
              <div className="flex w-full flex-col-reverse gap-px">
                {p.students > 0 && (
                  <div
                    className="w-full rounded-t-md bg-blue-500"
                    style={{ height: `${Math.max(studentH * 1.4, 2)}px` }}
                    title={`${p.students} talaba`}
                  />
                )}
                {p.landlords > 0 && (
                  <div
                    className="w-full bg-yellow-500"
                    style={{ height: `${Math.max(landlordH * 1.4, 2)}px` }}
                    title={`${p.landlords} uy egasi`}
                  />
                )}
                {p.curators > 0 && (
                  <div
                    className="w-full rounded-t-md bg-purple-500"
                    style={{ height: `${Math.max(curatorH * 1.4, 2)}px` }}
                    title={`${p.curators} kurator`}
                  />
                )}
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">{p.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Legend color="bg-blue-500" label="Talaba" />
        <Legend color="bg-yellow-500" label="Uy egasi" />
        <Legend color="bg-purple-500" label="Kurator" />
      </div>
    </section>
  );
}

function HouseChart({ points }: { points: HousePoint[] }) {
  const max = Math.max(...points.map((p) => p.created), 1);

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="mb-5 inline-flex items-center gap-2 font-bold">
        <Home className="h-4 w-4 text-primary" />
        Yangi e&apos;lonlar
      </h2>
      <div className="flex h-44 items-end gap-2">
        {points.map((p) => {
          const h = (p.created / max) * 100;
          const approvedH = p.created > 0 ? (p.approved / p.created) * h : 0;
          return (
            <div key={p.month} className="group flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-semibold opacity-0 transition group-hover:opacity-100">
                {p.created}
              </span>
              <div
                className="relative w-full overflow-hidden rounded-t-lg bg-gray-200"
                style={{ height: `${Math.max(h, 4)}%` }}
              >
                <div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-green-500 to-emerald-400"
                  style={{ height: `${Math.max((approvedH / Math.max(h, 1)) * 100, 0)}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">{p.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Legend color="bg-gradient-to-t from-green-500 to-emerald-400" label="Tasdiqlangan" />
        <Legend color="bg-gray-200" label="Kutilmoqda / rad etilgan" />
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-sm", color)} />
      {label}
    </span>
  );
}

function TopUniversitiesPanel({
  items,
}: {
  items: { university_id: number; name: string; short_name?: string | null; student_count: number }[];
}) {
  const max = Math.max(...items.map((i) => i.student_count), 1);
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="mb-4 inline-flex items-center gap-2 font-bold">
        <GraduationCap className="h-4 w-4 text-primary" />
        Top universitetlar
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</p>
      ) : (
        <ul className="space-y-3">
          {items.map((u, idx) => (
            <li key={u.university_id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{u.short_name || u.name}</span>
                </span>
                <span className="font-semibold">{u.student_count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-yellow-400 transition-all"
                  style={{ width: `${(u.student_count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TopRegionsPanel({ items }: { items: { region: string; house_count: number; booking_count: number }[] }) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="mb-4 inline-flex items-center gap-2 font-bold">
        <MapPin className="h-4 w-4 text-primary" />
        Top hududlar
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</p>
      ) : (
        <ul className="space-y-2">
          {items.map((r, idx) => (
            <li
              key={r.region}
              className="flex items-center justify-between rounded-xl border bg-background p-3"
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-yellow-400 text-[11px] font-bold text-white">
                  {idx + 1}
                </span>
                <span className="font-medium">{r.region}</span>
              </span>
              <span className="text-right text-xs">
                <span className="block font-semibold">{r.house_count} e&apos;lon</span>
                <span className="block text-muted-foreground">{r.booking_count} bron</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-background px-4 py-3",
        highlight && "border-yellow-300 bg-yellow-50",
      )}
    >
      <p className="text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
