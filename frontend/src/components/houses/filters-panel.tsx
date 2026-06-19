"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAmenities } from "@/lib/api/hooks";
import type { Currency, HouseFilter } from "@/lib/api/types";

export interface FiltersPanelProps {
  filters: HouseFilter;
  onChange: (next: HouseFilter) => void;
  onReset: () => void;
}

const REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Samarqand",
  "Buxoro",
  "Andijon",
  "Farg'ona",
  "Namangan",
  "Qashqadaryo",
  "Surxondaryo",
  "Sirdaryo",
  "Jizzax",
  "Navoiy",
  "Xorazm",
  "Qoraqalpog'iston",
];

const ROOMS = [1, 2, 3, 4, 5];
const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "UZS", label: "So'm" },
  { value: "USD", label: "Dollar" },
];

export function FiltersPanel({ filters, onChange, onReset }: FiltersPanelProps) {
  const { data: amenities } = useAmenities();

  const update = <K extends keyof HouseFilter>(key: K, value: HouseFilter[K] | undefined) =>
    onChange({ ...filters, [key]: value, page: 1 });

  const toggleAmenity = (id: number) => {
    const current = new Set(filters.amenity_ids ?? []);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    onChange({
      ...filters,
      amenity_ids: current.size ? Array.from(current) : undefined,
      page: 1,
    });
  };

  const activeCount =
    [
      filters.q,
      filters.region,
      filters.min_price,
      filters.max_price,
      filters.rooms,
      filters.currency,
    ].filter((v) => v !== undefined && v !== null && v !== "").length +
    (filters.amenity_ids?.length ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Filterlar {activeCount > 0 && <span className="ml-1 text-primary">({activeCount})</span>}
        </h3>
        {activeCount > 0 && (
          <Button onClick={onReset} variant="ghost" size="sm" className="h-auto px-2 text-xs">
            <X className="h-3 w-3" /> Tozalash
          </Button>
        )}
      </div>

      <Section title="Narx">
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min"
            min={0}
            value={filters.min_price ?? ""}
            onChange={(e) => update("min_price", e.target.value ? Number(e.target.value) : undefined)}
          />
          <Input
            type="number"
            placeholder="Max"
            min={0}
            value={filters.max_price ?? ""}
            onChange={(e) => update("max_price", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        <div className="mt-2 flex gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() =>
                update("currency", filters.currency === c.value ? undefined : c.value)
              }
              className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                filters.currency === c.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Xonalar soni">
        <div className="grid grid-cols-5 gap-2">
          {ROOMS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update("rooms", filters.rooms === n ? undefined : n)}
              className={`rounded-md border py-2 text-sm font-medium transition ${
                filters.rooms === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-muted"
              }`}
            >
              {n === 5 ? "5+" : n}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Hudud">
        <select
          value={filters.region ?? ""}
          onChange={(e) => update("region", e.target.value || undefined)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Barcha hududlar</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <Input
          className="mt-2"
          placeholder="Tuman"
          value={filters.district ?? ""}
          onChange={(e) => update("district", e.target.value || undefined)}
        />
      </Section>

      {amenities && amenities.length > 0 && (
        <Section title="Qulayliklar">
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {amenities.map((a) => {
              const checked = filters.amenity_ids?.includes(a.id) ?? false;
              return (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAmenity(a.id)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="flex-1">{a.name}</span>
                </label>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
