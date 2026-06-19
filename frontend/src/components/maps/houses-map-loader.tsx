"use client";

import dynamic from "next/dynamic";

import type { HouseListItem } from "@/lib/api/types";

const YandexHousesMap = dynamic(
  () => import("./yandex-houses-map").then((m) => m.YandexHousesMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex animate-pulse items-center justify-center rounded-2xl border bg-muted/40 text-sm text-muted-foreground"
        style={{ height: 600 }}
      >
        Xarita yuklanmoqda...
      </div>
    ),
  },
);

export function HousesMapLazy(props: {
  houses: HouseListItem[];
  height?: number | string;
  selectedId?: number;
}) {
  return <YandexHousesMap houses={props.houses} height={props.height} />;
}
