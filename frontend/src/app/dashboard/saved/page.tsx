"use client";

import { Heart } from "lucide-react";
import Link from "next/link";

import { HouseCard, HouseCardSkeleton } from "@/components/houses/house-card";
import { Button } from "@/components/ui/button";
import { favoritesApi } from "@/lib/api/favorites";
import { useQuery } from "@tanstack/react-query";

export default function SavedPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["favorites", "list"],
    queryFn: () => favoritesApi.list({ page_size: 50 }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Saqlangan <span className="text-gradient-brand">uylar</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data?.total ?? 0} ta saqlangan uy
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <HouseCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Heart className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Saqlangan uylar yo&apos;q</h3>
          <p className="mt-1 max-w-md mx-auto text-sm text-muted-foreground">
            Yoqtirgan uylaringizni saqlash uchun karta&apos;dagi 🤍 yurakcha tugmasini bosing
          </p>
          <Button asChild className="mt-5">
            <Link href="/houses">Uylarni ko&apos;rish</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((h) => <HouseCard key={h.id} house={h} />)}
        </div>
      )}
    </div>
  );
}
