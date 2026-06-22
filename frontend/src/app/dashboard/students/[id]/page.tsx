"use client";

import {
  ArrowLeft,
  Ban,
  Building2,
  Cake,
  Calendar,
  ClipboardList,
  Clock,
  Crown,
  GraduationCap,
  Home,
  Mail,
  MapPin,
  Phone,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { StartChatButton } from "@/components/chat/start-chat-button";
import { Avatar } from "@/components/ui/avatar";
import { useCuratorStudent } from "@/lib/api/hooks";
import type {
  CurrentLandlordInfo,
  StudentBookingSummary,
  StudentComplaintSummary,
  StudentDetail,
} from "@/lib/api/curator";
import type { BookingStatus, ComplaintStatus } from "@/lib/api/types";
import { cn, formatPhone, formatPrice } from "@/lib/utils";

const BOOKING_STATUS: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: "Kutilmoqda", cls: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Tasdiqlangan", cls: "bg-blue-100 text-blue-700" },
  active: { label: "Faol", cls: "bg-green-100 text-green-700" },
  ended: { label: "Tugagan", cls: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Bekor qilingan", cls: "bg-red-100 text-red-700" },
  refunded: { label: "Qaytarilgan", cls: "bg-orange-100 text-orange-700" },
};

const COMPLAINT_STATUS: Record<ComplaintStatus, { label: string; cls: string }> = {
  new: { label: "Yangi", cls: "bg-red-100 text-red-700" },
  processing: { label: "Jarayonda", cls: "bg-yellow-100 text-yellow-800" },
  resolved: { label: "Hal qilingan", cls: "bg-green-100 text-green-700" },
};

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data, isLoading } = useCuratorStudent(Number.isFinite(id) ? id : null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-muted/40" />
        <div className="h-48 animate-pulse rounded-2xl bg-muted/40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl rounded-2xl border bg-card p-12 text-center">
        <UserIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <h2 className="mt-3 text-lg font-semibold">Talaba topilmadi</h2>
        <Link href="/dashboard/students" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Talabalar ro&apos;yxatiga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/dashboard/students"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Talabalar ro&apos;yxati
      </Link>

      <ProfileCard student={data} />

      {data.current_landlord && <CurrentLandlordCard landlord={data.current_landlord} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={ClipboardList}
          label="Faol bron"
          value={data.active_bookings_count}
          color="from-green-500 to-emerald-600"
        />
        <KpiCard
          icon={Receipt}
          label="Jami bron"
          value={data.total_bookings_count}
          color="from-blue-500 to-blue-700"
        />
        <KpiCard
          icon={ShieldAlert}
          label="Ochiq shikoyat"
          value={data.open_complaints_count}
          color={data.open_complaints_count > 0 ? "from-red-500 to-rose-600" : "from-gray-400 to-gray-500"}
        />
        <KpiCard
          icon={Wallet}
          label="Jami sarf"
          value={formatPrice(data.total_spent, "UZS")}
          color="from-purple-500 to-pink-600"
          isMoney
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BookingsList bookings={data.bookings} />
        <ComplaintsList complaints={data.complaints} />
      </div>
    </div>
  );
}

function CurrentLandlordCard({ landlord }: { landlord: CurrentLandlordInfo }) {
  const name =
    `${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim() || landlord.phone;

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-yellow-300/50 bg-gradient-to-br from-yellow-50 via-orange-50/50 to-transparent shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-foreground shadow-sm">
            <Home className="h-3 w-3" />
            Hozir yashayotgan kvartira egasi
          </span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <Avatar
                src={landlord.avatar_url}
                firstName={landlord.first_name}
                lastName={landlord.last_name}
                size="lg"
                gradient="yellow-orange"
                className="shadow-md ring-4 ring-background"
              />
              {landlord.is_pro && (
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-sm ring-2 ring-background">
                  <Crown className="h-3.5 w-3.5" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold">{name}</h3>
                {landlord.is_pro && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-foreground shadow-sm">
                    <Crown className="h-2.5 w-2.5" />
                    PRO
                  </span>
                )}
              </div>

              <Link
                href={`/houses/${landlord.house_id}`}
                className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <Building2 className="h-3.5 w-3.5" />
                {landlord.house_title || "Kvartira"}
              </Link>

              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                <a
                  href={`tel:${landlord.phone}`}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Phone className="h-3 w-3" />
                  {landlord.phone}
                </a>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(landlord.booking_start_date).toLocaleDateString("uz-UZ")} →{" "}
                  {new Date(landlord.booking_end_date).toLocaleDateString("uz-UZ")}
                </span>
              </div>
            </div>
          </div>

          <div className="md:ml-auto md:w-auto">
            <StartChatButton
              peerId={landlord.id}
              bookingId={landlord.booking_id}
              label="Uy egasi bilan chat"
              variant="default"
              size="default"
              fullWidth={false}
              className="w-full bg-foreground text-background shadow-md hover:bg-foreground/90 md:w-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileCard({ student }: { student: StudentDetail }) {
  const fullName =
    `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || student.phone;
  const birthYear = student.birth_date ? new Date(student.birth_date).getFullYear() : null;

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="bg-gradient-to-r from-blue-500/10 via-yellow-400/10 to-transparent p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <Avatar
            src={student.avatar_url}
            firstName={student.first_name}
            lastName={student.last_name}
            fallback="T"
            size="xl"
            className="shadow-lg ring-4 ring-background"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{fullName}</h1>
              {student.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                  <ShieldCheck className="h-3 w-3" />
                  Tasdiqlangan
                </span>
              )}
              {student.is_blocked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
                  <Ban className="h-3 w-3" />
                  Bloklangan
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <a
                href={`tel:${student.phone}`}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5" />
                {formatPhone(student.phone)}
              </a>
              {student.email && (
                <a
                  href={`mailto:${student.email}`}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {student.email}
                </a>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                A&apos;zo: {new Date(student.created_at).toLocaleDateString("uz-UZ")}
              </span>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <StartChatButton
              peerId={student.id}
              label="Talaba bilan chat"
              variant="default"
              size="default"
              fullWidth={false}
              className="shadow-md"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
        <InfoCell
          icon={Building2}
          label="Universitet"
          value={student.university_name || student.university_short || "Ko'rsatilmagan"}
          muted={!student.university_name && !student.university_short}
        />
        <InfoCell
          icon={GraduationCap}
          label="Kurs / Guruh"
          value={
            student.course
              ? `${student.course}-kurs${student.group_name ? ` · ${student.group_name}` : ""}`
              : "Ko'rsatilmagan"
          }
          muted={!student.course}
        />
        <InfoCell
          icon={GraduationCap}
          label="Fakultet"
          value={student.faculty || "Ko'rsatilmagan"}
          muted={!student.faculty}
        />
        <InfoCell
          icon={GraduationCap}
          label="HEMIS ID"
          value={student.hemis_id || "—"}
          muted={!student.hemis_id}
        />
        <InfoCell
          icon={Cake}
          label="Tug'ilgan"
          value={birthYear ? `${birthYear}` : "—"}
          muted={!birthYear}
        />
        <InfoCell
          icon={Clock}
          label="Oxirgi kirish"
          value={
            student.last_login_at
              ? new Date(student.last_login_at).toLocaleDateString("uz-UZ")
              : "—"
          }
          muted={!student.last_login_at}
        />
      </div>
    </section>
  );
}

function InfoCell({
  icon: Icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="bg-card p-4">
      <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className={cn("mt-1 text-sm font-medium", muted && "text-muted-foreground")}>{value}</p>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  isMoney,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  isMoney?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card p-5 transition hover:shadow-md">
      <div
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
          color,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className={cn("mt-3 font-extrabold tracking-tight", isMoney ? "text-lg md:text-xl" : "text-2xl md:text-3xl")}>
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function BookingsList({ bookings }: { bookings: StudentBookingSummary[] }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 inline-flex items-center gap-2 font-bold">
        <ClipboardList className="h-4 w-4 text-primary" />
        Bronlar
      </h2>
      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Hali bron yo&apos;q
        </div>
      ) : (
        <ul className="space-y-2">
          {bookings.map((b) => {
            const meta = BOOKING_STATUS[b.status] ?? BOOKING_STATUS.pending;
            return (
              <li key={b.id}>
                <Link
                  href={`/houses/${b.house_id}`}
                  className="block rounded-xl border bg-background p-3 transition hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{b.house_title || "Uy"}</p>
                      {b.house_region && (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {b.house_region}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        meta.cls,
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(b.start_date).toLocaleDateString("uz-UZ")} →{" "}
                      {new Date(b.end_date).toLocaleDateString("uz-UZ")}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(b.monthly_price, b.currency as "UZS" | "USD")}/oy
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ComplaintsList({ complaints }: { complaints: StudentComplaintSummary[] }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 inline-flex items-center gap-2 font-bold">
        <ShieldAlert className="h-4 w-4 text-primary" />
        Shikoyatlar
      </h2>
      {complaints.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Shikoyat yo&apos;q ✅
        </div>
      ) : (
        <ul className="space-y-2">
          {complaints.map((c) => {
            const meta = COMPLAINT_STATUS[c.status];
            return (
              <li key={c.id}>
                <Link
                  href={`/dashboard/complaints/${c.id}`}
                  className="block rounded-xl border bg-background p-3 transition hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 flex-1 text-sm font-semibold">{c.subject}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        meta.cls,
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("uz-UZ")}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
