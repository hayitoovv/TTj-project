"use client";

import { ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { fullUploadUrl } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";

interface HouseImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackIconSize?: string;
  /** Milliseconds before giving up on a hanging image (default: 6s) */
  timeoutMs?: number;
}

export function HouseImage({
  src,
  alt,
  className,
  fallbackIconSize = "h-12 w-12",
  timeoutMs = 6000,
}: HouseImageProps) {
  const [broken, setBroken] = useState(false);
  const url = src ? (fullUploadUrl(src) ?? src) : null;
  const loadedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBroken(false);
    loadedRef.current = false;
    if (!url) return;

    timerRef.current = setTimeout(() => {
      if (!loadedRef.current) setBroken(true);
    }, timeoutMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [url, timeoutMs]);

  if (!url || broken) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-yellow-100",
          className,
        )}
      >
        <ImageIcon className={cn(fallbackIconSize, "text-muted-foreground/40")} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
      onLoad={() => {
        loadedRef.current = true;
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
