"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";

import { loadYmaps } from "@/lib/yandex-maps-loader";
import type { HouseListItem } from "@/lib/api/types";
import { fullUploadUrl } from "@/lib/api/uploads";
import { formatPrice } from "@/lib/utils";

interface YandexHousesMapProps {
  houses: HouseListItem[];
  height?: number | string;
}

const TASHKENT_CENTER: [number, number] = [41.2995, 69.2401];

export function YandexHousesMap({ houses, height = 600 }: YandexHousesMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const collectionRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    loadYmaps()
      .then((ymaps) => {
        if (!mounted || !containerRef.current) return;

        const initial: [number, number] =
          houses.length > 0 ? [houses[0].latitude, houses[0].longitude] : TASHKENT_CENTER;

        const map = new ymaps.Map(containerRef.current, {
          center: initial,
          zoom: houses.length === 1 ? 15 : 12,
          controls: ["zoomControl", "fullscreenControl", "geolocationControl"],
        });
        mapRef.current = map;

        const collection = new ymaps.GeoObjectCollection();
        collectionRef.current = collection;
        map.geoObjects.add(collection);

        renderMarkers(ymaps, collection, houses);

        if (houses.length > 1) {
          const bounds = collection.getBounds();
          if (bounds) {
            map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
          }
        }
      })
      .catch((err) => console.error("Yandex Maps load failed:", err));

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
        collectionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when houses change
  useEffect(() => {
    if (!mapRef.current || !collectionRef.current) return;
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    collectionRef.current.removeAll();
    renderMarkers(ymaps, collectionRef.current, houses);

    if (houses.length > 1) {
      const bounds = collectionRef.current.getBounds();
      if (bounds) {
        mapRef.current.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
      }
    } else if (houses.length === 1) {
      mapRef.current.setCenter([houses[0].latitude, houses[0].longitude], 15);
    }
  }, [houses]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-2xl border bg-card"
      style={{ height }}
    />
  );
}

function renderMarkers(ymaps: any, collection: any, houses: HouseListItem[]) {
  for (const h of houses) {
    const balloonContent = `
      <div style="min-width:220px;font-family:system-ui,sans-serif;">
        ${
          h.main_photo
            ? `<div style="position:relative;width:100%;aspect-ratio:16/10;background:#f1f5f9;border-radius:8px;overflow:hidden;margin-bottom:8px;">
                <img src="${escapeAttr(fullUploadUrl(h.main_photo) ?? h.main_photo)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />
                ${h.is_top ? `<span style="position:absolute;left:6px;top:6px;background:linear-gradient(90deg,#facc15,#f97316);color:#0f172a;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;text-transform:uppercase;">TOP</span>` : ""}
              </div>`
            : ""
        }
        <p style="margin:0 0 4px 0;font-weight:600;font-size:13px;line-height:1.3;color:#0f172a;">${escapeText(h.title)}</p>
        <p style="margin:0 0 8px 0;font-size:11px;color:#64748b;">${escapeText(h.region ?? h.address)}</p>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:13px;font-weight:700;color:#0f172a;">${escapeText(formatPrice(h.price_per_month, h.currency))}</span>
          <a href="/houses/${h.id}" style="background:hsl(222 89% 47%);color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;">Ko'rish →</a>
        </div>
      </div>
    `;

    const placemark = new ymaps.Placemark(
      [h.latitude, h.longitude],
      {
        balloonContent,
        hintContent: h.title,
      },
      {
        preset: h.is_top ? "islands#redIcon" : "islands#blueIcon",
        balloonCloseButton: true,
        hideIconOnBalloonOpen: false,
      },
    );

    collection.add(placemark);
  }
}

function escapeText(s: string): string {
  return String(s).replace(/[<>&"']/g, (ch) => {
    return (
      { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[ch] ?? ch
    );
  });
}

function escapeAttr(s: string): string {
  return escapeText(s);
}
