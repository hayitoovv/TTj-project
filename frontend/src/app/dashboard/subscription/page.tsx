"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  CheckCircle2,
  Crown,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useSubscriptionStatus, useMySubscriptions } from "@/lib/api/hooks";
import { extractApiError } from "@/lib/api/client";
import {
  subscriptionsApi,
  type SubscriptionPeriod,
  type SubscriptionPlan,
  type PaymentGateway,
} from "@/lib/api/subscriptions";
import { cn, formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const PLAN_PRICES: Record<
  SubscriptionPlan,
  { monthly: number; yearly: number; label: string; color: string }
> = {
  student_pro: { monthly: 49_000, yearly: 490_000, label: "Talaba PRO", color: "from-blue-500 to-blue-700" },
  landlord_pro: { monthly: 79_000, yearly: 790_000, label: "Uy egasi PRO", color: "from-yellow-400 to-orange-500" },
  university_pro: { monthly: 990_000, yearly: 9_900_000, label: "Universitet PRO", color: "from-purple-500 to-pink-500" },
};

const PERKS: Record<SubscriptionPlan, string[]> = {
  student_pro: [
    "Cheksiz qidiruv va filtrlar",
    "Cheksiz chat va kontakt ko'rish",
    "Cheksiz e'lon saqlash",
    "To'liq statistika tahlili",
    "Shartnoma va hujjat boshqaruvi",
    "Prioritet qo'llab-quvvatlash",
  ],
  landlord_pro: [
    "Cheksiz e'lon joylash",
    "E'lonni TOP'ga chiqarish",
    "Cheksiz chat va kontakt ko'rish",
    "To'liq statistika tahlili",
    "Ijarachi ishonchlilik (to'liq)",
    "Shartnoma va hujjat boshqaruvi",
    "Prioritet qo'llab-quvvatlash",
  ],
  university_pro: [
    "To'liq analitika va hisobotlar",
    "Kuratorlar boshqaruvi",
    "Tezkor muammo signali",
    "PDF / Excel eksport",
    "HEMIS bilan integratsiya",
  ],
};

const GATEWAYS: { value: PaymentGateway; label: string; color: string }[] = [
  { value: "click", label: "Click", color: "from-blue-500 to-blue-700" },
  { value: "payme", label: "Payme", color: "from-cyan-400 to-teal-500" },
  { value: "uzum", label: "Uzum Bank", color: "from-purple-500 to-purple-700" },
  { value: "paynet", label: "Paynet", color: "from-green-500 to-emerald-600" },
];

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const { data: statusData } = useSubscriptionStatus();
  const { data: history } = useMySubscriptions();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [period, setPeriod] = useState<SubscriptionPeriod>("monthly");
  const [gateway, setGateway] = useState<PaymentGateway>("click");
  const [error, setError] = useState<string | null>(null);

  const purchaseMutation = useMutation({
    mutationFn: () =>
      subscriptionsApi.purchase({
        plan: selectedPlan as SubscriptionPlan,
        period,
        gateway,
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      // Auth store'dagi user'ni yangilash kerak — landlord_profile.is_pro yangilangani
      // boshqa joylarda (dashboard, sidebar) darhol aks etsin.
      await fetchMe();
      setSelectedPlan(null);
    },
    onError: (e) => setError(extractApiError(e)),
  });

  if (!user) return null;

  const allowedPlan: SubscriptionPlan | null =
    user.role === "student"
      ? "student_pro"
      : user.role === "landlord"
        ? "landlord_pro"
        : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          PRO <span className="text-gradient-brand">obuna</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cheksiz imkoniyatlar, prioritet qo&apos;llab-quvvatlash
        </p>
      </div>

      {/* Current status */}
      {statusData?.is_pro ? (
        <div className="overflow-hidden rounded-2xl border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg">
                <Crown className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-orange-700">
                  Faol obuna
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  {statusData.plan ? PLAN_PRICES[statusData.plan].label : "PRO"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  <Calendar className="mr-1 inline h-3.5 w-3.5" />
                  Tugashga {statusData.days_remaining} kun qoldi (
                  {statusData.ends_at
                    ? new Date(statusData.ends_at).toLocaleDateString("uz-UZ")
                    : ""}
                  )
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : !allowedPlan ? (
        <div className="rounded-2xl border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sizning rolingiz uchun PRO obuna hozircha mavjud emas.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Hozirda sizda PRO obuna yo&apos;q. Quyidagi tarifni tanlang.
          </p>
        </div>
      )}

      {/* Plan card */}
      {allowedPlan && !statusData?.is_pro && (
        <PlanCard
          plan={allowedPlan}
          onSelect={() => {
            setError(null);
            setSelectedPlan(allowedPlan);
          }}
        />
      )}

      {/* History */}
      {history && history.length > 0 && (
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 font-bold">Obuna tarixi</h2>
          <ul className="divide-y">
            {history.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">{PLAN_PRICES[s.plan]?.label ?? s.plan}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.starts_at).toLocaleDateString("uz-UZ")} →{" "}
                    {new Date(s.ends_at).toLocaleDateString("uz-UZ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(s.amount, s.currency)}</p>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold",
                      s.status === "active"
                        ? "bg-green-100 text-green-700"
                        : s.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700",
                    )}
                  >
                    {s.status === "active" ? "Faol" : s.status === "cancelled" ? "Bekor" : "Tugagan"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Purchase modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-background shadow-2xl">
            {/* Header */}
            <div
              className={cn(
                "relative bg-gradient-to-br p-6 text-white",
                PLAN_PRICES[selectedPlan].color,
              )}
            >
              <button
                type="button"
                onClick={() => !purchaseMutation.isPending && setSelectedPlan(null)}
                className="absolute right-3 top-3 rounded-full bg-white/20 p-1.5 transition hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </button>
              <Crown className="h-8 w-8" />
              <h3 className="mt-3 text-xl font-bold">{PLAN_PRICES[selectedPlan].label}</h3>
              <p className="text-sm text-white/85">PRO obunaga o&apos;tish</p>
            </div>

            {/* Period selection */}
            <div className="p-6 space-y-5">
              <div>
                <p className="mb-2 text-sm font-semibold">Davr</p>
                <div className="grid grid-cols-2 gap-2">
                  <PeriodOption
                    value="monthly"
                    label="1 oy"
                    price={PLAN_PRICES[selectedPlan].monthly}
                    selected={period === "monthly"}
                    onClick={() => setPeriod("monthly")}
                  />
                  <PeriodOption
                    value="yearly"
                    label="1 yil"
                    price={PLAN_PRICES[selectedPlan].yearly}
                    selected={period === "yearly"}
                    onClick={() => setPeriod("yearly")}
                    badge="2 oy bepul"
                  />
                </div>
              </div>

              {/* Gateway */}
              <div>
                <p className="mb-2 text-sm font-semibold">To&apos;lov tizimi</p>
                <div className="grid grid-cols-2 gap-2">
                  {GATEWAYS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGateway(g.value)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-semibold transition",
                        gateway === g.value
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-input hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full bg-gradient-to-r",
                          g.color,
                        )}
                      />
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Perks */}
              <div className="rounded-xl bg-muted/30 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Imkoniyatlar
                </p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {PERKS[selectedPlan].map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              {/* Submit */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Jami</p>
                  <p className="text-2xl font-extrabold">
                    {(period === "monthly"
                      ? PLAN_PRICES[selectedPlan].monthly
                      : PLAN_PRICES[selectedPlan].yearly
                    ).toLocaleString("ru-RU")}{" "}
                    so&apos;m
                  </p>
                </div>
                <Button
                  onClick={() => purchaseMutation.mutate()}
                  disabled={purchaseMutation.isPending}
                  size="lg"
                  className="shadow-lg shadow-blue-500/20"
                >
                  {purchaseMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  To&apos;lash
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  onSelect,
}: {
  plan: SubscriptionPlan;
  onSelect: () => void;
}) {
  const cfg = PLAN_PRICES[plan];
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-yellow-300 bg-card p-6">
      <div className={cn("inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br px-3 py-1 text-xs font-bold text-white", cfg.color)}>
        <Crown className="h-3.5 w-3.5" />
        {cfg.label}
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-5xl font-extrabold tracking-tight">
          {cfg.monthly.toLocaleString("ru-RU")}
        </span>
        <span className="text-muted-foreground">so&apos;m/oy</span>
      </div>
      <p className="text-sm text-muted-foreground">
        yoki <strong>{cfg.yearly.toLocaleString("ru-RU")} so&apos;m/yil</strong> · 2 oy bepul
      </p>

      <ul className="mt-5 space-y-2.5 text-sm">
        {PERKS[plan].map((p) => (
          <li key={p} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <Button onClick={onSelect} size="lg" className="mt-6 w-full shadow-md">
        <Sparkles className="h-4 w-4" />
        PRO ga o&apos;tish
      </Button>
    </div>
  );
}

function PeriodOption({
  value: _value,
  label,
  price,
  selected,
  onClick,
  badge,
}: {
  value: SubscriptionPeriod;
  label: string;
  price: number;
  selected: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition",
        selected
          ? "border-primary bg-primary/5"
          : "border-input hover:bg-muted",
      )}
    >
      {badge && (
        <span className="absolute -top-2 right-2 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-foreground">
          {badge}
        </span>
      )}
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-base font-bold">{price.toLocaleString("ru-RU")} so&apos;m</span>
    </button>
  );
}
