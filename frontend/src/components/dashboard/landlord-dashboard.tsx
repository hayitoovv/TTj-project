"use client";

import {
  ArrowRight,
  Building2,
  ClipboardList,
  Eye,
  Home,
  ImageIcon,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { Button } from "@/components/ui/button";
import { useBookings, useMyHouses } from "@/lib/api/hooks";
import type { UserResponse } from "@/lib/api/types";
import { formatPrice } from "@/lib/utils";

export function LandlordDashboard({ user }: { user: UserResponse }) {
  const { data: housesData } = useMyHouses({ page_size: 100 });
  const { data: bookingsData } = useBookings({ page_size: 100 });

  const houses = housesData?.items ?? [];
  const bookings = bookingsData?.items ?? [];

  const stats = {
    totalHouses: houses.length,
    approved: houses.filter((h) => h.status === "approved").length,
    pendingReview: houses.filter((h) => h.status === "pending").length,
    pendingBookings: bookings.filter((b) => b.status === "pending").length,
    activeBookings: bookings.filter((b) => b.status === "active").length,
  };

  const monthlyRevenue = bookings
    .filter((b) => b.status === "active")
    .reduce((sum, b) => sum + Number(b.monthly_price), 0);

  const pendingList = bookings.filter((b) => b.status === "pending").slice(0, 3);
  const recentHouses = houses.slice(0, 3);
  const profile = user.landlord_profile;
  const freeListingsRemaining = Math.max(0, 5 - (profile?.free_listings_used ?? 0));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <WelcomeCard user={user} />

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Home}
          label="Mening uylarim"
          value={stats.totalHouses}
          sub={`${stats.approved} tasdiqlangan, ${stats.pendingReview} kutilmoqda`}
          color="text-blue-600"
        />
        <StatCard
          icon={ClipboardList}
          label="Yangi so'rovlar"
          value={stats.pendingBookings}
          sub="tasdiqlash kerak"
          color="text-yellow-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Faol bronlar"
          value={stats.activeBookings}
          sub="hozir yashayapti"
          color="text-green-600"
        />
        <StatCard
          icon={Sparkles}
          label="Oylik daromad"
          value={formatPrice(monthlyRevenue, "UZS")}
          sub="faol bronlar"
          color="text-orange-600"
          isMoney
        />
      </div>

      {/* PRO upsell */}
      {!profile?.is_pro && (
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-yellow-100 via-yellow-50 to-orange-100 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
                Bepul rejim
              </p>
              <h3 className="mt-1 font-bold">
                Sizda {freeListingsRemaining} ta bepul e&apos;lon qoldi
              </h3>
              <p className="text-sm text-muted-foreground">
                Cheksiz e&apos;lon va TOP joyga chiqarish uchun PRO obunaga o&apos;ting.
              </p>
            </div>
            <Button asChild className="shadow-md">
              <Link href="/#pricing">
                <Sparkles className="h-4 w-4" />
                PRO ga o&apos;tish
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Pending bookings */}
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">⏳ Kutilayotgan so&apos;rovlar</h2>
          {bookings.length > 0 && (
            <Link
              href="/dashboard/bookings"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Hammasini ko&apos;rish →
            </Link>
          )}
        </div>

        {pendingList.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Yangi so&apos;rovlar yo&apos;q. Talabalar bron qilganda shu yerda ko&apos;rinadi.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingList.map((b) => (
              <Link
                key={b.id}
                href={`/dashboard/bookings/${b.id}`}
                className="flex items-center gap-3 rounded-xl border bg-background p-3 transition hover:shadow-sm"
              >
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-yellow-100">
                  {b.house_photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.house_photo} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{b.house_title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.student_name ?? "Talaba"} • {b.start_date} → {b.end_date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatPrice(b.total_amount, b.currency)}</p>
                  <StatusBadge status={b.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* My houses preview */}
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">🏘 Mening uylarim</h2>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/houses">Hammasi →</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/houses/new">
                <Plus className="h-4 w-4" />
                Yangi e&apos;lon
              </Link>
            </Button>
          </div>
        </div>

        {recentHouses.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <Home className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h3 className="mt-3 font-semibold">Hali e&apos;lon yo&apos;q</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Birinchi e&apos;loningizni qo&apos;shing — bepul!
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/houses/new">
                <Plus className="h-4 w-4" />
                E&apos;lon qo&apos;shish
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {recentHouses.map((h) => (
              <Link
                key={h.id}
                href={`/dashboard/houses/${h.id}`}
                className="group overflow-hidden rounded-xl border bg-background transition hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {h.main_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={h.main_photo}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-100 to-yellow-100">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <HouseStatusBadge status={h.status} />
                  </div>
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-semibold">{h.title}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-bold">{formatPrice(h.price_per_month, h.currency)}</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {h.views_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
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
    <div className="rounded-2xl border bg-card p-5 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <Icon className={`h-5 w-5 ${color}`} />
        {isMoney && <Star className="h-4 w-4 text-yellow-500" />}
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-[11px] text-muted-foreground/70">{sub}</p>
    </div>
  );
}

function HouseStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: "Tasdiqlangan", cls: "bg-green-100 text-green-700 border-green-200" },
    pending: { label: "Tekshirilmoqda", cls: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    rejected: { label: "Rad etildi", cls: "bg-red-100 text-red-700 border-red-200" },
    rented: { label: "Ijaraga olingan", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    inactive: { label: "Faol emas", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
}
