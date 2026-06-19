"use client";

import { Star, X } from "lucide-react";
import { useEffect } from "react";

import { ReviewCard, ReviewCardSkeleton } from "@/components/reviews/review-card";
import { useReviews } from "@/lib/api/hooks";
import type { UserRole } from "@/lib/api/types";
import { fullUploadUrl } from "@/lib/api/uploads";

const ROLE_LABELS: Record<UserRole, string> = {
  student: "Talaba",
  landlord: "Uy egasi",
  curator: "Kurator",
  admin: "Admin",
};

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export function UserProfileModal({
  open,
  onClose,
  userId,
  name,
  role,
  avatarUrl,
}: UserProfileModalProps) {
  const { data, isLoading } = useReviews(
    { target_user_id: userId, page_size: 50 },
    open,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const reviews = data?.items ?? [];
  const total = data?.total ?? 0;
  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const initial = (name.trim().charAt(0) || "U").toUpperCase();
  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-brand px-6 py-5 text-white">
          <button
            onClick={onClose}
            aria-label="Yopish"
            className="absolute right-3 top-3 rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fullUploadUrl(avatarUrl) ?? avatarUrl}
                alt={name}
                className="h-16 w-16 rounded-full border-2 border-white/40 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-white/15 text-2xl font-bold backdrop-blur">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-bold">{name}</h3>
              <p className="mt-0.5 text-xs uppercase tracking-wider text-white/80">
                {roleLabel}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
                {total > 0 ? (
                  <span className="text-xs font-semibold">
                    {avg.toFixed(1)} • {total} ta sharh
                  </span>
                ) : (
                  <span className="text-xs">Hali baholanmagan</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[calc(90vh-160px)] space-y-3 overflow-y-auto p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sharhlar
          </p>

          {isLoading ? (
            <div className="space-y-3">
              <ReviewCardSkeleton />
              <ReviewCardSkeleton />
            </div>
          ) : total === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Hozircha bu foydalanuvchi haqida sharh yo&apos;q
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
