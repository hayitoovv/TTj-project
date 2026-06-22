"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  MapPin,
  Star,
  ThumbsUp,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { PaymentModal } from "@/components/bookings/payment-modal";
import { StartChatButton } from "@/components/chat/start-chat-button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import { UserProfileModal } from "@/components/reviews/user-profile-modal";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { bookingsApi } from "@/lib/api/bookings";
import { extractApiError } from "@/lib/api/client";
import { useBooking, useReviews } from "@/lib/api/hooks";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

type ModalType = "cancel" | "reject" | null;

export default function BookingDetailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const user = useAuthStore((s) => s.user);

  const { data: booking, isLoading } = useBooking(Number.isFinite(id) ? id : null);

  const [modal, setModal] = useState<ModalType>(null);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    setModal(null);
    setReason("");
  };

  const cancelMutation = useMutation({
    mutationFn: (r: string) => bookingsApi.cancel(id, r),
    onSuccess,
    onError: (e) => setActionError(extractApiError(e)),
  });
  const rejectMutation = useMutation({
    mutationFn: (r: string) => bookingsApi.reject(id, r),
    onSuccess,
    onError: (e) => setActionError(extractApiError(e)),
  });
  const confirmMutation = useMutation({
    mutationFn: () => bookingsApi.confirm(id),
    onSuccess,
    onError: (e) => setActionError(extractApiError(e)),
  });
  const acceptMutation = useMutation({
    mutationFn: () => bookingsApi.acceptContract(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
    onError: (e) => setActionError(extractApiError(e)),
  });
  const payMutation = useMutation({
    mutationFn: (gateway: "click" | "payme" | "uzum" | "paynet") =>
      bookingsApi.pay(id, gateway),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setPayOpen(false);
      setPayError(null);
    },
    onError: (e) => setPayError(extractApiError(e)),
  });

  if (isLoading) {
    return <div className="mx-auto max-w-4xl">Yuklanmoqda...</div>;
  }
  if (!booking) {
    return (
      <div className="mx-auto max-w-3xl text-center py-20">
        <h2 className="text-2xl font-bold">Bron topilmadi</h2>
        <Button asChild className="mt-4">
          <Link href="/dashboard/bookings">Bronlarga qaytish</Link>
        </Button>
      </div>
    );
  }

  const isLandlord = user?.role === "landlord";
  const isStudent = user?.role === "student";
  const canCancel = isStudent && ["pending", "confirmed"].includes(booking.status);
  const canAcceptContract =
    isStudent && booking.status === "confirmed" && !booking.contract?.student_accepted_at;
  const canPay =
    isStudent && booking.status === "confirmed" && !!booking.contract?.student_accepted_at;
  const canConfirm = isLandlord && booking.status === "pending";
  const canReject = isLandlord && ["pending", "confirmed"].includes(booking.status);
  const canReview =
    booking.status === "ended" ||
    (booking.status === "active" && new Date(booking.end_date) < new Date());

  const modalConfig =
    modal === "cancel"
      ? {
          title: "Bronni bekor qilish",
          subtitle: "Sababni qisqacha yozing. Bu uy egasi va kuratorga ko'rinadi.",
          submit: "Bekor qilish",
          run: () => cancelMutation.mutate(reason.trim()),
          loading: cancelMutation.isPending,
        }
      : modal === "reject"
        ? {
            title: "So'rovni rad etish",
            subtitle: "Talabaga ko'rsatiladigan sababni yozing.",
            submit: "Rad etish",
            run: () => rejectMutation.mutate(reason.trim()),
            loading: rejectMutation.isPending,
          }
        : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Orqaga
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Bron #{booking.id}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            {booking.house_title ?? "Uy"}
          </h1>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {booking.house_address ?? "—"}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* LEFT */}
        <div className="space-y-6">
          {/* Timeline */}
          <Section title="Bron jarayoni" icon={ClipboardList}>
            <Timeline status={booking.status} contract={booking.contract ?? null} />
          </Section>

          {/* Dates */}
          <Section title="Sanalar" icon={Calendar}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Boshlanish</p>
                <p className="font-semibold">{booking.start_date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tugash</p>
                <p className="font-semibold">{booking.end_date}</p>
              </div>
            </div>
          </Section>

          {/* Student info — visible for landlord */}
          {isLandlord && booking.student_id && (
            <Section title="Talaba" icon={User}>
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2 -m-2 text-left transition hover:border-border hover:bg-muted/40"
              >
                <Avatar
                  src={booking.student_avatar}
                  fallback={(booking.student_name ?? "T").charAt(0)}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {booking.student_name ?? "Talaba"}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    Profilni ko&apos;rish va sharhlar
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </button>
            </Section>
          )}

          {/* Contract */}
          {booking.contract && (
            <Section title="Shartnoma" icon={FileText}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Shartnoma raqami</p>
                  <p className="font-mono font-semibold">
                    {booking.contract.contract_number}
                  </p>
                </div>
                <div className="space-y-0.5 text-right text-xs">
                  <p>
                    Talaba:{" "}
                    {booking.contract.student_accepted_at ? (
                      <span className="text-green-600 font-semibold">✓ Qabul qildi</span>
                    ) : (
                      <span className="text-muted-foreground">Kutilmoqda</span>
                    )}
                  </p>
                  <p>
                    Uy egasi:{" "}
                    {booking.contract.landlord_accepted_at ? (
                      <span className="text-green-600 font-semibold">✓ Qabul qildi</span>
                    ) : (
                      <span className="text-muted-foreground">Kutilmoqda</span>
                    )}
                  </p>
                </div>
              </div>
            </Section>
          )}

          {booking.cancellation_reason && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-xs font-semibold uppercase text-destructive">
                Bekor qilinish sababi
              </p>
              <p className="mt-1 text-sm">{booking.cancellation_reason}</p>
            </div>
          )}

          {canReview && user && (
            <ReviewSection booking={booking} userId={user.id} isStudent={isStudent} />
          )}
        </div>

        {/* RIGHT — Price summary */}
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              To&apos;lov
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <Row
                label="Oylik narx"
                value={formatPrice(booking.monthly_price, booking.currency)}
              />
              <Row
                label="Platforma komissiyasi"
                value={formatPrice(booking.platform_fee, booking.currency)}
              />
              <Row
                label="Xizmat haqi"
                value={formatPrice(booking.service_fee, booking.currency)}
              />
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4 text-lg font-bold">
              <span>Jami</span>
              <span>{formatPrice(booking.total_amount, booking.currency)}</span>
            </div>
          </div>

          {actionError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {actionError}
            </p>
          )}

          <div className="space-y-2">
            {canConfirm && (
              <Button
                className="w-full shadow-lg shadow-green-500/20"
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
              >
                <ThumbsUp className="h-4 w-4" />
                Bronni tasdiqlash
              </Button>
            )}
            {canAcceptContract && (
              <Button
                className="w-full"
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
                Shartnomani qabul qilish
              </Button>
            )}
            {canPay && (
              <Button
                className="w-full shadow-lg shadow-blue-500/20"
                onClick={() => {
                  setPayError(null);
                  setPayOpen(true);
                }}
              >
                <CreditCard className="h-4 w-4" />
                To&apos;lash
              </Button>
            )}
            {canReject && (
              <Button
                variant="outline"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setModal("reject")}
              >
                <XCircle className="h-4 w-4" />
                So&apos;rovni rad etish
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setModal("cancel")}
              >
                <XCircle className="h-4 w-4" />
                Bekor qilish
              </Button>
            )}
            {(() => {
              const isStudent = user?.role === "student";
              const peerId = isStudent ? booking.landlord_id : booking.student_id;
              const label = isStudent ? "Uy egasi bilan yozish" : "Talaba bilan yozish";
              return peerId ? (
                <StartChatButton
                  peerId={peerId}
                  bookingId={booking.id}
                  label={label}
                  variant="outline"
                />
              ) : null;
            })()}
            <Button asChild variant="ghost" className="w-full">
              <Link href={`/houses/${booking.house_id}`}>Uyni ko&apos;rish</Link>
            </Button>
          </div>
        </aside>
      </div>

      <PaymentModal
        open={payOpen}
        onClose={() => {
          if (!payMutation.isPending) {
            setPayOpen(false);
            setPayError(null);
          }
        }}
        amount={booking.total_amount}
        currency={booking.currency}
        isPending={payMutation.isPending}
        error={payError}
        onSubmit={(gateway) => payMutation.mutate(gateway)}
      />

      {isLandlord && booking.student_id && (
        <UserProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          userId={booking.student_id}
          name={booking.student_name ?? "Talaba"}
          role="student"
        />
      )}

      {/* Reason modal (cancel or reject) */}
      {modalConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl">
            <h3 className="text-lg font-bold">{modalConfig.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{modalConfig.subtitle}</p>
            <Label className="mt-4 block">Sabab</Label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 min-h-[100px] w-full rounded-lg border border-input bg-card p-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
              placeholder="Sababni yozing..."
            />
            <div className="mt-5 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setModal(null);
                  setReason("");
                }}
              >
                Yopish
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={reason.trim().length < 3 || modalConfig.loading}
                onClick={modalConfig.run}
              >
                {modalConfig.submit}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ReviewSection({
  booking,
  userId,
  isStudent,
}: {
  booking: { id: number; house_id: number; student_id: number };
  userId: number;
  isStudent: boolean;
}) {
  const { data } = useReviews({ booking_id: booking.id, page_size: 50 });
  const myReviews = data?.items.filter((r) => r.reviewer.id === userId) ?? [];

  const reviewedHouse = myReviews.some((r) => r.target_type === "house");
  const reviewedUser = myReviews.some((r) => r.target_type === "user");

  // For student review on landlord, we'd need landlord_id. Currently booking
  // doesn't expose it. Skip user review for student until we add landlord_id to
  // BookingDetail.
  const canReviewUser = !isStudent && !reviewedUser; // landlord → student only

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 p-5">
        <h3 className="font-bold">⭐ Sharh yozing</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ijara tugadi. Tajribangiz haqida sharh qoldiring.
        </p>
      </div>

      {isStudent && !reviewedHouse && (
        <ReviewForm
          bookingId={booking.id}
          target={{ type: "house", houseId: booking.house_id }}
          title="Uy haqida"
          subtitle="Uyning holati, qulayligi va tozaligi haqida sharh."
        />
      )}

      {canReviewUser && (
        <ReviewForm
          bookingId={booking.id}
          target={{ type: "user", userId: booking.student_id }}
          title="Talaba haqida"
          subtitle="Talabaning xulqi va to'lov qaydiyligi qanday edi?"
        />
      )}

      {myReviews.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
            Sizning sharhlaringiz
          </h4>
          <ReviewList filter={{ booking_id: booking.id, reviewer_id: userId }} />
        </div>
      )}
    </div>
  );
}

function Timeline({
  status,
  contract,
}: {
  status: string;
  contract: { student_accepted_at?: string | null; landlord_accepted_at?: string | null } | null;
}) {
  const studentAccepted = !!contract?.student_accepted_at;
  const landlordAccepted = !!contract?.landlord_accepted_at;

  const steps = [
    { label: "Bron yaratildi", done: true },
    { label: "Uy egasi tasdiqlashi", done: ["confirmed", "active", "ended"].includes(status) },
    { label: "Shartnoma qabul", done: studentAccepted && landlordAccepted },
    { label: "To'lov", done: ["active", "ended"].includes(status) },
    { label: "Yashash", done: status === "active" || status === "ended" },
  ];

  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              s.done ? "bg-green-500 text-white" : "border-2 border-muted bg-card text-muted-foreground"
            }`}
          >
            {s.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span className={s.done ? "font-medium" : "text-muted-foreground"}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}
