"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { Crosshair, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

const PinIcon = L.divIcon({
  html: `
    <div style="
      width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
      background: linear-gradient(135deg, hsl(222 89% 47%), hsl(45 96% 53%));
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      transform: rotate(-45deg);
    "></div>
  `,
  className: "ttj-pin",
  iconSize: [32, 32],
  iconAnchor: [16, 28],
});

interface AddressPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  height?: number | string;
}

export function AddressPicker({ latitude, longitude, onChange, height = 320 }: AddressPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 rounded-lg border-l-4 border-l-primary bg-primary/5 p-3 text-xs">
        <Crosshair className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <p>
          Xaritada uy joyini bosing — koordinatalar avtomatik to&apos;ldiriladi. Marker&apos;ni
          sudrab yangi joyga qo&apos;yishingiz ham mumkin.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card" style={{ height }}>
        <MapContainer
          center={[latitude, longitude]}
          zoom={13}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={onChange} />
          <RecenterOnChange position={[latitude, longitude]} />
          <Marker
            position={[latitude, longitude]}
            icon={PinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const m = e.target as L.Marker;
                const p = m.getLatLng();
                onChange(p.lat, p.lng);
              },
            }}
          />
        </MapContainer>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </span>
      </div>
    </div>
  );
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onChange(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

function RecenterOnChange({ position }: { position: [number, number] }) {
  const map = useMap();
  const last = useRef<[number, number]>(position);
  useEffect(() => {
    const [lat, lng] = position;
    const [lastLat, lastLng] = last.current;
    if (Math.abs(lat - lastLat) > 0.001 || Math.abs(lng - lastLng) > 0.001) {
      map.setView(position, map.getZoom());
      last.current = position;
    }
  }, [position, map]);
  return null;
}

// Lazy-loaded wrapper to avoid SSR issues with leaflet
const [useLazy, setUseLazy] = (() => {
  let cached: typeof AddressPicker | null = null;
  return [
    () => cached,
    (v: typeof AddressPicker) => {
      cached = v;
    },
  ] as const;
})();
setUseLazy(AddressPicker);
useLazy;
