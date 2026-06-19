"use client";

import { Check, Crown, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface ProUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  perks?: string[];
  ctaHref?: string;
  ctaLabel?: string;
}

const DEFAULT_PERKS = [
  "Cheksiz e'lon joylash",
  "E'lonni TOP'ga chiqarish",
  "Cheksiz chat va kontakt ko'rish",
  "To'liq statistika va tahlil",
  "Ishonchli ijara beruvchi belgisi",
];

export function ProUpgradeModal({
  open,
  onClose,
  title = "Bepul e'lon limiti tugadi",
  description = "Bepul rejada faqat 1 ta e'lon joylash mumkin. Yana e'lon qo'shish uchun PRO obunaga o'ting.",
  perks = DEFAULT_PERKS,
  ctaHref = "/dashboard/subscription",
  ctaLabel = "PRO ga o'tish",
}: ProUpgradeModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 px-6 py-7 text-white">
          <button
            onClick={onClose}
            aria-label="Yopish"
            className="absolute right-3 top-3 rounded-full p-1.5 text-white/85 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Crown className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold leading-tight">{title}</h2>
          <p className="mt-2 text-sm text-white/90">{description}</p>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Uy egasi PRO bilan
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Boshlanadi</p>
            <p className="text-2xl font-extrabold tracking-tight">
              79 000 <span className="text-sm font-semibold text-muted-foreground">so&apos;m / oy</span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              yoki 790 000 so&apos;m / yil — 2 oy bepul
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Keyinroq
            </Button>
            <Button asChild className="flex-1 shadow-md shadow-orange-500/25">
              <Link href={ctaHref}>
                <Sparkles className="h-4 w-4" />
                {ctaLabel}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
