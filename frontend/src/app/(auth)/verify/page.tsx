"use client";

import { ArrowRight, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { OtpInput } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth";
import { extractApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const devCode = params.get("dev_code");

  const [code, setCode] = useState(devCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [info, setInfo] = useState<string | null>(devCode ? `DEV kod: ${devCode}` : null);
  const [seconds, setSeconds] = useState(60);

  const setTokensAndFetch = useAuthStore((s) => s.setTokensAndFetch);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  async function submit(value: string) {
    if (!phone) return setError("Telefon raqami yo'q");
    setError(null);
    setLoading(true);
    try {
      const tokens = await authApi.verify({ phone, code: value });
      await setTokensAndFetch(tokens.access_token, tokens.refresh_token);
      router.push("/dashboard");
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (seconds > 0) return;
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      const r = await authApi.resendCode(phone);
      setInfo(r.dev_code ? `Yangi DEV kod: ${r.dev_code}` : "Kod qayta yuborildi");
      if (r.dev_code) setCode(r.dev_code);
      setSeconds(60);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Telefoningizni tasdiqlang</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            6 raqamli kod yuborildi <strong className="text-foreground">{phone}</strong>
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(code);
        }}
        className="space-y-5"
      >
        <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={loading} />

        {info && (
          <p className="inline-flex items-center gap-1.5 rounded-md bg-secondary/30 px-3 py-2 text-sm text-secondary-foreground">
            <Sparkles className="h-4 w-4" />
            {info}
          </p>
        )}
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full shadow-lg shadow-blue-500/20"
          disabled={loading || code.length < 6}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Tasdiqlash <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Kod kelmadimi? </span>
          {seconds > 0 ? (
            <span className="font-medium text-muted-foreground">
              {seconds}s dan keyin qayta yuborish
            </span>
          ) : (
            <button
              type="button"
              onClick={onResend}
              disabled={resending}
              className="font-semibold text-primary hover:underline disabled:opacity-50"
            >
              {resending ? "Yuborilmoqda..." : "Qayta yuborish"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
