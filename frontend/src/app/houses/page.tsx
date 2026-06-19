"use client";

import { ChevronLeft, ChevronRight, LayoutGrid, MapIcon, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { EmptyState } from "@/components/houses/empty-state";
import { FiltersPanel } from "@/components/houses/filters-panel";
import { HouseCard, HouseCardSkeleton } from "@/components/houses/house-card";
import { SearchBar } from "@/components/houses/search-bar";
import { SortDropdown } from "@/components/houses/sort-dropdown";
import { HousesMapLazy } from "@/components/maps/houses-map-loader";
import { Button } from "@/components/ui/button";
import { useHouses } from "@/lib/api/hooks";
import type { HouseFilter } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "map";

function parseFilters(sp: URLSearchParams): HouseFilter {
  const num = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);
  const amenityIds = sp.getAll("amenity_ids").map(Number).filter((n) => !Number.isNaN(n));
  return {
    q: sp.get("q") ?? undefined,
    region: sp.get("region") ?? undefined,
    district: sp.get("district") ?? undefined,
    min_price: num(sp.get("min_price")),
    max_price: num(sp.get("max_price")),
    currency: (sp.get("currency") as HouseFilter["currency"]) ?? undefined,
    rooms: num(sp.get("rooms")),
    amenity_ids: amenityIds.length ? amenityIds : undefined,
    sort: (sp.get("sort") as HouseFilter["sort"]) ?? "created_desc",
    page: num(sp.get("page")) ?? 1,
    page_size: 12,
  };
}

function filtersToQuery(filters: HouseFilter): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    if (key === "page_size") continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
    else params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export default function HousesPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const filters = useMemo(() => parseFilters(sp), [sp]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");

  const setFilters = useCallback(
    (next: HouseFilter) => router.replace(`/houses${filtersToQuery(next)}`, { scroll: false }),
    [router],
  );

  const reset = useCallback(
    () => router.replace("/houses", { scroll: false }),
    [router],
  );

  const { data, isLoading, isFetching, isError, refetch } = useHouses(filters);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Uylarni <span className="text-gradient-brand">qidirish</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data?.total !== undefined ? (
            <>
              <strong className="text-foreground">{data.total}</strong> ta uy topildi
            </>
          ) : (
            "Yuklanmoqda..."
          )}
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[260px]">
          <SearchBar
            value={filters.q ?? ""}
            onChange={(q) => setFilters({ ...filters, q: q || undefined, page: 1 })}
          />
        </div>
        <Button
          variant="outline"
          className="lg:hidden"
          onClick={() => setDrawerOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filterlar
        </Button>
        <SortDropdown
          value={filters.sort}
          onChange={(s) => setFilters({ ...filters, sort: s, page: 1 })}
        />
        {/* View toggle */}
        <div className="inline-flex rounded-lg border bg-card p-0.5">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
              view === "grid"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Ro&apos;yxat
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
              view === "map"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Xarita
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border bg-card p-5">
            <FiltersPanel filters={filters} onChange={setFilters} onReset={reset} />
          </div>
        </aside>

        {/* mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-background p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filterlar</h3>
                <button onClick={() => setDrawerOpen(false)} className="rounded-md p-1 hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5">
                <FiltersPanel filters={filters} onChange={setFilters} onReset={reset} />
              </div>
              <Button className="mt-6 w-full" onClick={() => setDrawerOpen(false)}>
                Ko&apos;rsatish
              </Button>
            </div>
          </div>
        )}

        {/* results */}
        <section>
          {isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
              <p className="font-semibold text-destructive">Xatolik yuz berdi</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Qayta urinish
              </Button>
            </div>
          ) : isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <HouseCardSkeleton key={i} />
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <EmptyState onReset={reset} />
          ) : view === "map" ? (
            <HousesMapLazy houses={data?.items ?? []} height={680} />
          ) : (
            <>
              <div
                className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 ${
                  isFetching ? "opacity-70" : ""
                } transition-opacity`}
              >
                {data?.items.map((h) => (
                  <HouseCard key={h.id} house={h} />
                ))}
              </div>
              {data && data.pages > 1 && (
                <Pagination
                  page={filters.page ?? 1}
                  pages={data.pages}
                  onChange={(p) => setFilters({ ...filters, page: p })}
                />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}) {
  const buttons: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) buttons.push(i);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1">
      <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {buttons.map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "ghost"}
          size="icon"
          onClick={() => onChange(p)}
        >
          {p}
        </Button>
      ))}
      <Button
        variant="outline"
        size="icon"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
