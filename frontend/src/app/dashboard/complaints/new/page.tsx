"use client";

import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronRight,
  Loader2,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractApiError } from "@/lib/api/client";
import { complaintsApi } from "@/lib/api/complaints";
import { useBooking, useBookings } from "@/lib/api/hooks";
import type { BookingListItem, ComplaintAgainstType } from "@/lib/api/types";
import { fullUploadUrl } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlangan",
  active: "Faol",
  ended: "Tugagan",
  cancelled: "Bekor qilingan",
};

export default function NewComplaintPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === "student";

  const { data: bookingsData, isLoading: bookingsLoading } = useBookings({ page_size: 50 });
  const bookings = bookingsData?.items ?? [];

  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [bookings],
  );

  const [userPickedBookingId, setUserPickedBookingId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const bookingId = userPickedBookingId ?? sortedBookings[0]?.id ?? null;
  const selectedBooking = sortedBookings.find((b) => b.id === bookingId) ?? null;

  const [againstType, setAgainstType] = useState<ComplaintAgainstType>("house");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Counterparty info needed only for "user" complaints — and only for students,
  // since landlord bookings list already includes student_id/student_name.
  const needsDetail = againstType === "user" && isStudent;
  const { data: bookingDetail } = useBooking(needsDetail ? bookingId : null);

  const targetUserId =
    againstType === "user"
      ? isStudent
        ? (bookingDetail?.landlord_id ?? null)
        : (selectedBooking?.student_id ?? null)
      : null;

  const targetUserName =
    againstType === "user"
      ? isStudent
        ? (bookingDetail?.landlord_name ?? null)
        : (selectedBooking?.student_name ?? null)
      : null;

  const mutation = useMutation({
    mutationFn: () =>
      complaintsApi.create({
        against_type: againstType,
        target_user_id: againstType === "user" ? (targetUserId ?? undefined) : undefined,
        house_id:
          againstType === "house" && selectedBooking ? selectedBooking.house_id : undefined,
        booking_id: bookingId ?? undefined,
        subject: subject.trim(),
        description: description.trim(),
      }),
    onSuccess: (data) => {
      router.push(`/dashboard/complaints/${data.id}`);
    },
    onError: (e) => setError(extractApiError(e)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedBooking) {
      setError("Bron tanlang");
      return;
    }
    if (!subject.trim() || !description.trim()) {
      setError("Sarlavha va tavsifni to'ldiring");
      return;
    }
    if (againstType === "user" && !targetUserId) {
      setError("Foydalanuvchi ma'lumotlari yuklanmoqda — bir oz kutib qaytadan urinib ko'ring");
      return;
    }
    mutation.mutate();
  };

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
          Bronni tanlang, muammoni yozing — kurator ko&apos;rib chiqadi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1 — pick a booking */}
        <section className="rounded-2xl border bg-card p-5">
          <Label className="mb-3 block">1. Qaysi bron haqida?</Label>

          {bookingsLoading ? (
            <div className="h-20 animate-pulse rounded-xl bg-muted/40" />
          ) : sortedBookings.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed bg-muted/20 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Sizda hech qanday bron yo&apos;q. Avval uy bron qilishingiz kerak.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/houses">Uylarni ko&apos;rish</Link>
              </Button>
            </div>
          ) : selectedBooking ? (
            <SelectedBookingCard
              booking={selectedBooking}
              isStudent={isStudent}
              onChange={() => setPickerOpen(true)}
              showChange={sortedBookings.length > 1}
            />
          ) : null}
        </section>

        {/* Step 2 — pick complaint target */}
        {selectedBooking && (
          <section className="rounded-2xl border bg-card p-5">
            <Label className="mb-3 block">2. Nimaga qarshi shikoyat?</Label>
            <div className="grid grid-cols-2 gap-3">
              <TypeOption
                active={againstType === "house"}
                onClick={() => setAgainstType("house")}
                icon={Building2}
                label="Uy haqida"
                hint={selectedBooking.house_title ?? `Uy #${selectedBooking.house_id}`}
              />
              <TypeOption
                active={againstType === "user"}
                onClick={() => setAgainstType("user")}
                icon={User}
                label={isStudent ? "Uy egasi haqida" : "Talaba haqida"}
                hint={
                  againstType === "user"
                    ? (targetUserName ?? (needsDetail ? "Yuklanmoqda…" : "—"))
                    : isStudent
                      ? "Uy egasi"
                      : (selectedBooking.student_name ?? "Talaba")
                }
              />
            </div>
          </section>
        )}

        {/* Step 3 — write it */}
        {selectedBooking && (
          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <Label className="block">3. Muammoni yozing</Label>
            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs font-normal text-muted-foreground">
                Sarlavha *
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Qisqacha mavzu — masalan: Issiq suv yo'q"
                maxLength={255}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-normal text-muted-foreground">
                Batafsil tavsif *
              </Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={4000}
                placeholder="Qachon bo'ldi? Kim aloqador? Iltimosingiz nima?"
                className="w-full rounded-lg border border-input bg-card p-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                required
              />
              <p className="text-right text-[11px] text-muted-foreground">
                {description.length}/4000
              </p>
            </div>
          </section>
        )}

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {selectedBooking && (
          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={mutation.isPending}
              className="shadow-md"
            >
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
        )}
      </form>

      {/* Booking picker modal */}
      <BookingPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        bookings={sortedBookings}
        selectedId={bookingId}
        isStudent={isStudent}
        onSelect={(id) => {
          setUserPickedBookingId(id);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

function SelectedBookingCard({
  booking,
  isStudent,
  onChange,
  showChange,
}: {
  booking: BookingListItem;
  isStudent: boolean;
  onChange: () => void;
  showChange: boolean;
}) {
  const statusLabel = BOOKING_STATUS_LABEL[booking.status] ?? booking.status;
  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-yellow-100">
          {booking.house_photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={booking.house_photo}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="line-clamp-1 text-sm font-semibold">
              {booking.house_title ?? `Uy #${booking.house_id}`}
            </p>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {statusLabel}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {!isStudent && booking.student_name ? `${booking.student_name} · ` : ""}
            {new Date(booking.start_date).toLocaleDateString("uz-UZ")} —{" "}
            {new Date(booking.end_date).toLocaleDateString("uz-UZ")}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Bron #{booking.id}</p>
        </div>
        {showChange && (
          <button
            type="button"
            onClick={onChange}
            className="shrink-0 rounded-lg border border-input bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted"
          >
            O&apos;zgartirish
          </button>
        )}
      </div>
    </div>
  );
}

function BookingPickerModal({
  open,
  onClose,
  bookings,
  selectedId,
  onSelect,
  isStudent,
}: {
  open: boolean;
  onClose: () => void;
  bookings: BookingListItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  isStudent: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-base font-bold">Bron tanlang</h3>
            <p className="text-xs text-muted-foreground">
              {bookings.length} ta bron
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Yopish"
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-72px)] space-y-2 overflow-y-auto p-4">
          {bookings.map((b) => (
            <BookingPickerRow
              key={b.id}
              booking={b}
              selected={selectedId === b.id}
              onSelect={() => onSelect(b.id)}
              isStudent={isStudent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BookingPickerRow({
  booking,
  selected,
  onSelect,
  isStudent,
}: {
  booking: BookingListItem;
  selected: boolean;
  onSelect: () => void;
  isStudent: boolean;
}) {
  const statusLabel = BOOKING_STATUS_LABEL[booking.status] ?? booking.status;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition",
        selected
          ? "border-primary bg-primary/5"
          : "border-input hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-yellow-100">
        {booking.house_photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fullUploadUrl(booking.house_photo) ?? booking.house_photo}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold">
          {booking.house_title ?? `Uy #${booking.house_id}`}
        </p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {!isStudent && booking.student_name ? `${booking.student_name} · ` : ""}
          {new Date(booking.start_date).toLocaleDateString("uz-UZ")} —{" "}
          {new Date(booking.end_date).toLocaleDateString("uz-UZ")}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {statusLabel}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function TypeOption({
  active,
  onClick,
  icon: Icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition",
        active
          ? "border-primary bg-primary/5"
          : "border-input hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
      <span className="text-sm font-semibold">{label}</span>
      {hint && (
        <span className="line-clamp-1 w-full text-[11px] text-muted-foreground">{hint}</span>
      )}
    </button>
  );
}
