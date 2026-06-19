"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Edit,
  Eye,
  Home,
  ImageIcon,
  Loader2,
  MapPin,
  Plus,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ProUpgradeModal } from "@/components/dashboard/pro-upgrade-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { housesApi } from "@/lib/api/houses";
import { useAdminHouses, useMyHouses } from "@/lib/api/hooks";
import { apiClient } from "@/lib/api/client";
import type { HouseListItem, HouseStatus } from "@/lib/api/types";
import { fullUploadUrl } from "@/lib/api/uploads";
import { cn, formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const FREE_LISTINGS_LIMIT = 1;

const FILTERS: { value: "all" | HouseStatus; label: string }[] = [
  { value: "all", label: "Hammasi" },
  { value: "pending", label: "Tekshirilmoqda" },
  { value: "approved", label: "Tasdiqlangan" },
  { value: "rejected", label: "Rad etildi" },
  { value: "rented", label: "Ijarada" },
];

export default function HousesPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [filter, setFilter] = useState<"all" | HouseStatus>(isAdmin ? "pending" : "all");
  const queryClient = useQueryClient();

  const myQuery = useMyHouses({ page_size: 100 }, !isAdmin);
  const adminQuery = useAdminHouses({ page_size: 100 }, isAdmin);
  const data = isAdmin ? adminQuery.data : myQuery.data;
  const isLoading = isAdmin ? adminQuery.isLoading : myQuery.isLoading;

  const items = (data?.items ?? []).filter((h) => filter === "all" || h.status === filter);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => housesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["houses"] }),
  });
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/houses/${id}/approve`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "houses"] }),
  });

  const [rejectTarget, setRejectTarget] = useState<HouseListItem | null>(null);
  const [reason, setReason] = useState("");
  const [proGateOpen, setProGateOpen] = useState(false);

  const isPro = Boolean(user?.landlord_profile?.is_pro);
  const totalListings = data?.total ?? 0;
  const atListingLimit = !isAdmin && !isPro && totalListings >= FREE_LISTINGS_LIMIT;
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await apiClient.post(`/houses/${id}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "houses"] });
      setRejectTarget(null);
      setReason("");
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            {isAdmin ? "E'lonlar moderatsiya" : "Mening e'lonlarim"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.total ?? 0} ta e&apos;lon
          </p>
        </div>
        {!isAdmin && (
          atListingLimit ? (
            <Button className="shadow-md" onClick={() => setProGateOpen(true)}>
              <Plus className="h-4 w-4" />
              Yangi e&apos;lon
            </Button>
          ) : (
            <Button asChild className="shadow-md">
              <Link href="/dashboard/houses/new">
                <Plus className="h-4 w-4" />
                Yangi e&apos;lon
              </Link>
            </Button>
          )
        )}
      </div>

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
            {f.value === "pending" && isAdmin && data && (
              <span className="ml-1.5 rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                {data.items.filter((h) => h.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
          <Home className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">
            {filter === "all" ? "Hali e'lon yo'q" : "Bu kategoriyada e'lon yo'q"}
          </h3>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((h) => (
            <article
              key={h.id}
              className="group overflow-hidden rounded-2xl border bg-card transition hover:shadow-lg"
            >
              <Link href={`/houses/${h.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {h.main_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fullUploadUrl(h.main_photo) ?? h.main_photo}
                      alt={h.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-yellow-100">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <HouseStatusBadge status={h.status} />
                  </div>
                  {h.is_top && (
                    <span className="absolute right-2 top-2 rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase">
                      ⭐ TOP
                    </span>
                  )}
                </div>
              </Link>

              <div className="p-4">
                <h3 className="line-clamp-1 font-semibold">{h.title}</h3>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">
                    {[h.region, h.district].filter(Boolean).join(", ")}
                  </span>
                </p>

                <p className="mt-3 text-lg font-bold">
                  {formatPrice(h.price_per_month, h.currency)}
                  <span className="text-xs font-normal text-muted-foreground"> /oy</span>
                </p>

                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {h.views_count}
                  </span>
                  {Number(h.average_rating) > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {Number(h.average_rating).toFixed(1)} ({h.reviews_count})
                    </span>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {isAdmin ? (
                    <>
                      {h.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(h.id)}
                            disabled={approveMutation.isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Tasdiqlash
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReason("");
                              setRejectTarget(h);
                            }}
                            className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Rad etish
                          </Button>
                        </>
                      )}
                      {h.status !== "pending" && (
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <Link href={`/houses/${h.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                            Ko&apos;rish
                          </Link>
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link href={`/dashboard/houses/${h.id}/edit`}>
                          <Edit className="h-3.5 w-3.5" />
                          Tahrirlash
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("E'lonni o'chirish?")) deleteMutation.mutate(h.id);
                        }}
                        disabled={deleteMutation.isPending}
                        className="px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>

                {h.status === "rejected" && !isAdmin && (
                  <p className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    Admin tomonidan rad etildi. Tahrirlasangiz qayta tekshiriladi.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <ProUpgradeModal
        open={proGateOpen}
        onClose={() => setProGateOpen(false)}
      />

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl">
            <h3 className="text-lg font-bold">E&apos;lonni rad etish</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              «{rejectTarget.title}»
            </p>
            <Label className="mt-5 block">Sabab</Label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Nima uchun rad etilyapti?"
              className="mt-1 w-full rounded-lg border border-input bg-card p-3 text-sm focus:border-destructive focus:outline-none focus:ring-4 focus:ring-destructive/15"
            />
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejectTarget(null)}>
                Bekor
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={reason.trim().length < 3 || rejectMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate({ id: rejectTarget.id, reason: reason.trim() })
                }
              >
                {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Rad etish
              </Button>
            </div>
          </div>
        </div>
      )}
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
