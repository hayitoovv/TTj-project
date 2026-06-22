"use client";

import { ArrowRight, Eye, EyeOff, GraduationCap, Loader2, Lock, Phone, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { extractApiError } from "@/lib/api/client";
import { cn, normalizePhone } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

type Mode = "phone" | "hemis";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "hemis") return; // HEMIS rejimida submit ishlamaydi
    setError(null);
    setLoading(true);
    try {
      const normalized = normalizePhone("+998" + phone.replace(/\D/g, ""));
      await loginWithPassword(normalized, password);
      router.push("/dashboard");
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Tizimga kirish</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Akkauntingiz yo&apos;qmi?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </p>
      </div>

      {/* Mode tabs */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {[
          { value: "phone", label: "Telefon raqam", soon: false },
          { value: "hemis", label: "HEMIS", soon: true },
        ].map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value as Mode)}
            className={cn(
              "relative rounded-lg py-2 text-sm font-semibold transition",
              mode === m.value
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              {m.label}
              {m.soon && (
                <span className="rounded-full bg-yellow-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-foreground">
                  Tez orada
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {mode === "hemis" ? (
        <HemisComingSoon onBack={() => setMode("phone")} />
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefon raqam</Label>
            <FieldIcon icon={Phone} prefix="+998">
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
                }
                placeholder="90 123 45 67"
                required
                className="h-12 w-full bg-transparent pl-[5.5rem] pr-3 text-sm focus:outline-none"
              />
            </FieldIcon>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Parol</Label>
              <Link href="#" className="text-xs text-primary hover:underline">
                Parolni unutdingizmi?
              </Link>
            </div>
            <FieldIcon icon={Lock}>
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 w-full bg-transparent pl-11 pr-11 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </FieldIcon>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full shadow-lg shadow-blue-500/20"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Kirish <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

function HemisComingSoon({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border-2 border-yellow-300/40 bg-gradient-to-br from-yellow-50 via-orange-50/40 to-transparent p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-bold text-orange-700">
          <Sparkles className="h-3 w-3" />
          Tez orada
        </div>
        <h3 className="mt-3 text-lg font-bold">HEMIS orqali kirish</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Talabalar uchun HEMIS hisobi orqali bir bosishda kirish va universitet,
          kurs hamda guruh ma&apos;lumotlarini avtomatik tasdiqlash imkoniyati
          ishlab chiqilmoqda.
        </p>
        <ul className="mx-auto mt-4 max-w-xs space-y-1.5 text-left text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
            Universitet va guruh avtomatik aniqlanadi
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
            Soxta hisoblardan himoya
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
            Kuratorlar bilan to&apos;g&apos;ridan-to&apos;g&apos;ri bog&apos;lanish
          </li>
        </ul>
      </div>

      <Button
        type="button"
        size="lg"
        variant="outline"
        className="w-full"
        onClick={onBack}
      >
        <Phone className="h-4 w-4" />
        Telefon raqam orqali kirish
      </Button>
    </div>
  );
}

function FieldIcon({
  icon: Icon,
  prefix,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  prefix?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl border border-input bg-card transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      {prefix && (
        <span className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
          {prefix}
        </span>
      )}
      {children}
    </div>
  );
}
