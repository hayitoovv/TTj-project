"use client";

import { ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";

interface SingleHouseMapProps {
  latitude: number;
  longitude: number;
  address: string;
  zoom?: number;
}

export function SingleHouseMap({
  latitude,
  longitude,
  address,
  zoom = 16,
}: SingleHouseMapProps) {
  // Yandex Maps widget URL — no API key needed for embed
  // pm2rdm = red diamond placemark style
  const widgetUrl = `https://yandex.uz/map-widget/v1/?ll=${longitude}%2C${latitude}&z=${zoom}&pt=${longitude}%2C${latitude}%2Cpm2rdm&lang=uz_UZ`;
  const openMapsUrl = `https://yandex.uz/maps/?ll=${longitude}%2C${latitude}&z=${zoom}&pt=${longitude}%2C${latitude}`;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      {/* Address bar */}
      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{address}</p>
            <p className="text-[11px] text-muted-foreground">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          </div>
        </div>
        <Link
          href={openMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-background px-2.5 py-1.5 text-xs font-semibold transition hover:bg-muted"
        >
          Yandex&apos;da ochish
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Map iframe */}
      <iframe
        src={widgetUrl}
        title="Yandex map"
        width="100%"
        height="360"
        loading="lazy"
        className="block w-full border-0"
        allow="geolocation"
      />
    </div>
  );
}
