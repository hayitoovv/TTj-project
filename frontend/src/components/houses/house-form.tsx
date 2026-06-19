"use client";

import { ImagePlus, Loader2, MapPin } from "lucide-react";
import { useState } from "react";

import { AddressPickerLazy } from "@/components/maps/address-picker-loader";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAmenities } from "@/lib/api/hooks";
import type { HouseCreateInput } from "@/lib/api/houses";
import type { Currency } from "@/lib/api/types";

export interface HouseFormProps {
  initial?: Partial<HouseCreateInput>;
  onSubmit: (data: HouseCreateInput) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
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

const TASHKENT_LAT = 41.2995;
const TASHKENT_LNG = 69.2401;

export function HouseForm({
  initial = {},
  onSubmit,
  submitLabel = "Saqlash",
  isSubmitting,
  error,
}: HouseFormProps) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [region, setRegion] = useState(initial.region ?? "Toshkent shahri");
  const [district, setDistrict] = useState(initial.district ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [latitude, setLatitude] = useState<string>(
    initial.latitude !== undefined ? String(initial.latitude) : String(TASHKENT_LAT),
  );
  const [longitude, setLongitude] = useState<string>(
    initial.longitude !== undefined ? String(initial.longitude) : String(TASHKENT_LNG),
  );
  const [rooms, setRooms] = useState<string>(initial.rooms ? String(initial.rooms) : "1");
  const [areaSqm, setAreaSqm] = useState<string>(initial.area_sqm ? String(initial.area_sqm) : "");
  const [maxTenants, setMaxTenants] = useState<string>(
    initial.max_tenants ? String(initial.max_tenants) : "",
  );
  const [floor, setFloor] = useState<string>(initial.floor ? String(initial.floor) : "");
  const [totalFloors, setTotalFloors] = useState<string>(
    initial.total_floors ? String(initial.total_floors) : "",
  );
  const [pricePerMonth, setPricePerMonth] = useState<string>(
    initial.price_per_month ? String(initial.price_per_month) : "",
  );
  const [currency, setCurrency] = useState<Currency>(initial.currency ?? "UZS");
  const [depositAmount, setDepositAmount] = useState<string>(
    initial.deposit_amount ? String(initial.deposit_amount) : "",
  );
  const [amenityIds, setAmenityIds] = useState<number[]>(initial.amenity_ids ?? []);
  const [photoUrls, setPhotoUrls] = useState<string[]>(initial.photo_urls ?? [""]);

  const { data: amenities = [] } = useAmenities();

  const toggleAmenity = (id: number) => {
    setAmenityIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: HouseCreateInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      region: region || undefined,
      district: district.trim() || undefined,
      address: address.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      rooms: Number(rooms),
      area_sqm: areaSqm ? Number(areaSqm) : undefined,
      max_tenants: maxTenants ? Number(maxTenants) : undefined,
      floor: floor ? Number(floor) : undefined,
      total_floors: totalFloors ? Number(totalFloors) : undefined,
      price_per_month: Number(pricePerMonth),
      currency,
      deposit_amount: depositAmount ? Number(depositAmount) : undefined,
      amenity_ids: amenityIds,
      photo_urls: photoUrls.map((p) => p.trim()).filter(Boolean),
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Asosiy ma'lumotlar" subtitle="E'lon nomi va tavsifi">
        <div className="space-y-1.5">
          <Label htmlFor="title">Sarlavha *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masalan: 2 xonali, TUIT yaqinida"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Tavsif</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Uy haqida batafsil — mebel, joylashuv, transport..."
            className="w-full rounded-lg border border-input bg-card p-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
          />
        </div>
      </Section>

      <Section title="Manzil" subtitle="Uy joylashgan joy" icon={MapPin}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Hudud *</Label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
              required
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="district">Tuman</Label>
            <Input
              id="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Yunusobod"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">To&apos;liq manzil *</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Amir Temur shoh ko'chasi 110, 4-uy"
            required
          />
        </div>
        <AddressPickerLazy
          latitude={Number(latitude) || TASHKENT_LAT}
          longitude={Number(longitude) || TASHKENT_LNG}
          onChange={(lat, lng) => {
            setLatitude(lat.toFixed(6));
            setLongitude(lng.toFixed(6));
          }}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="latitude">Latitude *</Label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="longitude">Longitude *</Label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
            />
          </div>
        </div>
      </Section>

      <Section title="Uy detallari" subtitle="Xona, qavat, maydon">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="rooms">Xonalar soni *</Label>
            <Input
              id="rooms"
              type="number"
              min={1}
              max={20}
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="areaSqm">Maydon (m²)</Label>
            <Input
              id="areaSqm"
              type="number"
              step="0.1"
              value={areaSqm}
              onChange={(e) => setAreaSqm(e.target.value)}
              placeholder="55"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxTenants">Max yashash kishi</Label>
            <Input
              id="maxTenants"
              type="number"
              min={1}
              value={maxTenants}
              onChange={(e) => setMaxTenants(e.target.value)}
              placeholder="3"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="floor">Qavat</Label>
            <Input
              id="floor"
              type="number"
              min={0}
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="4"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="totalFloors">Jami qavat</Label>
            <Input
              id="totalFloors"
              type="number"
              min={1}
              value={totalFloors}
              onChange={(e) => setTotalFloors(e.target.value)}
              placeholder="9"
            />
          </div>
        </div>
      </Section>

      <Section title="Narx" subtitle="Oylik to'lov va depozit">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pricePerMonth">Oylik narx *</Label>
            <Input
              id="pricePerMonth"
              type="number"
              min={0}
              value={pricePerMonth}
              onChange={(e) => setPricePerMonth(e.target.value)}
              placeholder="2500000"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Valyuta *</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["UZS", "USD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`rounded-md border-2 py-2 text-sm font-semibold transition ${
                    currency === c
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input hover:bg-muted"
                  }`}
                >
                  {c === "UZS" ? "So'm" : "Dollar"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="depositAmount">Depozit (ixtiyoriy)</Label>
            <Input
              id="depositAmount"
              type="number"
              min={0}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="2500000"
            />
            <p className="text-[11px] text-muted-foreground">
              Odatda 1 oylik narxga teng bo&apos;ladi, ko&apos;chib chiqishda qaytariladi.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Qulayliklar" subtitle="Uyda mavjud bo'lgan narsalar">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {amenities.map((a) => {
            const checked = amenityIds.includes(a.id);
            return (
              <label
                key={a.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  checked
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAmenity(a.id)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="line-clamp-1">{a.name}</span>
              </label>
            );
          })}
        </div>
      </Section>

      <Section
        title="Rasmlar"
        subtitle="Uyning rasmlarini yuklang — birinchisi asosiy bo'ladi"
        icon={ImagePlus}
      >
        <ImageUploader
          urls={photoUrls.filter(Boolean)}
          onChange={(next) => setPhotoUrls(next.length ? next : [""])}
          subdir="houses"
          maxFiles={10}
        />
      </Section>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="sticky bottom-4 flex justify-end rounded-2xl border bg-card/95 p-4 shadow-lg backdrop-blur">
        <Button type="submit" size="lg" disabled={isSubmitting} className="shadow-md">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-6">
      <div className="mb-5 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <div>
          <h2 className="font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
