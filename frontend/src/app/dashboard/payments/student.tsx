"use client";

import { Calendar, ImageIcon, Receipt, Wallet } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { useBookings } from "@/lib/api/hooks";
import { formatPrice } from "@/lib/utils";

export default function StudentPayments() {
  const { data, isLoading } = useBookings({ page_size: 100 });
  const items = data?.items ?? [];

  const expenses = items.filter((b) =>
    ["confirmed", "active", "ended"].includes(b.status),
  );
  const totalSpent = expenses.reduce((sum, b) => sum + Number(b.total_amount), 0);
  const activeBookings = items.filter((b) => b.status === "active");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          To&apos;lovlar <span className="text-gradient-brand">tarixi</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Barcha bronlar uchun to&apos;lovlar</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <Wallet className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-extrabold">{formatPrice(totalSpent, "UZS")}</p>
          <p className="mt-1 text-xs text-muted-foreground">Jami sarflangan</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <Receipt className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-extrabold">{activeBookings.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Hozir faol bron</p>
        </div>
      </div>

      {/* List */}
      <section>
        <h2 className="mb-3 font-bold">Tafsilotlar</h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
            <Wallet className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              Hali to&apos;lov tarixi yo&apos;q.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((b) => (
              <Link
                key={b.id}
                href={`/dashboard/bookings/${b.id}`}
                className="flex items-center gap-4 rounded-xl border bg-card p-4 transition hover:shadow-md"
              >
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-yellow-100">
                  {b.house_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.house_photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{b.house_title ?? "Uy"}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {b.start_date} → {b.end_date}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold">{formatPrice(b.total_amount, b.currency)}</p>
                  <div className="mt-1">
                    <StatusBadge status={b.status} />
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
