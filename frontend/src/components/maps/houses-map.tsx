"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { ImageIcon, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import type { HouseListItem } from "@/lib/api/types";
import { fullUploadUrl } from "@/lib/api/uploads";
import { formatPrice } from "@/lib/utils";

// Fix default marker icon (Leaflet expects images path)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const PrimaryIcon = L.divIcon({
  html: `
    <div style="position: relative;">
      <div style="
        width: 36px; height: 36px; border-radius: 50%;
        background: linear-gradient(135deg, hsl(222 89% 47%), hsl(45 96% 53%));
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: 700; font-size: 14px;
      ">🏠</div>
    </div>
  `,
  className: "ttj-marker",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

const TASHKENT_CENTER: [number, number] = [41.2995, 69.2401];

interface HousesMapProps {
  houses: HouseListItem[];
  height?: number | string;
  selectedId?: number;
}

export function HousesMap({ houses, height = 600, selectedId }: HousesMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (houses.length === 0) return TASHKENT_CENTER;
    const lat = houses.reduce((s, h) => s + h.latitude, 0) / houses.length;
    const lng = houses.reduce((s, h) => s + h.longitude, 0) / houses.length;
    return [lat, lng];
  }, [houses]);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card" style={{ height }}>
      <MapContainer
        center={center}
        zoom={houses.length === 1 ? 15 : 12}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds houses={houses} />
        {houses.map((h) => (
          <Marker
            key={h.id}
            position={[h.latitude, h.longitude]}
            icon={selectedId === h.id ? PrimaryIcon : (DefaultIcon as L.Icon)}
          >
            <Popup minWidth={220}>
              <HousePopup house={h} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function FitBounds({ houses }: { houses: HouseListItem[] }) {
  const map = useMap();
  useEffect(() => {
    if (houses.length < 2) return;
    const bounds = L.latLngBounds(houses.map((h) => [h.latitude, h.longitude]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [houses, map]);
  return null;
}

function HousePopup({ house }: { house: HouseListItem }) {
  return (
    <Link href={`/houses/${house.id}`} className="block min-w-[200px]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-muted">
        {house.main_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fullUploadUrl(house.main_photo) ?? house.main_photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-100 to-yellow-100">
            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        {house.is_top && (
          <span className="absolute left-1.5 top-1.5 rounded bg-gradient-to-r from-yellow-400 to-orange-500 px-1.5 py-0.5 text-[9px] font-bold uppercase">
            TOP
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-semibold">{house.title}</p>
      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{house.region}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-sm font-bold">{formatPrice(house.price_per_month, house.currency)}</span>
        {Number(house.average_rating) > 0 && (
          <span className="inline-flex items-center gap-0.5 text-xs">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {Number(house.average_rating).toFixed(1)}
          </span>
        )}
      </div>
    </Link>
  );
}
