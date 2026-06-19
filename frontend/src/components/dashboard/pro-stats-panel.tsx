"use client";

import {
  Activity,
  BarChart3,
  Crown,
  Eye,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import type {
  BookingListItem,
  BookingStatus,
  HouseListItem,
} from "@/lib/api/types";
import { cn, formatPrice } from "@/lib/utils";

interface ProStatsPanelProps {
  houses: HouseListItem[];
  bookings: BookingListItem[];
}

const MONTH_LABELS = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
  "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
];

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Kutilmoqda",
    color: "bg-yellow-500",
    bg: "bg-yellow-50 text-yellow-800",
  },
  confirmed: {
    label: "Tasdiqlangan",
    color: "bg-blue-500",
    bg: "bg-blue-50 text-blue-700",
  },
  active: {
    label: "Faol",
    color: "bg-green-500",
    bg: "bg-green-50 text-green-700",
  },
  completed: {
    label: "Tugagan",
    color: "bg-slate-500",
    bg: "bg-slate-50 text-slate-700",
  },
  cancelled: {
    label: "Bekor",
    color: "bg-red-500",
    bg: "bg-red-50 text-red-700",
  },
  rejected: {
    label: "Rad etilgan",
    color: "bg-orange-500",
    bg: "bg-orange-50 text-orange-700",
  },
};

export function ProStatsPanel({ houses, bookings }: ProStatsPanelProps) {
  const now = new Date();

  // ---------- Hero metrics ----------
  const monthlyRevenue = bookings
    .filter((b) => b.status === "active")
    .reduce((sum, b) => sum + Number(b.monthly_price), 0);

  const totalViews = houses.reduce((sum, h) => sum + (h.views_count ?? 0), 0);

  const thisMonthBookings = bookings.filter((b) => {
    const d = new Date(b.created_at);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }).length;

  const conversionRate =
    totalViews > 0 ? (bookings.length / totalViews) * 100 : 0;

  // ---------- Last 6 months revenue + bookings ----------
  const monthBuckets = Array.from({ length: 6 }).map((_, i) => {
    const offset = 5 - i;
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTH_LABELS[d.getMonth()],
      revenue: 0,
      bookings: 0,
    };
  });

  const bucketByKey = new Map(monthBuckets.map((b) => [b.key, b]));

  for (const b of bookings) {
    const d = new Date(b.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = bucketByKey.get(key);
    if (!bucket) continue;
    bucket.bookings += 1;
    if (b.status === "active" || b.status === "completed" || b.status === "confirmed") {
      bucket.revenue += Number(b.monthly_price);
    }
  }

  const maxRevenue = Math.max(1, ...monthBuckets.map((b) => b.revenue));
  const maxBookings = Math.max(1, ...monthBuckets.map((b) => b.bookings));

  // ---------- Status breakdown ----------
  const statusCounts = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});
  const statusEntries = (Object.keys(STATUS_CONFIG) as BookingStatus[])
    .map((s) => ({ status: s, count: statusCounts[s] ?? 0 }))
    .filter((e) => e.count > 0);

  // ---------- Top houses ----------
  const houseBookingsCount = bookings.reduce<Record<number, number>>(
    (acc, b) => {
      acc[b.house_id] = (acc[b.house_id] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const topHouses = [...houses]
    .map((h) => ({
      house: h,
      score: (h.views_count ?? 0) + (houseBookingsCount[h.id] ?? 0) * 25,
      bookings: houseBookingsCount[h.id] ?? 0,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <section className="overflow-hidden rounded-2xl border border-yellow-300 bg-gradient-to-br from-yellow-50/40 via-card to-card p-5 ring-1 ring-yellow-300/30 sm:p-6">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-foreground shadow-sm">
            <Crown className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight">PRO statistika</h2>
            <p className="text-xs text-muted-foreground">
              To&apos;liq tahlil va daromad ko&apos;rsatkichlari
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm">
          <Sparkles className="h-2.5 w-2.5" /> Faol
        </span>
      </div>

      {/* Hero metrics */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={Wallet}
          label="Oylik daromad"
          value={formatPrice(monthlyRevenue, "UZS")}
          tone="from-emerald-500 to-emerald-700"
          isMoney
        />
        <Metric
          icon={Activity}
          label="Bu oygi bronlar"
          value={String(thisMonthBookings)}
          sub="bron yaratildi"
          tone="from-blue-500 to-blue-700"
        />
        <Metric
          icon={Eye}
          label="Jami ko'rishlar"
          value={String(totalViews)}
          sub="barcha e'lonlarda"
          tone="from-indigo-500 to-indigo-700"
        />
        <Metric
          icon={Target}
          label="Konversiya"
          value={`${conversionRate.toFixed(1)}%`}
          sub="ko'rish → bron"
          tone="from-orange-500 to-rose-500"
        />
      </div>

      {/* Charts grid */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Daromad dinamikasi</p>
              <p className="text-[11px] text-muted-foreground">
                Oxirgi 6 oy &mdash; tasdiqlangan bronlar bo&apos;yicha
              </p>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex h-40 items-end gap-2">
            {monthBuckets.map((b) => {
              const pct = (b.revenue / maxRevenue) * 100;
              return (
                <div
                  key={b.key}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                >
                  <div
                    className="relative w-full overflow-hidden rounded-t-md bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 transition-all"
                    style={{ height: `${Math.max(4, pct)}%` }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-white/15" />
                  </div>
                  <span className="mt-1.5 text-[10px] font-medium text-muted-foreground">
                    {b.label}
                  </span>
                  <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background opacity-0 shadow-lg transition group-hover:opacity-100">
                    {formatPrice(b.revenue, "UZS")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Bron statuslari</p>
              <p className="text-[11px] text-muted-foreground">
                Taqsimot
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          {statusEntries.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-center text-xs text-muted-foreground">
              Hali bronlar yo&apos;q
            </div>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(({ status, count }) => {
                const cfg = STATUS_CONFIG[status];
                const pct = (count / bookings.length) * 100;
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{cfg.label}</span>
                      <span className="font-bold text-muted-foreground">
                        {count} &middot; {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full transition-all", cfg.color)}
                        style={{ width: `${Math.max(3, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bookings count chart + Top houses */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Booking count by month */}
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Bronlar dinamikasi</p>
              <p className="text-[11px] text-muted-foreground">
                Oyiga yangi bronlar soni
              </p>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex h-32 items-end gap-2">
            {monthBuckets.map((b) => {
              const pct = (b.bookings / maxBookings) * 100;
              return (
                <div
                  key={b.key}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                >
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400"
                    style={{ height: `${Math.max(4, pct)}%` }}
                  />
                  <span className="mt-1.5 text-[10px] font-medium text-muted-foreground">
                    {b.label}
                  </span>
                  <span className="absolute -top-1 text-[10px] font-bold text-blue-700 opacity-0 transition group-hover:opacity-100">
                    {b.bookings}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top houses */}
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Eng yaxshi e&apos;lonlar</p>
              <p className="text-[11px] text-muted-foreground">
                Ko&apos;rishlar va bronlar bo&apos;yicha
              </p>
            </div>
            <Star className="h-4 w-4 text-muted-foreground" />
          </div>
          {topHouses.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-center text-xs text-muted-foreground">
              Hali ma&apos;lumot yo&apos;q
            </div>
          ) : (
            <ul className="space-y-2.5">
              {topHouses.map(({ house, bookings: bCount }, idx) => (
                <li
                  key={house.id}
                  className="flex items-center gap-3 rounded-lg border bg-background p-2.5"
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                      idx === 0
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    #{idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{house.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5">
                        <Eye className="h-3 w-3" /> {house.views_count ?? 0}
                      </span>
                      <span>&middot;</span>
                      <span>{bCount} bron</span>
                      {Number(house.average_rating) > 0 && (
                        <>
                          <span>&middot;</span>
                          <span className="inline-flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {Number(house.average_rating).toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  isMoney,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone: string;
  isMoney?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-3.5">
      <div className={cn("absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 blur-2xl bg-gradient-to-br", tone)} />
      <div className="relative flex items-start gap-2.5">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
            tone,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-0.5 truncate font-extrabold tracking-tight",
              isMoney ? "text-base sm:text-lg" : "text-xl",
            )}
          >
            {value}
          </p>
          {sub && (
            <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
          )}
        </div>
      </div>
    </div>
  );
}
