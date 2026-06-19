"use client";

import {
  ArrowLeft,
  Bed,
  Building2,
  Calendar,
  CheckCircle2,
  Crown,
  Eye,
  Lock,
  MapPin,
  Phone,
  Ruler,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { StartChatButton } from "@/components/chat/start-chat-button";
import { ProBadge } from "@/components/dashboard/pro-badge";
import { FavoriteButton } from "@/components/houses/favorite-button";
import { PhotoGallery } from "@/components/houses/photo-gallery";
import { SingleHouseMap } from "@/components/maps/single-house-map";
import { ReviewList } from "@/components/reviews/review-list";
import { Button } from "@/components/ui/button";
import { useHouse } from "@/lib/api/hooks";
import { fullUploadUrl } from "@/lib/api/uploads";
import { formatPrice } from "@/lib/utils";

export default function HouseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data, isLoading, isError } = useHouse(Number.isFinite(id) ? id : null);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !data) return <DetailError />;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Orqaga
      </button>

      {/* title */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{data.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {[data.region, data.district, data.address].filter(Boolean).join(", ")}
            </span>
            {data.average_rating && Number(data.average_rating) > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-foreground">
                  {Number(data.average_rating).toFixed(1)}
                </span>
                <span>({data.reviews_count} sharh)</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {data.views_count} ko&apos;rishlar
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.is_top && (
            <span className="rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-bold uppercase shadow">
              ⭐ TOP e&apos;lon
            </span>
          )}
          <FavoriteButton
            houseId={data.id}
            initiallyFavorited={data.is_favorited ?? false}
            size="md"
            variant="inline"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* LEFT */}
        <div className="space-y-8">
          <PhotoGallery photos={data.photos} title={data.title} />

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Bed} label="Xonalar" value={String(data.rooms)} />
            {data.area_sqm && (
              <Stat icon={Ruler} label="Maydon" value={`${Number(data.area_sqm)} m²`} />
            )}
            {data.max_tenants && (
              <Stat icon={Users} label="Yashash" value={`${data.max_tenants} kishi`} />
            )}
            {data.floor && data.total_floors && (
              <Stat icon={Building2} label="Qavat" value={`${data.floor} / ${data.total_floors}`} />
            )}
          </div>

          {/* Description */}
          {data.description && (
            <div>
              <h2 className="text-xl font-bold">Tavsif</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {data.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {data.amenities.length > 0 && (
            <div>
              <h2 className="text-xl font-bold">Qulayliklar</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {data.amenities.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {a.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <div>
            <h2 className="text-xl font-bold">Joylashuv</h2>
            <div className="mt-4">
              <SingleHouseMap
                latitude={data.latitude}
                longitude={data.longitude}
                address={data.address}
              />
            </div>
          </div>

          {/* Reviews */}
          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Sharhlar</h2>
                {data.reviews_count > 0 && (
                  <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <strong className="text-foreground">
                      {Number(data.average_rating).toFixed(1)}
                    </strong>
                    · {data.reviews_count} ta sharh
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <ReviewList
                filter={{ house_id: data.id, page_size: 10 }}
                emptyText="Bu uy haqida hali sharhlar yo'q. Birinchi bo'lib sharh yozing!"
              />
            </div>
          </div>
        </div>

        {/* RIGHT — sticky booking sidebar */}
        <aside>
          <div className="sticky top-20 space-y-4">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="text-3xl font-extrabold">
                {formatPrice(data.price_per_month, data.currency)}
                <span className="text-sm font-normal text-muted-foreground"> /oy</span>
              </div>
              {data.deposit_amount && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Depozit: {formatPrice(data.deposit_amount, data.currency)}
                </p>
              )}

              <div className="mt-5 grid gap-2 text-sm">
                <Row icon={ShieldCheck} text="Avtomatik shartnoma" />
                <Row icon={Calendar} text="Faqat 2 kun oldin bron" />
                <Row icon={CheckCircle2} text="24 soatlik refund" />
              </div>

              {data.status === "rented" ? (
                <div className="mt-6 rounded-xl border-2 border-orange-300 bg-orange-50 p-4 text-center">
                  <p className="text-sm font-bold text-orange-900">
                    🔒 Hozirda ijaraga olingan
                  </p>
                  <p className="mt-1 text-xs text-orange-700">
                    Bu uy hozircha boshqa talaba tomonidan ijaraga olingan.
                    Ijara tugagach yana ochiladi.
                  </p>
                </div>
              ) : (
                <Button asChild size="lg" className="mt-6 w-full shadow-lg shadow-blue-500/20">
                  <Link href={`/bookings/new?house_id=${data.id}`}>Bron qilish</Link>
                </Button>
              )}
              <div className="mt-2">
                <StartChatButton
                  peerId={data.landlord_id}
                  label="Uy egasi bilan chat"
                  variant="outline"
                  size="lg"
                />
              </div>
            </div>

            {/* Landlord card */}
            <div
              className={
                data.landlord_is_pro
                  ? "rounded-2xl border border-yellow-300 bg-gradient-to-br from-yellow-50/40 to-card p-5 ring-1 ring-yellow-300/30"
                  : "rounded-2xl border bg-card p-5"
              }
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Uy egasi
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative">
                  {data.landlord_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fullUploadUrl(data.landlord_avatar) ?? data.landlord_avatar}
                      alt=""
                      className={
                        data.landlord_is_pro
                          ? "h-12 w-12 rounded-full object-cover ring-2 ring-yellow-400"
                          : "h-12 w-12 rounded-full object-cover"
                      }
                    />
                  ) : (
                    <div
                      className={
                        data.landlord_is_pro
                          ? "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-yellow-400 font-bold text-white ring-2 ring-yellow-400"
                          : "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-yellow-400 font-bold text-white"
                      }
                    >
                      {(data.landlord_name ?? "U")[0]?.toUpperCase()}
                    </div>
                  )}
                  {data.landlord_is_pro && (
                    <span
                      aria-label="PRO"
                      className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 ring-2 ring-card"
                    >
                      <Crown className="h-3 w-3 text-foreground" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold">{data.landlord_name ?? "Uy egasi"}</p>
                    {data.landlord_is_pro && <ProBadge size="sm" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.landlord_is_pro ? "Ishonchli uy egasi" : "Tasdiqlangan"}
                  </p>
                </div>
              </div>

              {/* Contact (phone) — PRO only */}
              <div className="mt-4 rounded-xl border bg-muted/30 p-3">
                {data.landlord_phone ? (
                  <a
                    href={`tel:${data.landlord_phone}`}
                    className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    {data.landlord_phone}
                  </a>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <span className="font-mono tracking-wider">+998 •• ••• •• ••</span>
                    </div>
                    <Link
                      href="/dashboard/subscription"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1.5 text-xs font-bold text-foreground shadow-sm transition hover:shadow-md"
                    >
                      <Crown className="h-3 w-3" />
                      PRO ga o&apos;tib raqamni ko&apos;ring
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Row({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 text-green-600" />
      <span className="text-foreground">{text}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="aspect-[16/9] animate-pulse rounded-2xl bg-muted" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

function DetailError() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-20 text-center">
      <h2 className="text-2xl font-bold">Uy topilmadi</h2>
      <p className="mt-2 text-muted-foreground">
        Bu e&apos;lon o&apos;chirilgan yoki mavjud emas.
      </p>
      <Button asChild className="mt-6">
        <Link href="/houses">Boshqa uylarni ko&apos;rish</Link>
      </Button>
    </div>
  );
}
