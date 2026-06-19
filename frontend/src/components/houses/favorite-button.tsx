"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";

import { favoritesApi } from "@/lib/api/favorites";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

interface FavoriteButtonProps {
  houseId: number;
  initiallyFavorited?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "floating" | "inline";
  className?: string;
}

const SIZES = {
  sm: { btn: "h-8 w-8", icon: "h-4 w-4" },
  md: { btn: "h-10 w-10", icon: "h-5 w-5" },
  lg: { btn: "h-12 w-12", icon: "h-6 w-6" },
};

export function FavoriteButton({
  houseId,
  initiallyFavorited = false,
  size = "md",
  variant = "floating",
  className,
}: FavoriteButtonProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  const isFavorited = optimistic ?? initiallyFavorited;

  const mutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        await favoritesApi.remove(houseId);
      } else {
        await favoritesApi.add(houseId);
      }
    },
    onMutate: async () => {
      setOptimistic(!isFavorited);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["houses"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => {
      setOptimistic(initiallyFavorited);
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    mutation.mutate();
  };

  const s = SIZES[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={mutation.isPending}
      aria-label={isFavorited ? "Saqlangandan olib tashlash" : "Saqlash"}
      className={cn(
        "flex items-center justify-center rounded-full transition-all",
        variant === "floating" &&
          "bg-white/95 shadow-md backdrop-blur hover:scale-110 hover:bg-white",
        variant === "inline" && "border bg-card hover:bg-muted",
        s.btn,
        className,
      )}
    >
      {mutation.isPending ? (
        <Loader2 className={cn("animate-spin text-muted-foreground", s.icon)} />
      ) : (
        <Heart
          className={cn(
            s.icon,
            "transition-colors",
            isFavorited
              ? "fill-red-500 text-red-500"
              : "text-muted-foreground hover:text-red-500",
          )}
        />
      )}
    </button>
  );
}
