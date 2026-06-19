import { formatDistanceToNow } from "date-fns";

import { StarRating } from "@/components/reviews/star-rating";
import type { ReviewRead } from "@/lib/api/types";

const ROLE_LABELS: Record<string, string> = {
  student: "Talaba",
  landlord: "Uy egasi",
  curator: "Kurator",
  admin: "Admin",
};

export function ReviewCard({ review }: { review: ReviewRead }) {
  const r = review.reviewer;
  const initial =
    (r.first_name?.[0] ?? r.last_name?.[0] ?? "U")?.toString().toUpperCase() ?? "U";
  const name = `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "Foydalanuvchi";

  return (
    <article className="rounded-2xl border bg-card p-5">
      <header className="flex items-start gap-3">
        {r.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.avatar_url}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-yellow-400 text-sm font-bold text-white">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{name}</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {ROLE_LABELS[r.role] ?? r.role}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <StarRating value={review.rating} size="sm" readOnly />
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </header>

      {review.comment && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {review.comment}
        </p>
      )}
    </article>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
