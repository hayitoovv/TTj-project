"use client";

import { ArrowRight, Bed, Eye, MapPin, Sparkles, Star } from "lucide-react";
import Link from "next/link";

import { HouseImage } from "@/components/houses/house-image";
import { Button } from "@/components/ui/button";
import { useHouses } from "@/lib/api/hooks";
import { formatPrice } from "@/lib/utils";

export function FeaturedHouses() {
  const { data, isLoading } = useHouses({
    page: 1,
    page_size: 8,
    sort: "created_desc",
  });

  const houses = (data?.items ?? []).slice(0, 8);

  return (
    <section className="container mx-auto max-w-6xl px-4 py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            <Sparkles className="h-3 w-3" /> Yangi e&apos;lonlar
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Bugun joylangan <span className="text-gradient-brand">uylar</span>
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Tasdiqlangan uy egalari joylagan eng so&apos;nggi e&apos;lonlar. Yoqqanini tanlang.
          </p>
        </div>
        <Button asChild variant="outline" className="border-foreground/20">
          <Link href="/houses">
            Barchasini ko&apos;rish
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl bg-muted/50"
              />
            ))
          : houses.length === 0
            ? (
              <div className="col-span-full rounded-2xl border border-dashed bg-muted/20 p-12 text-center text-sm text-muted-foreground">
                Hozircha e&apos;lonlar yo&apos;q. Birinchi bo&apos;ling!
              </div>
            )
            : houses.slice(0, 4).map((h) => (
                <Link
                  key={h.id}
                  href={`/houses/${h.id}`}
                  className="group overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <HouseImage
                      src={h.main_photo}
                      alt={h.title}
                      className="transition-transform duration-500 group-hover:scale-110"
                    />
                    {h.is_top && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 text-[10px] font-bold uppercase">
                        ⭐ TOP
                      </span>
                    )}
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-background/95 px-2 py-1 text-[11px] font-semibold backdrop-blur">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      {h.views_count}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 font-semibold">{h.title}</h3>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="line-clamp-1">
                        {[h.region, h.district].filter(Boolean).join(", ") || h.address}
                      </span>
                    </p>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-lg font-extrabold tracking-tight">
                          {formatPrice(h.price_per_month, h.currency)}
                        </p>
                        <p className="-mt-1 text-[10px] text-muted-foreground">oyiga</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-0.5">
                          <Bed className="h-3 w-3" /> {h.rooms} xona
                        </span>
                        {Number(h.average_rating) > 0 && (
                          <span className="inline-flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {Number(h.average_rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
      </div>
    </section>
  );
}
