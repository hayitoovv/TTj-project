"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Crosshair, Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { loadYmaps } from "@/lib/yandex-maps-loader";

interface YandexAddressPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number, address?: string) => void;
  height?: number | string;
}

export function YandexAddressPicker({
  latitude,
  longitude,
  onChange,
  height = 360,
}: YandexAddressPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const inputId = useId();
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let mounted = true;

    loadYmaps()
      .then((ymaps) => {
        if (!mounted || !containerRef.current) return;

        const map = new ymaps.Map(containerRef.current, {
          center: [latitude, longitude],
          zoom: 13,
          controls: ["zoomControl", "geolocationControl"],
        });
        mapRef.current = map;

        const placemark = new ymaps.Placemark(
          [latitude, longitude],
          { hintContent: "Marker'ni sudrab joyini o'zgartiring" },
          {
            draggable: true,
            preset: "islands#redDotIcon",
          },
        );
        placemarkRef.current = placemark;
        map.geoObjects.add(placemark);

        placemark.events.add("dragend", () => {
          const coords = placemark.geometry.getCoordinates();
          reverseGeocode(ymaps, coords).then((addr) => {
            onChangeRef.current(coords[0], coords[1], addr);
            if (addr && inputRef.current) inputRef.current.value = addr;
          });
        });

        map.events.add("click", (e: any) => {
          const coords = e.get("coords");
          placemark.geometry.setCoordinates(coords);
          reverseGeocode(ymaps, coords).then((addr) => {
            onChangeRef.current(coords[0], coords[1], addr);
            if (addr && inputRef.current) inputRef.current.value = addr;
          });
        });

        // Suggest dropdown on input
        if (inputRef.current) {
          const suggest = new ymaps.SuggestView(inputRef.current, {
            results: 6,
            boundedBy: [
              [37.0, 56.0],
              [45.5, 73.5],
            ], // Uzbekistan bounding box
          });
          suggest.events.add("select", (e: any) => {
            const value = e.get("item").value;
            ymaps.geocode(value, { results: 1 }).then((res: any) => {
              const first = res.geoObjects.get(0);
              if (first) {
                const coords = first.geometry.getCoordinates();
                placemark.geometry.setCoordinates(coords);
                map.setCenter(coords, 16);
                onChangeRef.current(coords[0], coords[1], value);
              }
            });
          });
        }
      })
      .catch((err) => console.error("Yandex Maps load failed:", err));

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
        placemarkRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchAddress = async (query?: string) => {
    setSearchError(null);
    const value = (query ?? inputRef.current?.value ?? "").trim();
    if (!value) return;
    if (!mapRef.current || !placemarkRef.current) {
      setSearchError("Xarita yuklanmadi");
      return;
    }

    setSearching(true);
    try {
      const enrichedQuery = /uzbekistan|o'zbekiston|узбекистан/i.test(value)
        ? value
        : `${value}, Uzbekistan`;
      const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ?? "";
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&format=json&lang=uz_UZ&results=1&geocode=${encodeURIComponent(enrichedQuery)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSearchError(`Server xatosi (${res.status})`);
        return;
      }
      const data = await res.json();
      const featureMember = data?.response?.GeoObjectCollection?.featureMember ?? [];
      if (featureMember.length === 0) {
        setSearchError(`"${value}" — manzil topilmadi`);
        return;
      }
      const geo = featureMember[0].GeoObject;
      const [lng, lat] = String(geo.Point.pos).split(" ").map(Number);
      const addr =
        geo?.metaDataProperty?.GeocoderMetaData?.text ?? geo?.name ?? value;
      placemarkRef.current.geometry.setCoordinates([lat, lng]);
      mapRef.current.setCenter([lat, lng], 16);
      onChangeRef.current(lat, lng, addr);
      if (inputRef.current) inputRef.current.value = addr;
    } catch (err: any) {
      console.error("Geocode failed:", err);
      const msg = err?.message || "Tarmoq xatosi";
      setSearchError(msg);
    } finally {
      setSearching(false);
    }
  };

  const detectLocation = () => {
    setLocateError(null);
    if (!("geolocation" in navigator)) {
      setLocateError("Brauzeringiz lokatsiyani qo'llab-quvvatlamaydi");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const ymaps = (window as any).ymaps;
        if (placemarkRef.current && mapRef.current && ymaps) {
          placemarkRef.current.geometry.setCoordinates([lat, lng]);
          mapRef.current.setCenter([lat, lng], 16);
          const addr = await reverseGeocode(ymaps, [lat, lng]);
          onChangeRef.current(lat, lng, addr);
          if (addr && inputRef.current) inputRef.current.value = addr;
        } else {
          onChangeRef.current(lat, lng);
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocateError(
            "Lokatsiyaga ruxsat bermagansiz. Brauzer sozlamalarida ruxsat bering.",
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocateError("Hozirgi joyingizni aniqlab bo'lmadi");
        } else {
          setLocateError("Lokatsiya xatosi");
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  // Sync external lat/lng changes (e.g., manual input edit)
  useEffect(() => {
    if (!placemarkRef.current || !mapRef.current) return;
    const current = placemarkRef.current.geometry.getCoordinates();
    if (Math.abs(current[0] - latitude) > 0.000001 || Math.abs(current[1] - longitude) > 0.000001) {
      placemarkRef.current.geometry.setCoordinates([latitude, longitude]);
      mapRef.current.setCenter([latitude, longitude]);
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 rounded-lg border-l-4 border-l-primary bg-primary/5 p-3 text-xs">
        <Crosshair className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <p>
          Manzil yozib qidiring, xaritada bosing yoki marker&apos;ni sudrang —
          koordinatalar avtomatik to&apos;ladi.
        </p>
      </div>

      <div className="flex flex-wrap items-stretch gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            placeholder="Manzilni yozing — TUIT, Yunusobod, Mirobod..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                void searchAddress();
              }
            }}
            className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-12 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
          />
          <button
            type="button"
            onClick={() => void searchAddress()}
            disabled={searching}
            aria-label="Manzilni qidirish"
            className="absolute right-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={detectLocation}
          disabled={locating}
          className="h-11 shrink-0 shadow-sm"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4 text-primary" />
          )}
          {locating ? "Aniqlanmoqda..." : "Mening joyim"}
        </Button>
      </div>
      {(locateError || searchError) && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {locateError ?? searchError}
        </p>
      )}

      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl border bg-card"
        style={{ height }}
      />

      <p className="text-[11px] text-muted-foreground">
        Tanlangan: <span className="font-mono">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
      </p>
    </div>
  );
}

async function reverseGeocode(ymaps: any, coords: [number, number]): Promise<string | undefined> {
  try {
    const res = await ymaps.geocode(coords, { results: 1 });
    const first = res.geoObjects.get(0);
    return first?.getAddressLine?.();
  } catch {
    return undefined;
  }
}
