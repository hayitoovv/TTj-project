"use client";

import { ArrowDown, ArrowUp, Calendar, ImageIcon, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { useBookings } from "@/lib/api/hooks";
import type { BookingListItem } from "@/lib/api/types";
import { fullUploadUrl } from "@/lib/api/uploads";
import { cn, formatPrice } from "@/lib/utils";

const PLATFORM_FEE_PERCENT = 1.5;

export default function LandlordPayments() {
  const { data, isLoading } = useBookings({ page_size: 100 });
  const items = data?.items ?? [];

  // Filter income-relevant bookings: confirmed, active, ended
  const incomeBookings = items.filter((b) =>
    ["confirmed", "active", "ended"].includes(b.status),
  );

  // Calculations
  const totalGross = incomeBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
  const totalNet = totalGross * (1 - PLATFORM_FEE_PERCENT / 100);
  const platformFee = totalGross - totalNet;
  const activeBookings = items.filter((b) => b.status === "active");
  const monthlyActive = activeBookings.reduce(
    (sum, b) => sum + Number(b.monthly_price),
    0,
  );
  const monthlyNet = monthlyActive * (1 - PLATFORM_FEE_PERCENT / 100);

  // Group by month (last 6 months)
  const months = buildMonthlyChart(incomeBookings);
  const maxMonthly = Math.max(...months.map((m) => m.amount), 1);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Daromad <span className="text-gradient-brand">hisoboti</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sizning ijara faoliyatingizdan tushgan daromad
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Oylik daromad (sof)"
          value={formatPrice(monthlyNet, "UZS")}
          sub={`${activeBookings.length} ta faol bron`}
          color="from-green-500 to-emerald-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Jami daromad (sof)"
          value={formatPrice(totalNet, "UZS")}
          sub="barcha bronlar"
          color="from-blue-500 to-blue-700"
        />
        <StatCard
          icon={ArrowUp}
          label="Yalpi daromad"
          value={formatPrice(totalGross, "UZS")}
          sub={`${incomeBookings.length} ta bron`}
          color="from-yellow-400 to-orange-500"
        />
        <StatCard
          icon={ArrowDown}
          label="Platforma komissiyasi"
          value={formatPrice(platformFee, "UZS")}
          sub={`${PLATFORM_FEE_PERCENT}%`}
          color="from-red-400 to-rose-600"
        />
      </div>

      {/* Monthly chart */}
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="font-bold">Oxirgi 6 oy</h2>
            <p className="text-xs text-muted-foreground">Bron yaratilgan oy bo&apos;yicha</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Sof daromad ({100 - PLATFORM_FEE_PERCENT}% sizga)
          </p>
        </div>

        <div className="grid grid-cols-6 items-end gap-3 h-48">
          {months.map((m) => {
            const heightPct = (m.amount / maxMonthly) * 100;
            return (
              <div key={m.label} className="flex flex-col items-center gap-2">
                <div className="relative flex w-full flex-1 items-end overflow-hidden rounded-t-lg bg-muted/40">
                  <div
                    className={cn(
                      "w-full rounded-t-lg bg-gradient-to-t transition-all",
                      m.amount > 0 ? "from-blue-500 to-yellow-400" : "from-muted to-muted",
                    )}
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                  />
                  {m.amount > 0 && (
                    <span className="absolute inset-x-0 -top-6 text-center text-[10px] font-semibold">
                      {formatShort(m.amount * (1 - PLATFORM_FEE_PERCENT / 100))}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent bookings */}
      <section>
        <h2 className="mb-3 font-bold">Bronlar tarixi</h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : incomeBookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
            <Wallet className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              Hali daromad yo&apos;q. Bron tasdiqlanganda bu yerda paydo bo&apos;ladi.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {incomeBookings.map((b) => {
              const gross = Number(b.total_amount);
              const net = gross * (1 - PLATFORM_FEE_PERCENT / 100);
              return (
                <Link
                  key={b.id}
                  href={`/dashboard/bookings/${b.id}`}
                  className="flex items-center gap-4 rounded-xl border bg-card p-4 transition hover:shadow-md"
                >
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-yellow-100">
                    {b.house_photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fullUploadUrl(b.house_photo) ?? b.house_photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{b.house_title ?? "Uy"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.student_name ?? "Talaba"}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {b.start_date} → {b.end_date}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold">{formatPrice(net, b.currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      yalpi: {formatPrice(gross, b.currency)}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                </Link>
              );
            })}
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
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
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/70">{sub}</p>
    </div>
  );
}

function buildMonthlyChart(bookings: BookingListItem[]) {
  const now = new Date();
  const months: { label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("uz-UZ", { month: "short" });
    const amount = bookings
      .filter((b) => {
        const created = new Date(b.created_at);
        return (
          created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth()
        );
      })
      .reduce((sum, b) => sum + Number(b.total_amount), 0);
    months.push({ label, amount });
  }
  return months;
}

function formatShort(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(Math.round(amount));
}
