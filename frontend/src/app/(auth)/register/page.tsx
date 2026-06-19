"use client";

import { ArrowRight, Eye, EyeOff, Loader2, Lock, Phone, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RolePicker } from "@/components/auth/role-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { extractApiError } from "@/lib/api/client";
import type { UserRole } from "@/lib/api/types";
import { cn, normalizePhone } from "@/lib/utils";

type Role = Exclude<UserRole, "admin">;

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<Role>("student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) return setError("Parollar mos kelmadi");
    if (password.length < 6) return setError("Parol kamida 6 belgi bo'lishi kerak");

    const normalized = normalizePhone("+998" + phone.replace(/\D/g, ""));
    setLoading(true);
    try {
      const resp = await authApi.register({
        phone: normalized,
        password,
        role,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
      });
      const params = new URLSearchParams({ phone: resp.phone });
      if (resp.dev_code) params.set("dev_code", resp.dev_code);
      router.push(`/verify?${params.toString()}`);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Akkaunt yaratish</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Allaqachon akkauntingiz bormi?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Kirish
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Role */}
        <div className="space-y-2">
          <Label>Kim sifatida</Label>
          <RolePicker value={role} onChange={setRole} />
        </div>

        {/* Names */}
        <div className="grid grid-cols-2 gap-3">
          <FieldIcon icon={User}>
            <input
              placeholder="Ism"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-12 w-full bg-transparent pl-11 pr-3 text-sm focus:outline-none"
            />
          </FieldIcon>
          <FieldIcon>
            <input
              placeholder="Familiya"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-12 w-full bg-transparent px-3 text-sm focus:outline-none"
            />
          </FieldIcon>
        </div>

        {/* Phone */}
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

        {/* Passwords */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="password">Parol</Label>
            <FieldIcon icon={Lock}>
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 belgi"
                minLength={6}
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
            <PasswordStrength password={password} />
          </div>

          <FieldIcon icon={Lock}>
            <input
              type={showPwd ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Parolni tasdiqlang"
              minLength={6}
              required
              className="h-12 w-full bg-transparent pl-11 pr-3 text-sm focus:outline-none"
            />
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
              Davom etish <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Davom etish orqali siz{" "}
          <Link href="#" className="text-primary hover:underline">
            shartlar
          </Link>{" "}
          va{" "}
          <Link href="#" className="text-primary hover:underline">
            maxfiylik siyosati
          </Link>
          ga rozilik bildirasiz.
        </p>
      </form>
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

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const tier = Math.min(score, 4);
  const label = ["Juda zaif", "Zaif", "O'rtacha", "Yaxshi", "Kuchli"][tier];
  const color = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"][tier];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn("h-1 flex-1 rounded-full transition", i <= tier ? color : "bg-muted")}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
