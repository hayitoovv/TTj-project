"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Building2, Loader2, ShieldAlert, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractApiError } from "@/lib/api/client";
import { complaintsApi } from "@/lib/api/complaints";
import type { ComplaintAgainstType } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export default function NewComplaintPage() {
  const router = useRouter();
  const [againstType, setAgainstType] = useState<ComplaintAgainstType>("house");
  const [targetId, setTargetId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      complaintsApi.create({
        against_type: againstType,
        target_user_id:
          againstType === "user" && targetId ? Number(targetId) : undefined,
        house_id: againstType === "house" && targetId ? Number(targetId) : undefined,
        booking_id: bookingId ? Number(bookingId) : undefined,
        subject: subject.trim(),
        description: description.trim(),
      }),
    onSuccess: (data) => {
      router.push(`/dashboard/complaints/${data.id}`);
    },
    onError: (e) => setError(extractApiError(e)),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard/complaints"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Shikoyatlarga qaytish
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Yangi <span className="text-gradient-brand">shikoyat</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Muammoni batafsil yozing — kurator ko&apos;rib chiqadi.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (!subject.trim() || !description.trim()) {
            setError("Sarlavha va tavsifni to'ldiring");
            return;
          }
          mutation.mutate();
        }}
        className="space-y-5"
      >
        {/* Type picker */}
        <section className="rounded-2xl border bg-card p-5">
          <Label className="mb-3 block">Shikoyat kimga/nimaga qarshi?</Label>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { value: "house", label: "Uy haqida", icon: Building2 },
                { value: "user", label: "Foydalanuvchi haqida", icon: User },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAgainstType(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition",
                  againstType === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted/50",
                )}
              >
                <opt.icon
                  className={cn(
                    "h-6 w-6",
                    againstType === opt.value ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="text-sm font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* IDs */}
        <section className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="targetId">
              {againstType === "house" ? "Uy ID raqami" : "Foydalanuvchi ID raqami"} (ixtiyoriy)
            </Label>
            <Input
              id="targetId"
              type="number"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder={againstType === "house" ? "Masalan: 5" : "Masalan: 10"}
            />
            <p className="text-[11px] text-muted-foreground">
              Bu ID'ni uy yoki foydalanuvchi sahifasidan ko&apos;rishingiz mumkin
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bookingId">Bron ID (agar bron bilan bog'liq bo'lsa)</Label>
            <Input
              id="bookingId"
              type="number"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="Masalan: 15"
            />
          </div>
        </section>

        {/* Subject & description */}
        <section className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Sarlavha *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Qisqacha mavzuni yozing"
              maxLength={255}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Batafsil tavsif *</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              maxLength={4000}
              placeholder="Muammoni batafsil yozing — qachon bo'ldi, kim aloqador, sizning iltimosingiz nima..."
              className="w-full rounded-lg border border-input bg-card p-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
              required
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {description.length}/4000
            </p>
          </div>
        </section>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={mutation.isPending} className="shadow-md">
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                Shikoyatni yuborish
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
