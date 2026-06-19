import { Check, Crown, Sparkles, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type Tier = {
  audience: string;
  name: string;
  price: string;
  priceSuffix?: string;
  yearly?: string;
  pro?: boolean;
  popular?: boolean;
  color: string;
  perks: { text: string; included: boolean }[];
};

const tiers: Tier[] = [
  {
    audience: "Talaba",
    name: "BEPUL",
    price: "0",
    priceSuffix: "so'm",
    color: "from-slate-400 to-slate-600",
    perks: [
      { text: "Asosiy qidiruv va ko'rish", included: true },
      { text: "Cheklangan chat", included: true },
      { text: "Asosiy funksiyalar", included: true },
      { text: "Kontakt (telefon) ko'rish", included: false },
      { text: "Verified Student belgisi", included: false },
      { text: "Prioritet qo'llab-quvvatlash", included: false },
    ],
  },
  {
    audience: "Talaba",
    name: "PRO",
    price: "49 000",
    priceSuffix: "so'm / oy",
    yearly: "490 000",
    pro: true,
    popular: true,
    color: "from-blue-500 to-blue-700",
    perks: [
      { text: "Cheksiz qidiruv va filtrlar", included: true },
      { text: "Cheksiz chat va kontakt ko'rish", included: true },
      { text: "E'lon joylashtirish va ko'tarish", included: true },
      { text: "To'liq ishonchlilik darajasi", included: true },
      { text: "Shartnoma va hujjat boshqaruvi", included: true },
      { text: "Prioritet qo'llab-quvvatlash", included: true },
    ],
  },
  {
    audience: "Ijara beruvchi",
    name: "BEPUL",
    price: "0",
    priceSuffix: "so'm",
    color: "from-slate-400 to-slate-600",
    perks: [
      { text: "1 tagacha e'lon joylash", included: true },
      { text: "Cheklangan chat", included: true },
      { text: "Asosiy statistika", included: true },
      { text: "Kontakt (telefon) ko'rish", included: false },
      { text: "E'lonni TOP'ga chiqarish", included: false },
      { text: "Ishonchli ijara beruvchi belgisi", included: false },
    ],
  },
  {
    audience: "Ijara beruvchi",
    name: "PRO",
    price: "79 000",
    priceSuffix: "so'm / oy",
    yearly: "790 000",
    pro: true,
    popular: true,
    color: "from-yellow-400 to-orange-500",
    perks: [
      { text: "Cheksiz e'lon joylash", included: true },
      { text: "E'lonni TOP'ga chiqarish", included: true },
      { text: "Cheksiz chat va kontakt ko'rish", included: true },
      { text: "To'liq statistika va tahlil", included: true },
      { text: "Ijarachining ishonchlilik darajasi (to'liq)", included: true },
      { text: "To'lov eslatmalari va kuzatuv", included: true },
      { text: "Shartnoma va hujjat boshqaruvi", included: true },
      { text: "Prioritet qo'llab-quvvatlash", included: true },
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="container mx-auto max-w-7xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">
          Obuna rejalari va narxlar
        </span>
        <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Sizga mos <span className="text-gradient-brand">tarif</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Asosiy funksiyalar bepul. PRO orqali cheksiz imkoniyatlarni oching.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t, i) => (
          <div
            key={`${t.audience}-${t.name}`}
            className={`relative flex flex-col rounded-2xl border bg-card p-6 transition hover:shadow-xl ${
              t.popular ? "ring-2 ring-yellow-400 lg:scale-[1.03]" : ""
            }`}
          >
            {t.popular && (
              <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-bold text-foreground shadow">
                <Sparkles className="h-3 w-3" /> Eng mashhur
              </div>
            )}

            <div
              className={`inline-flex w-fit items-center gap-1.5 rounded-lg bg-gradient-to-br ${t.color} px-3 py-1 text-xs font-semibold text-white`}
            >
              {t.pro && <Crown className="h-3 w-3" />}
              {t.audience} — {t.name}
            </div>

            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight">{t.price}</span>
              <span className="text-sm text-muted-foreground">{t.priceSuffix}</span>
            </div>
            {t.yearly ? (
              <p className="mt-1 text-xs text-muted-foreground">
                yoki <strong>{t.yearly} so&apos;m / yil</strong> — 2 oy bepul
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Doimiy bepul</p>
            )}

            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {t.perks.map((p) => (
                <li
                  key={p.text}
                  className={`flex items-start gap-2 ${
                    p.included ? "" : "text-muted-foreground/60 line-through decoration-from-font"
                  }`}
                >
                  {p.included ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span>{p.text}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              className="mt-6 w-full"
              variant={t.pro ? "default" : "outline"}
            >
              <Link href={t.pro ? "/dashboard/subscription" : "/register"}>
                {t.pro ? "PRO ga o'tish" : "Boshlash"}
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
