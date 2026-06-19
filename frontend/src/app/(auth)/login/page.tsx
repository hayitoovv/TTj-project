"use client";

import { ArrowRight, Eye, EyeOff, Loader2, Lock, Phone, User } from "lucide-react";
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
  const [hemisLogin, setHemisLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const loginWithHemis = useAuthStore((s) => s.loginWithHemis);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "phone") {
        const normalized = normalizePhone("+998" + phone.replace(/\D/g, ""));
        await loginWithPassword(normalized, password);
      } else {
        await loginWithHemis(hemisLogin, password);
      }
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
          { value: "phone", label: "Telefon raqam" },
          { value: "hemis", label: "HEMIS" },
        ].map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value as Mode)}
            className={cn(
              "rounded-lg py-2 text-sm font-semibold transition",
              mode === m.value
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {mode === "phone" ? (
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
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="hemisLogin">HEMIS login</Label>
            <FieldIcon icon={User}>
              <input
                id="hemisLogin"
                value={hemisLogin}
                onChange={(e) => setHemisLogin(e.target.value)}
                placeholder="Talaba ID raqamingiz"
                required
                className="h-12 w-full bg-transparent pl-11 pr-3 text-sm focus:outline-none"
              />
            </FieldIcon>
          </div>
        )}

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

      <p className="text-center text-xs text-muted-foreground">
        Test uchun HEMIS parol: <code className="rounded bg-muted px-1.5 py-0.5">test1234</code>
      </p>
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
