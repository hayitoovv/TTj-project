"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { HouseForm } from "@/components/houses/house-form";
import { extractApiError } from "@/lib/api/client";
import { housesApi, type HouseCreateInput } from "@/lib/api/houses";

export default function NewHousePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(data: HouseCreateInput) {
    setError(null);
    setSubmitting(true);
    try {
      const created = await housesApi.create(data);
      router.push(`/dashboard/houses?created=${created.id}`);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
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
          Yangi <span className="text-gradient-brand">e&apos;lon</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Talabalar uchun uyingiz haqida to&apos;liq ma&apos;lumot kiriting. Saqlangandan keyin admin
          tasdiqlaydi.
        </p>
      </div>

      <HouseForm
        onSubmit={handleSubmit}
        submitLabel="E'lonni yuborish"
        isSubmitting={submitting}
        error={error}
      />
    </div>
  );
}
