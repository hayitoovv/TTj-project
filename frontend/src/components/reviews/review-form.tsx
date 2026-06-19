"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";

import { StarRating } from "@/components/reviews/star-rating";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { extractApiError } from "@/lib/api/client";
import { reviewsApi } from "@/lib/api/reviews";
import type { ReviewTargetType } from "@/lib/api/types";

interface ReviewFormProps {
  bookingId: number;
  target: { type: "house"; houseId: number } | { type: "user"; userId: number };
  title: string;
  subtitle: string;
  onSuccess?: () => void;
}

export function ReviewForm({ bookingId, target, title, subtitle, onSuccess }: ReviewFormProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        booking_id: bookingId,
        target_type: target.type as ReviewTargetType,
        house_id: target.type === "house" ? target.houseId : undefined,
        target_user_id: target.type === "user" ? target.userId : undefined,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["houses"] });
      setRating(0);
      setComment("");
      onSuccess?.();
    },
    onError: (e) => setError(extractApiError(e)),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (rating === 0) {
          setError("Yulduz tanlang");
          return;
        }
        mutation.mutate();
      }}
      className="rounded-2xl border bg-card p-6"
    >
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      <div className="mt-5 space-y-4">
        <div>
          <Label className="mb-2 block">Bahoyingiz</Label>
          <StarRating value={rating} onChange={setRating} size="lg" showLabel />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="comment">Sharh (ixtiyoriy)</Label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full rounded-lg border border-input bg-card p-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            placeholder="Tajribangiz haqida yozing..."
          />
          <p className="text-right text-[11px] text-muted-foreground">{comment.length}/2000</p>
        </div>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending || rating === 0}
          className="shadow-md"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Sharhni yuborish
        </Button>
      </div>
    </form>
  );
}
