"use client";

import { Crown } from "lucide-react";

import { cn } from "@/lib/utils";

interface ProBadgeProps {
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "soft";
  className?: string;
}

export function ProBadge({
  size = "md",
  variant = "solid",
  className,
}: ProBadgeProps) {
  const dims =
    size === "sm"
      ? "px-1.5 py-0.5 text-[10px] gap-0.5"
      : size === "lg"
        ? "px-3 py-1 text-sm gap-1.5"
        : "px-2 py-0.5 text-xs gap-1";

  const iconSize =
    size === "sm" ? "h-2.5 w-2.5" : size === "lg" ? "h-4 w-4" : "h-3 w-3";

  const tone =
    variant === "solid"
      ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-foreground shadow-sm"
      : "border border-yellow-300 bg-yellow-50 text-orange-700";

  return (
    <span
      title="PRO obuna faol"
      className={cn(
        "inline-flex items-center rounded-full font-bold uppercase tracking-wider",
        dims,
        tone,
        className,
      )}
    >
      <Crown className={cn("shrink-0", iconSize)} />
      PRO
    </span>
  );
}
