import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Talaba PRO",
    audience: "Talabalar uchun",
    price: "5",
    yearly: "50",
    color: "from-blue-500 to-blue-700",
    perks: [
      "VIP uylarni birinchi ko'rish",
      "Tez bron qilish (prioritet)",
      "Uy egasi bilan to'g'ridan chat",
      "Kengaytirilgan reytinglar",
      "Verified Student belgisi",
    ],
  },
  {
    name: "Uy egasi PRO",
    audience: "Ijara beruvchilar uchun",
    price: "10",
    yearly: "100",
    color: "from-yellow-400 to-orange-500",
    popular: true,
    perks: [
      "Cheksiz e'lon joylash",
      "E'lonlarni TOP ga chiqarish",
      "Daromad va statistika paneli",
      "Talabalar bilan to'g'ridan chat",
      "Ishonchli ijara beruvchi belgisi",
    ],
  },
  {
    name: "Universitet PRO",
    audience: "Universitetlar uchun",
    price: "10",
    yearly: "100",
    color: "from-red-500 to-pink-600",
    perks: [
      "To'liq analitika paneli",
      "Tezkor muammo signali",
      "PDF / Excel hisobotlar",
      "Kuratorlar boshqaruvi",
      "HEMIS bilan keng integratsiya",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="container mx-auto max-w-6xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">PRO obuna</span>
        <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Sizga mos <span className="text-gradient-brand">tarif</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Asosiy funksiyalar bepul. PRO orqali ko&apos;proq imkoniyat oching.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-2xl border bg-card p-7 transition hover:shadow-xl ${
              t.popular ? "scale-100 ring-2 ring-yellow-400 md:scale-105" : ""
            }`}
          >
            {t.popular && (
              <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-bold text-foreground shadow">
                <Sparkles className="h-3 w-3" /> Eng mashhur
              </div>
            )}

            <div className={`inline-flex rounded-lg bg-gradient-to-br ${t.color} px-3 py-1 text-xs font-semibold text-white`}>
              {t.audience}
            </div>
            <h3 className="mt-4 text-xl font-bold">{t.name}</h3>

            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-tight">${t.price}</span>
              <span className="text-muted-foreground">/oy</span>
            </div>
            <p className="text-sm text-muted-foreground">yoki ${t.yearly}/yil — 2 oy bepul</p>

            <Button asChild className="mt-6 w-full" variant={t.popular ? "default" : "outline"}>
              <Link href="/register">Tanlash</Link>
            </Button>

            <ul className="mt-6 space-y-3 text-sm">
              {t.perks.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
