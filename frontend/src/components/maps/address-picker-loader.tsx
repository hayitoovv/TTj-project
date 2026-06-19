"use client";

import dynamic from "next/dynamic";

const YandexAddressPicker = dynamic(
  () => import("./yandex-address-picker").then((m) => m.YandexAddressPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 animate-pulse items-center justify-center rounded-2xl border bg-muted/40 text-sm text-muted-foreground">
        Xarita yuklanmoqda...
      </div>
    ),
  },
);

export function AddressPickerLazy(props: {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number, address?: string) => void;
  height?: number | string;
}) {
  return <YandexAddressPicker {...props} />;
}
