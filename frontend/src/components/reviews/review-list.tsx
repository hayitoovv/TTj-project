"use client";

import { MessageSquare } from "lucide-react";

import { ReviewCard, ReviewCardSkeleton } from "@/components/reviews/review-card";
import { useReviews } from "@/lib/api/hooks";
import type { ReviewListFilter } from "@/lib/api/reviews";

export function ReviewList({ filter, emptyText }: { filter: ReviewListFilter; emptyText?: string }) {
  const { data, isLoading } = useReviews(filter);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <ReviewCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          {emptyText ?? "Hali sharhlar yo'q"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.items.map((r) => (
        <ReviewCard key={r.id} review={r} />
      ))}
    </div>
  );
}
