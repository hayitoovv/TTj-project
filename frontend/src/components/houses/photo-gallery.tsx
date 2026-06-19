"use client";

import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import type { HousePhotoRead } from "@/lib/api/types";
import { fullUploadUrl } from "@/lib/api/uploads";

export function PhotoGallery({ photos, title }: { photos: HousePhotoRead[]; title: string }) {
  const sorted = [...photos].sort(
    (a, b) => Number(b.is_main) - Number(a.is_main) || a.order_num - b.order_num,
  );
  const [current, setCurrent] = useState(0);

  if (sorted.length === 0) {
    return (
      <div className="relative flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-yellow-100">
        <ImageIcon className="h-16 w-16 text-muted-foreground/40" />
      </div>
    );
  }

  const main = sorted[current];
  const next = () => setCurrent((c) => (c + 1) % sorted.length);
  const prev = () => setCurrent((c) => (c - 1 + sorted.length) % sorted.length);

  return (
    <div className="grid gap-2">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
        <Image
          src={fullUploadUrl(main.url) ?? main.url}
          alt={title}
          fill
          sizes="(min-width: 1024px) 67vw, 100vw"
          className="object-cover"
          priority
        />
        {sorted.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Oldingi rasm"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-md backdrop-blur transition hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              aria-label="Keyingi rasm"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-md backdrop-blur transition hover:bg-background"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 right-3 rounded-md bg-background/90 px-2 py-1 text-xs font-medium backdrop-blur">
              {current + 1} / {sorted.length}
            </div>
          </>
        )}
      </div>

      {sorted.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {sorted.slice(0, 5).map((p, i) => (
            <button
              key={p.id}
              onClick={() => setCurrent(i)}
              className={`relative aspect-square overflow-hidden rounded-lg ring-offset-background transition focus:outline-none focus:ring-2 focus:ring-ring ${
                i === current ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={fullUploadUrl(p.url) ?? p.url} alt="" fill sizes="20vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
