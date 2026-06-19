"use client";

import { ArrowRight, Bed, LayoutDashboard, MapPin, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";

export function Hero() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const loggedIn = hydrated && !!user;
  return (
    <section className="relative overflow-hidden">
      {/* gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-[480px] w-[480px] rounded-full bg-blue-500/30 blur-3xl animate-blob" />
        <div className="absolute -bottom-24 right-0 h-[420px] w-[420px] rounded-full bg-yellow-400/30 blur-3xl animate-blob [animation-delay:6s]" />
        <div className="absolute top-1/2 left-1/3 h-[360px] w-[360px] rounded-full bg-red-500/15 blur-3xl animate-blob [animation-delay:3s]" />
      </div>
      {/* grid bg */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid bg-grid-mask opacity-50" />

      <div className="container mx-auto grid max-w-6xl gap-12 px-4 pt-16 pb-24 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-24">
        {/* LEFT: copy */}
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            🇺🇿 O&apos;zbekistonda #1 talabalar ijara platformasi
          </div>

          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Talaba ekansiz —{" "}
            <span className="text-gradient-brand">o&apos;z uyingiz</span> 2 daqiqada toping
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            HEMIS bilan integratsiyalashgan, kuratorlar nazoratidagi tizim. Click, Payme,
            Uzum orqali xavfsiz to&apos;lov. <strong className="text-foreground">24 soatlik refund</strong>{" "}
            kafolati.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {loggedIn ? (
              <Button asChild size="lg" className="shadow-lg shadow-blue-500/30">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Mening panelim
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="shadow-lg shadow-blue-500/30">
                <Link href="/register">
                  Bepul boshlash
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="border-foreground/20">
              <Link href="/houses">Uylarni ko&apos;rish</Link>
            </Button>
          </div>

          {/* trust */}
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex -space-x-2">
              {["bg-blue-500", "bg-yellow-400", "bg-red-500", "bg-blue-600", "bg-yellow-500"].map(
                (c, i) => (
                  <div
                    key={i}
                    className={`h-9 w-9 rounded-full border-2 border-background ${c}`}
                  />
                ),
              )}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-1 text-sm font-semibold">4.9</span>
              </div>
              <p className="text-xs text-muted-foreground">5000+ talaba ishonadi</p>
            </div>
          </div>
        </div>

        {/* RIGHT: app mockup */}
        <div className="relative animate-fade-up [animation-delay:0.2s]">
          {/* main card */}
          <div className="relative rounded-2xl border bg-card p-3 shadow-2xl shadow-blue-500/10">
            {/* browser dots */}
            <div className="flex items-center gap-1.5 px-2 pb-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <div className="ml-3 flex h-6 flex-1 items-center rounded-md bg-muted px-2 text-[10px] text-muted-foreground">
                ttj-platforma.uz/houses
              </div>
            </div>

            {/* search */}
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted/60 p-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Toshkent, TUIT yaqinida</span>
              <span className="ml-auto rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                Qidirish
              </span>
            </div>

            {/* houses grid */}
            <div className="mt-3 grid gap-2.5">
              <HouseCard
                title="2 xonali, TUIT yaqinida"
                price="2 500 000 so'm/oy"
                rooms={2}
                rating={4.8}
                tag="TOP"
                color="from-blue-500 to-blue-700"
              />
              <HouseCard
                title="1 xonali, Yunusobod"
                price="1 800 000 so'm/oy"
                rooms={1}
                rating={4.6}
                color="from-yellow-400 to-orange-500"
              />
              <HouseCard
                title="3 xonali, Chilonzor"
                price="3 200 000 so'm/oy"
                rooms={3}
                rating={4.9}
                tag="Yangi"
                color="from-red-500 to-pink-600"
              />
            </div>
          </div>

          {/* floating badges */}
          <div className="absolute -top-4 -right-4 hidden rounded-2xl border bg-card px-4 py-3 shadow-xl animate-float-slow sm:flex sm:items-center sm:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Ishonchli</div>
              <div className="text-sm font-semibold">HEMIS verified</div>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-4 hidden rounded-2xl border bg-card px-4 py-3 shadow-xl animate-float-medium [animation-delay:1s] sm:flex sm:items-center sm:gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-blue-400/40" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Yaqin atrofda</div>
              <div className="text-sm font-semibold">142 ta uy</div>
            </div>
          </div>

          {/* logo glow behind */}
          <div className="absolute -z-10 -top-10 -right-10 opacity-10">
            <Image src="/logo.png" alt="" width={300} height={300} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HouseCard({
  title,
  price,
  rooms,
  rating,
  tag,
  color,
}: {
  title: string;
  price: string;
  rooms: number;
  rating: number;
  tag?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background/60 p-2 transition hover:scale-[1.02] hover:shadow-md">
      <div className={`relative h-16 w-20 shrink-0 rounded-md bg-gradient-to-br ${color}`}>
        {tag && (
          <span className="absolute left-1 top-1 rounded bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-foreground">
            {tag}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{title}</div>
        <div className="mt-0.5 text-xs font-medium text-primary">{price}</div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Bed className="h-3 w-3" /> {rooms} xona
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {rating}
          </span>
        </div>
      </div>
    </div>
  );
}
