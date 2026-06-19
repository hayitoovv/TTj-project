"use client";

import { CheckCircle2, CreditCard, Loader2, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Gateway = "click" | "payme" | "uzum" | "paynet";

const GATEWAYS: { value: Gateway; label: string; color: string; emoji: string }[] = [
  { value: "click", label: "Click", color: "from-blue-500 to-cyan-500", emoji: "💙" },
  { value: "payme", label: "Payme", color: "from-cyan-400 to-teal-500", emoji: "💚" },
  { value: "uzum", label: "Uzum", color: "from-purple-500 to-pink-500", emoji: "💜" },
  { value: "paynet", label: "Paynet", color: "from-orange-400 to-red-500", emoji: "🧡" },
];

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: string;
  currency: "UZS" | "USD";
  isPending: boolean;
  error: string | null;
  onSubmit: (gateway: Gateway) => void;
}

export function PaymentModal({
  open,
  onClose,
  amount,
  currency,
  isPending,
  error,
  onSubmit,
}: PaymentModalProps) {
  const [gateway, setGateway] = useState<Gateway>("click");

  if (!open) return null;

  const formattedAmount =
    currency === "USD"
      ? `$${Number(amount).toLocaleString()}`
      : `${Number(amount).toLocaleString("ru-RU")} so'm`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-background shadow-2xl">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-brand px-6 py-5 text-white">
          <button
            onClick={onClose}
            disabled={isPending}
            aria-label="Yopish"
            className="absolute right-3 top-3 rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <CreditCard className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-bold">To&apos;lovni amalga oshirish</h3>
              <p className="text-xs text-white/80">To&apos;lov tizimini tanlang</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-white/80">To&apos;lov summasi</p>
            <p className="mt-1 text-3xl font-extrabold">{formattedAmount}</p>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 p-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              To&apos;lov tizimi
            </p>
            <div className="grid grid-cols-2 gap-2">
              {GATEWAYS.map((g) => {
                const active = gateway === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGateway(g.value)}
                    disabled={isPending}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-bold transition",
                      active
                        ? `border-transparent bg-gradient-to-br ${g.color} text-white shadow-md`
                        : "border-input hover:bg-muted",
                    )}
                  >
                    <span>{g.emoji}</span>
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trust bar */}
          <div className="space-y-1.5 rounded-xl bg-muted/50 p-3 text-xs">
            <Row icon={ShieldCheck} text="Xavfsiz to'lov, ma'lumotlaringiz himoyalangan" />
            <Row icon={CheckCircle2} text="24 soat ichida to'liq refund" />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              onClick={() => onSubmit(gateway)}
              disabled={isPending}
              className="w-full shadow-lg shadow-blue-500/20"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {isPending ? "To'lanmoqda..." : `${formattedAmount} to'lash`}
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              Demo to&apos;lov — haqiqiy mablag&apos; o&apos;tmaydi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-green-600" />
      <span>{text}</span>
    </div>
  );
}
