"use client";

import { ArrowRight, Bed, ImageIcon, MapPin, Star } from "lucide-react";
import Link from "next/link";

import { useHouses } from "@/lib/api/hooks";
import type { HouseListItem } from "@/lib/api/types";
import { fullUploadUrl } from "@/lib/api/uploads";
import { formatPrice } from "@/lib/utils";

export function RecommendedHouses() {
  const { data, isLoading } = useHouses({ page: 1, page_size: 3, sort: "created_desc" });
  const items = data?.items ?? [];

  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Tavsiya etilgan uylar</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Yangi qo&apos;shilgan eng so&apos;nggi e&apos;lonlar
          </p>
        </div>
        <Link
          href="/houses"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Barchasini ko&apos;rish
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Hozircha tavsiya uchun uylar yo&apos;q. Tez orada paydo bo&apos;ladi.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((h) => (
            <MiniHouseCard key={h.id} house={h} />
          ))}
        </div>
      )}
    </section>
  );
}

function MiniHouseCard({ house }: { house: HouseListItem }) {
  return (
    <Link
      href={`/houses/${house.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {house.main_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fullUploadUrl(house.main_photo) ?? house.main_photo}
            alt={house.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-yellow-100">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        {house.is_top && (
          <span className="absolute left-2 top-2 rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase">
            ⭐ TOP
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-semibold leading-tight">{house.title}</h3>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{house.region ?? house.address}</span>
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Bed className="h-3 w-3" /> {house.rooms} xona
          </span>
          {Number(house.average_rating) > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {Number(house.average_rating).toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-auto pt-3">
          <span className="text-base font-bold">
            {formatPrice(house.price_per_month, house.currency)}
            <span className="text-xs font-normal text-muted-foreground"> /oy</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
