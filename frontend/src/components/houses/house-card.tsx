import { Bed, ImageIcon, Lock, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FavoriteButton } from "@/components/houses/favorite-button";
import type { HouseListItem } from "@/lib/api/types";
import { fullUploadUrl } from "@/lib/api/uploads";
import { cn, formatPrice } from "@/lib/utils";

export function HouseCard({ house }: { house: HouseListItem }) {
  const isRented = house.status === "rented";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-xl">
      <Link
        href={`/houses/${house.id}`}
        aria-label={house.title}
        className="absolute inset-0 z-0"
      />

      <div className="pointer-events-none relative aspect-[4/3] overflow-hidden bg-muted">
        {house.main_photo ? (
          <Image
            src={fullUploadUrl(house.main_photo) ?? house.main_photo}
            alt={house.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={cn(
              "object-cover transition-transform duration-500 group-hover:scale-105",
              isRented && "grayscale-[40%]",
            )}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-yellow-100">
            <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}

        {isRented && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 backdrop-blur-[1px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
              <Lock className="h-3.5 w-3.5" />
              Ijaraga olingan
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {house.is_top && (
            <span className="rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase text-foreground shadow-sm">
              ⭐ Top
            </span>
          )}
          {house.distance_km !== null && house.distance_km !== undefined && (
            <span className="rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
              📍 {house.distance_km.toFixed(1)} km
            </span>
          )}
        </div>

        {house.average_rating && Number(house.average_rating) > 0 && (
          <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-md bg-background/90 px-2 py-0.5 text-xs font-semibold backdrop-blur">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {Number(house.average_rating).toFixed(1)}
            <span className="text-muted-foreground">({house.reviews_count})</span>
          </div>
        )}
      </div>

      {/* Favorite button — sibling of the Link so its clicks never bubble to navigation */}
      <div className="pointer-events-auto absolute right-3 top-3 z-10">
        <FavoriteButton
          houseId={house.id}
          initiallyFavorited={house.is_favorited ?? false}
          size="sm"
          variant="floating"
        />
      </div>

      <div className="pointer-events-none relative flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 font-semibold leading-tight">{house.title}</h3>
        </div>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">
            {[house.region, house.district].filter(Boolean).join(", ") || house.address}
          </span>
        </p>

        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" />
            {house.rooms} xona
          </span>
          {house.area_sqm && (
            <span>
              {Number(house.area_sqm)} m<sup>2</sup>
            </span>
          )}
        </div>

        <div className="mt-auto pt-4">
          <div className="text-lg font-bold text-foreground">
            {formatPrice(house.price_per_month, house.currency)}
            <span className="text-xs font-normal text-muted-foreground"> /oy</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function HouseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
