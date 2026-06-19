"use client";

import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AuthGuard } from "@/components/dashboard/auth-guard";
import { Navbar } from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { bookingsApi } from "@/lib/api/bookings";
import { extractApiError } from "@/lib/api/client";
import { useBookingEstimate, useHouse } from "@/lib/api/hooks";
import { formatPrice } from "@/lib/utils";

const MAX_ADVANCE_DAYS = 2;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function NewBookingPage() {
  return (
    <AuthGuard roles={["student"]}>
      <Navbar />
      <NewBookingContent />
    </AuthGuard>
  );
}

function NewBookingContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const houseId = Number(sp.get("house_id"));
  const { data: house, isLoading: houseLoading } = useHouse(
    Number.isFinite(houseId) ? houseId : null,
  );

  const today = todayStr();
  const maxStart = addDays(today, MAX_ADVANCE_DAYS);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 30));
  const [error, setError] = useState<string | null>(null);

  const datesValid = useMemo(() => {
    if (!startDate || !endDate) return false;
    if (startDate < today || startDate > maxStart) return false;
    if (endDate <= startDate) return false;
    return true;
  }, [startDate, endDate, today, maxStart]);

  const { data: estimate, isFetching: estimateLoading } = useBookingEstimate(
    Number.isFinite(houseId) && datesValid ? houseId : null,
    datesValid ? startDate : null,
    datesValid ? endDate : null,
  );

  const createMutation = useMutation({
    mutationFn: () =>
      bookingsApi.create({
        house_id: houseId,
        start_date: startDate,
        end_date: endDate,
      }),
    onSuccess: (b) => router.push(`/dashboard/bookings/${b.id}`),
    onError: (e) => setError(extractApiError(e)),
  });

  if (!Number.isFinite(houseId)) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12 text-center">
        <p>Uy ID topilmadi.</p>
        <Button asChild className="mt-4">
          <Link href="/houses">Uy qidirish</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Orqaga
      </button>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
        Bron <span className="text-gradient-brand">tasdiqlash</span>
      </h1>

      {houseLoading || !house ? (
        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* LEFT: Form */}
          <div className="space-y-6">
            {/* House summary */}
            <div className="flex items-center gap-4 rounded-2xl border bg-card p-4">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-yellow-100">
                {house.main_photo && (
                  <img src={house.main_photo} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{house.title}</h3>
                <p className="truncate text-xs text-muted-foreground">{house.address}</p>
                <p className="mt-2 text-sm font-bold text-primary">
                  {formatPrice(house.price_per_month, house.currency)}/oy
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="flex items-center gap-2 font-semibold">
                <Calendar className="h-4 w-4 text-primary" />
                Sanalarni tanlang
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="start">Ko&apos;chish kuni</Label>
                  <input
                    id="start"
                    type="date"
                    min={today}
                    max={maxStart}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Faqat {MAX_ADVANCE_DAYS} kun oldin bron qilish mumkin
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end">Ko&apos;chib chiqish kuni</Label>
                  <input
                    id="end"
                    type="date"
                    min={addDays(startDate, 1)}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                </div>
              </div>

              {!datesValid && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Sana noto&apos;g&apos;ri tanlandi
                </p>
              )}
            </div>

            {/* Trust */}
            <div className="space-y-2 rounded-2xl border bg-gradient-to-br from-blue-50 to-yellow-50 p-5 text-sm">
              <Trust icon={ShieldCheck} text="Avtomatik shartnoma generatsiya qilinadi" />
              <Trust icon={CheckCircle2} text="To'lov kafolati va 24 soatlik refund" />
              <Trust icon={Sparkles} text="Uy egasi tasdiqlagandan keyin to'lash" />
            </div>
          </div>

          {/* RIGHT: Estimate */}
          <aside>
            <div className="sticky top-20 rounded-2xl border bg-card p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hisob-kitob
              </p>

              {!datesValid ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Sanalarni tanlang
                </p>
              ) : estimateLoading || !estimate ? (
                <div className="mt-4 space-y-2">
                  <div className="h-4 animate-pulse rounded bg-muted" />
                  <div className="h-4 animate-pulse rounded bg-muted" />
                  <div className="h-6 animate-pulse rounded bg-muted" />
                </div>
              ) : (
                <>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {estimate.days} kun ijara
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    <Row
                      label="Ijara haqi"
                      value={formatPrice(estimate.total_rent, estimate.currency)}
                    />
                    <Row
                      label="Platforma (1.5%)"
                      value={formatPrice(estimate.platform_fee, estimate.currency)}
                    />
                    <Row
                      label="Xizmat haqi"
                      value={formatPrice(estimate.service_fee, estimate.currency)}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-4 text-lg font-bold">
                    <span>Jami</span>
                    <span>{formatPrice(estimate.total_amount, estimate.currency)}</span>
                  </div>
                </>
              )}

              {error && (
                <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <Button
                className="mt-6 w-full shadow-lg shadow-blue-500/20"
                size="lg"
                disabled={!datesValid || createMutation.isPending}
                onClick={() => {
                  setError(null);
                  createMutation.mutate();
                }}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Bron qilish"
                )}
              </Button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Tugmani bosish — to&apos;lovga o&apos;tish degani emas. Avval uy egasi tasdiqlaydi.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Trust({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
      <span>{text}</span>
    </div>
  );
}
