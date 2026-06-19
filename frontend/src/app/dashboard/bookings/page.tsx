"use client";

import { Calendar, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { useBookings } from "@/lib/api/hooks";
import type { BookingStatus } from "@/lib/api/types";
import { fullUploadUrl } from "@/lib/api/uploads";
import { cn, formatPrice } from "@/lib/utils";

const FILTERS: { value: "all" | BookingStatus; label: string }[] = [
  { value: "all", label: "Hammasi" },
  { value: "pending", label: "Kutilmoqda" },
  { value: "confirmed", label: "Tasdiqlangan" },
  { value: "active", label: "Faol" },
  { value: "ended", label: "Tugagan" },
  { value: "cancelled", label: "Bekor qilingan" },
];

export default function BookingsPage() {
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const { data, isLoading } = useBookings(
    filter === "all" ? {} : { status: filter as BookingStatus },
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Mening bronlarim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data?.total !== undefined ? `${data.total} ta bron` : "Yuklanmoqda..."}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition",
              filter === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border bg-muted/40" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Hali bron yo&apos;q</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Uy izlash boshlang va sevgan uyingizni bron qiling.
          </p>
          <Button asChild className="mt-4">
            <Link href="/houses">Uy qidirish</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((b) => (
            <Link
              key={b.id}
              href={`/dashboard/bookings/${b.id}`}
              className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:shadow-md"
            >
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-yellow-100">
                {b.house_photo && (
                  <img src={fullUploadUrl(b.house_photo) ?? b.house_photo} alt="" className="h-full w-full object-cover" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold">{b.house_title ?? "Uy"}</h3>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {b.house_address ?? "—"}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {b.start_date} → {b.end_date}
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold">
                  {formatPrice(b.total_amount, b.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(b.monthly_price, b.currency)}/oy
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
