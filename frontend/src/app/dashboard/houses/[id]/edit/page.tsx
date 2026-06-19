"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { HouseForm } from "@/components/houses/house-form";
import { extractApiError } from "@/lib/api/client";
import { housesApi, type HouseCreateInput } from "@/lib/api/houses";
import { useHouse } from "@/lib/api/hooks";

export default function EditHousePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: house, isLoading } = useHouse(Number.isFinite(id) ? id : null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(data: HouseCreateInput) {
    setError(null);
    setSubmitting(true);
    try {
      await housesApi.update(id, data);
      router.push(`/dashboard/houses?updated=${id}`);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!house) {
    return (
      <div className="text-center py-20">
        <p>E&apos;lon topilmadi.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/houses"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        E&apos;lonlarga qaytish
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          E&apos;lonni <span className="text-gradient-brand">tahrirlash</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Muhim ma&apos;lumotlarni o&apos;zgartirsangiz, e&apos;lon qayta tekshiruvga yuboriladi.
        </p>
      </div>

      <HouseForm
        initial={{
          title: house.title,
          description: house.description ?? undefined,
          region: house.region ?? undefined,
          district: house.district ?? undefined,
          address: house.address,
          latitude: house.latitude,
          longitude: house.longitude,
          rooms: house.rooms,
          area_sqm: house.area_sqm ? Number(house.area_sqm) : undefined,
          max_tenants: house.max_tenants ?? undefined,
          floor: house.floor ?? undefined,
          total_floors: house.total_floors ?? undefined,
          price_per_month: Number(house.price_per_month),
          currency: house.currency,
          deposit_amount: house.deposit_amount ? Number(house.deposit_amount) : undefined,
          amenity_ids: house.amenities.map((a) => a.id),
          photo_urls: house.photos.map((p) => p.url),
        }}
        onSubmit={handleSubmit}
        submitLabel="O'zgarishlarni saqlash"
        isSubmitting={submitting}
        error={error}
      />
    </div>
  );
}
